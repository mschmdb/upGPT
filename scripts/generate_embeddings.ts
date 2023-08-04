import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import puppeteer, { Browser } from 'puppeteer';
// @ts-ignore
import TurndownService from 'turndown';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { PineconeClient } from "@pinecone-database/pinecone";


const client = new PineconeClient();

let pineconeIndex;

const turndownService = new TurndownService();

// throw error if environment variables are not set
if (!process.env.PINECONE_API_KEY) {
	throw new Error('PINECONE_API_KEY is not set');
}
if (!process.env.PINECONE_ENVIRONMENT) {
	throw new Error('PINECONE_ENVIRONMENT is not set');
}
if (!process.env.PINECONE_INDEX) {
	throw new Error('PINECONE_INDEX is not set');
}
if (!process.env.PINECONE_API_KEY) {
	throw new Error('PINECONE_API_KEY is not set');
}


async function main() {
	await client.init({
		apiKey: process.env.PINECONE_API_KEY,
		environment: process.env.PINECONE_ENVIRONMENT,
	});

	pineconeIndex = client.Index(process.env.PINECONE_INDEX);

	const markdowns = await scrape_all_pages();
	// const markdowns = await get_all_pages_from_cache();
	await generate_embeddings(markdowns.join('\n\n'));
}

main();

async function get_all_pages_from_cache(): Promise<string> {
	return await readFile('generated/all.txt', 'utf8');
}

/**
 * Scrapes all researchr pages and saves them to a file
 *
 * @returns the markdowns of all researchr pages
 *
 */


async function scrape_all_pages(): Promise<string[]> {
	const urls = [
		"https://new.epo.org/en/legal/guide-up/2022/index.html",
		"https://new.epo.org/en/legal/guidelines-pct/2023/index.html",
		// "https://new.epo.org/en/legal/guidelines-epc/2023/index.html",
		// add more base URLs here
	]; 
	const markdowns: string[] = [];

	for (const url of urls) {
		console.log(`Ready to scrape from base URL: ${url}`);

		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(url);

		// Get all URLs from each base page within the specified div
		const pageUrls = await page.evaluate(() => {
			let links = Array.from(document.querySelectorAll('.site-left-menu a'));
			console.log(links);
			return links.map(link => (link as HTMLAnchorElement).href);
		});

		console.log(`Got ${pageUrls.length} urls ready to scrape`);

		for (const url of pageUrls) {
			try {
				const markdown = await scrape_researchr_page(url, browser);
				markdowns.push(markdown);
			} catch (e) {
				console.log(`Error scraping ${url}`, e);
			}
		}
		await browser.close();
	}

	console.log(`Got ${markdowns.length} markdowns ready to save`);

	// save all markdowns to a file in the generated folder. If the folder does not exist, create it
	try {
		await readdir('./generated');
	} catch (e) {
		await mkdir('./generated');
	}
	await writeFile('./generated/all.txt', markdowns.join('\n\n'));
	console.log(`Saved all markdowns to ./generated/all.txt`);

	return markdowns;
}



/**
 * Generates embeddings for the given markdowns and saves them to a pinecone index
 * @param markdowns the markdowns to generate embeddings for
 *
 */
async function generate_embeddings(markdowns: string) {
	const textSplitter = new MarkdownTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 20
	});
	const embeddings = await textSplitter.splitText(markdowns);
	console.log(`Got ${embeddings.length} embeddings ready to save`);

	const embeddingModel = new OpenAIEmbeddings({ maxConcurrency: 5 });

	await PineconeStore.fromTexts(embeddings, [], embeddingModel, {
		pineconeIndex
	});
	console.log(`Saved embeddings to pinecone index ${pineconeIndex}`);
}

/**
 * Scrapes the researchr page and returns the markdown
 *
 * @param url the url of the researchr page
 * @param browser the puppeteer browser
 * @returns the markdown of the researchr page
 */
async function scrape_researchr_page(url: string, browser: Browser): Promise<string> {
	const page = await browser.newPage();
	await page.goto(url);

	// Wait for the element to be rendered
	await page.waitForSelector('.lc-inline_column_second-edit.layoutcomponent-column.col-sm-12.col-md-12.col-lg-6.show-modification-body.legal-text-navigation-buttons');

	const elementHandle = await page.$('.lc-inline_column_second-edit.layoutcomponent-column.col-sm-12.col-md-12.col-lg-6.show-modification-body.legal-text-navigation-buttons');

	if (!elementHandle) {
		throw new Error('Could not find element');
	}

	const elementHTML = await elementHandle.evaluate((element) => element.textContent);

	return turndownService.turndown(elementHTML);
}
