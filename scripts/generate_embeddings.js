"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var promises_1 = require("node:fs/promises");
var puppeteer_1 = require("puppeteer");
// @ts-ignore
var turndown_1 = require("turndown");
var promises_2 = require("fs/promises");
var text_splitter_1 = require("langchain/text_splitter");
var embeddings_1 = require("langchain/embeddings");
var vectorstores_1 = require("langchain/vectorstores");
var pinecone_1 = require("@pinecone-database/pinecone");
var client = new pinecone_1.PineconeClient();
var pineconeIndex;
var turndownService = new turndown_1.default();
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var markdowns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.init({
                        apiKey: process.env.PINECONE_API_KEY,
                        environment: process.env.PINECONE_ENVIRONMENT,
                    })];
                case 1:
                    _a.sent();
                    pineconeIndex = client.Index(process.env.PINECONE_INDEX);
                    return [4 /*yield*/, scrape_all_pages()];
                case 2:
                    markdowns = _a.sent();
                    // const markdowns = await get_all_pages_from_cache();
                    return [4 /*yield*/, generate_embeddings(markdowns.join('\n\n'))];
                case 3:
                    // const markdowns = await get_all_pages_from_cache();
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
function get_all_pages_from_cache() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, promises_1.readFile)('generated/all.txt', 'utf8')];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Scrapes all researchr pages and saves them to a file
 *
 * @returns the markdowns of all researchr pages
 *
 */
function getURLs(browser) {
    return __awaiter(this, void 0, void 0, function () {
        var rootURL, page, urls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rootURL = 'https://new.epo.org/en/legal/guide-up/2022/';
                    return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    return [4 /*yield*/, page.goto(rootURL, { waitUntil: 'networkidle2' })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.$$eval('a', function (as) { return as.map(function (a) { return a.href; }).filter(function (href) { return href.startsWith(rootURL); }); })];
                case 3:
                    urls = _a.sent();
                    return [4 /*yield*/, page.close()];
                case 4:
                    _a.sent();
                    return [2 /*return*/, urls];
            }
        });
    });
}
function scrape_all_pages() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, urls, markdowns, _i, urls_1, url, markdown, e_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch()];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, getURLs(browser)];
                case 2:
                    urls = _a.sent();
                    console.log("Got ".concat(urls.length, " urls ready to scrape"));
                    markdowns = [];
                    _i = 0, urls_1 = urls;
                    _a.label = 3;
                case 3:
                    if (!(_i < urls_1.length)) return [3 /*break*/, 8];
                    url = urls_1[_i];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, scrape_researchr_page(url, browser)];
                case 5:
                    markdown = _a.sent();
                    markdowns.push(markdown);
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    console.log("Error scraping ".concat(url));
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [4 /*yield*/, browser.close()];
                case 9:
                    _a.sent();
                    console.log("Got ".concat(markdowns.length, " markdowns ready to save"));
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 12, , 14]);
                    return [4 /*yield*/, (0, promises_2.readdir)('./generated')];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 12:
                    e_2 = _a.sent();
                    return [4 /*yield*/, (0, promises_2.mkdir)('./generated')];
                case 13:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 14: return [4 /*yield*/, (0, promises_2.writeFile)('./generated/all.txt', markdowns.join('\n\n'))];
                case 15:
                    _a.sent();
                    console.log("Saved all markdowns to ./generated/all.txt");
                    return [2 /*return*/, markdowns];
            }
        });
    });
}
/**
 * Generates embeddings for the given markdowns and saves them to a pinecone index
 * @param markdowns the markdowns to generate embeddings for
 *
 */
function generate_embeddings(markdowns) {
    return __awaiter(this, void 0, void 0, function () {
        var textSplitter, embeddings, embeddingModel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    textSplitter = new text_splitter_1.MarkdownTextSplitter({
                        chunkSize: 1000,
                        chunkOverlap: 20
                    });
                    return [4 /*yield*/, textSplitter.splitText(markdowns)];
                case 1:
                    embeddings = _a.sent();
                    console.log("Got ".concat(embeddings.length, " embeddings ready to save"));
                    embeddingModel = new embeddings_1.OpenAIEmbeddings({ maxConcurrency: 5 });
                    return [4 /*yield*/, vectorstores_1.PineconeStore.fromTexts(embeddings, [], embeddingModel, {
                            pineconeIndex: pineconeIndex
                        })];
                case 2:
                    _a.sent();
                    console.log("Saved embeddings to pinecone index ".concat(pineconeIndex));
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Scrapes the researchr page and returns the markdown
 *
 * @param url the url of the researchr page
 * @param browser the puppeteer browser
 * @returns the markdown of the researchr page
 */
function scrape_researchr_page(url, browser) {
    return __awaiter(this, void 0, void 0, function () {
        var page, element, html_of_element;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    return [4 /*yield*/, page.setJavaScriptEnabled(false)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.waitForSelector('#content > div.row > div', {
                            timeout: 100
                        })];
                case 4:
                    element = _a.sent();
                    if (!element) {
                        throw new Error('Could not find element');
                    }
                    // keep only content elements (like p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, table, dl, div)
                    return [4 /*yield*/, element.evaluate(function (element) {
                            var _a;
                            var elements = element.querySelectorAll('*:not(p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, table, dl, div)');
                            for (var i = 0; i < elements.length; i++) {
                                (_a = elements[i].parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(elements[i]);
                            }
                        })];
                case 5:
                    // keep only content elements (like p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, table, dl, div)
                    _a.sent();
                    return [4 /*yield*/, element.evaluate(function (element) { return element.innerHTML; })];
                case 6:
                    html_of_element = _a.sent();
                    return [2 /*return*/, turndownService.turndown(html_of_element)];
            }
        });
    });
}
