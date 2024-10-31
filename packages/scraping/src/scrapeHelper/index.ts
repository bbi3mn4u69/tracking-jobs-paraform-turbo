import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { JSDOM } from "jsdom";
import { ScrapeResult, ScrapflyClient } from "scrapfly-sdk";
import { ScrapeConfig } from "scrapfly-sdk";
import { z } from "zod";
import { findJobPostingUrl } from "../scraping/helper";

// helper function to extract all the urls from the company domain
export const extractUrls = (content: string, baseUrl: string): string[] => {
  console.log(`calling the function extractUrls`);
  const urls: string[] = [];
  const dom = new JSDOM(content);
  const doc = dom.window.document;

  const extractLinksFromElement = (element: Element) => {
    if (element.tagName === "A" && element.hasAttribute("href")) {
      try {
        const url = new URL(element.getAttribute("href")!, baseUrl);
        if (url.hostname === new URL(baseUrl).hostname) {
          urls.push(url.href);
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    }

    for (const child of element.children) {
      extractLinksFromElement(child);
    }
  };

  extractLinksFromElement(doc.body);
  return [...new Set(urls)]; // Remove duplicates
};

// using scrapefly to scrape the company domain and extract the urls (nullable)
export const ScrapeProtencialUrlsWithScrapefly = async (companyUrl: string) => {
  const client = new ScrapflyClient({ key: process.env.SCRAPEFLY_API_KEY! });

  const config: ScrapeConfig = new ScrapeConfig({
    url: companyUrl,
    asp: true,
    country: "US",
    render_js: true,
  });
  const result: ScrapeResult = await client.scrape(config);

  if (result) {
    const content = result.result.content;
    return extractUrls(content, companyUrl);
  }
  return null;
};

export async function findTheJobsListingUrlUsingAI(urls: string[]) {
  if (!urls) {
    return null;
  }
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      urls: z.array(z.string()).nullable(),
    }),
    temperature: 0,
    prompt: findJobPostingUrl({ arrayOfUrls: urls }),
  });
  console.log();
  return object.urls;
}
