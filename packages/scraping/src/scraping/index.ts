import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { convert } from "html-to-text";
import puppeteer, { Page } from "puppeteer";
import * as z from "zod";

import {
  findTheJobsListingUrlUsingAI,
  ScrapeProtencialUrlsWithScrapefly,
} from "../scrapeHelper/index";
import {
  combinePathToACompleteUrl,
  findTheProtencialJobTitles,
  findTheSelectorsOfTheJobTitles,
  foo,
  getJobDetails,
  isPath,
  isThisPageLayoutContainTheJobDetails,
  isThisTheJobPostingPage,
  isThisUrlContainTheInformationNeeded,
  isThisUrlTheJobListingPage,
  potentcialJobPostingButtonName,
  reCombineThePathToACompleteUrl,
} from "./helper";

export class ScrapingService {
  private static instance: ScrapingService;

  private constructor() {}

  public static getInstance(): ScrapingService {
    if (!ScrapingService.instance) {
      ScrapingService.instance = new ScrapingService();
    }
    return ScrapingService.instance;
  }

  private JobTitleName: string[] = [];
  private JobPostingUrl: string[] = [];
  private extractedJobDetails: any[] = [];
  // first scape all the possible url from the company job url
  async findTheJobListingPageUrl(companyDomain: string) {
    const jobListingUrls: string[] = [];
    console.log(`calling the function find the job listing page url`);
    // innitially try with scrapefly
    const urls = await ScrapeProtencialUrlsWithScrapefly(companyDomain);
    if (urls) {
      // using ai to find the most likely job listing url based on the pattern of the url.(nullable)
      const object = await findTheJobsListingUrlUsingAI(urls);
      if (object) {
        console.log(`urls extracted by ai: ${object}`);
        for (const url of object) {
          const width = 1024;
          const height = 1600;
          const browser = await puppeteer.launch({
            defaultViewport: { width, height },
            headless: "shell",
            slowMo: 500,
          });
          const page = await browser.newPage();
          await Promise.all([
            page.goto(url, { waitUntil: "networkidle2" }),
            // TODO: change this back when have a better wifi
            page.waitForNavigation({
              timeout: 50000,
            }),
          ]);
          const pageLayout = await this.getPageLayout(page, false);
          const { object: foo } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
              isThisUrlTheJobListingPage: z.boolean(),
            }),
            prompt: isThisUrlTheJobListingPage({ pageLayout }),
          });
          if (foo.isThisUrlTheJobListingPage) {
            jobListingUrls.push(url);
          }
          await browser.close();
        }
        console.log(
          "AI response, this is the job listing urls contain information",
          jobListingUrls,
        );
        return jobListingUrls;
      } else {
        // if scrapefly failed, try with puppeteer
        const urls =
          await this.scrapeAllPotentialUrlsWithPuppeteer(companyDomain);
        if (urls) {
          console.log(`urls extracted by puppeteer: ${urls}`);
          const object = await findTheJobsListingUrlUsingAI(urls);
          if (object) {
            for (const url of object) {
              console.log(`urls extracted by ai: ${object}`);
              const width = 1024;
              const height = 1600;
              const browser = await puppeteer.launch({
                defaultViewport: { width, height },
                headless: "shell",
              });
              const page = await browser.newPage();
              await page.goto(url, { waitUntil: "networkidle2" });
              const pageLayout = await this.getPageLayout(page, false);
              const { object: foo } = await generateObject({
                model: openai("gpt-4o-mini"),
                schema: z.object({
                  isThisUrlTheJobListingPage: z.boolean(),
                }),
                prompt: isThisUrlTheJobListingPage({ pageLayout }),
              });
              if (foo.isThisUrlTheJobListingPage) {
                jobListingUrls.push(url);
              }
              await browser.close();
            }
            console.log(
              "AI response, this is the job listing urls contain information",
              jobListingUrls,
            );

            return jobListingUrls;
          }
        }
        return null;
      }
    }
    return null;
  }

  // using gpt to find the most likely job listing url based on the pattern of the url. (nullable)
  async scrapeAllPotentialUrlsWithPuppeteer(
    companyUrl: string,
  ): Promise<string[] | null> {
    try {
      const browser = await puppeteer.launch({
        headless: "shell",
        defaultViewport: { width: 1024, height: 1600 },
        slowMo: 1000,
      });
      const page = await browser.newPage();
      await page.goto(companyUrl, { waitUntil: "networkidle2" });
      const urls = await this.getAllHrefs(page);
      // Extract URLs from the page layout
      await browser.close();
      return urls;
    } catch (error) {
      console.error(`Error scraping ${companyUrl}:`, error);
      return null;
    }
  }

  async getAllHrefs(page: Page): Promise<string[]> {
    const hrefs = await page.evaluate(() => {
      // Find all <a> tags and extract their href attributes
      const links = document.querySelectorAll("a");
      return Array.from(links)
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => {
          // Filter out null, undefined, and empty strings
          return href !== null && href !== undefined && href.trim() !== "";
        });
    });

    return hrefs;
  }

  // using puppeteer to get the page layout (not nullable)
  async getPageLayout(page: Page, foo: boolean) {
    const pageLayout = await page.evaluate((isJobDetails) => {
      const simplifyHTML = (element: Element): string => {
        if (element.nodeType === Node.TEXT_NODE) {
          return element.textContent?.trim() || "";
        }
        if (element.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }
        const tagName = element.tagName.toLowerCase();
        if (
          ["script", "style", "noscript", "iframe", "svg"].includes(tagName)
        ) {
          return "";
        }
        const href =
          element.tagName.toLowerCase() === "a"
            ? element.getAttribute("href")
            : null;
        const childContent = Array.from(element.childNodes)
          .map((child: ChildNode) => simplifyHTML(child as Element))
          .filter((content: string) => content.length > 0)
          .join(" ");
        if (childContent.length === 0) {
          return "";
        }
        const classAttr = element.getAttribute("class");
        const classString = classAttr ? ` class="${classAttr}"` : "";
        console.log("href", href);
        if (!isJobDetails) {
          return `<${tagName}${classString}>${childContent}</${tagName}>`;
        } else {
          return childContent;
        }
      };
      console.log("simplifyHTML", simplifyHTML(document.body));
      return simplifyHTML(document.body);
    }, foo);
    return pageLayout;
  }
  // main function
  async scrapeJobPostingPage(companyDomain: string) {
    const jobListingUrls = await this.findTheJobListingPageUrl(companyDomain);
    if (!jobListingUrls) {
      console.log("jobListingUrls is null");
      return null;
    }
    console.log("START SCRAPING");

    for (const url of jobListingUrls) {
      const JobPostingUrls =
        await this.scrapeJobListingsWithPuppeteerAndAI(url);
      if (JobPostingUrls && JobPostingUrls.length > 0) {
        const width = 1024;
        const height = 1600;
        const browser = await puppeteer.launch({
          defaultViewport: { width, height },
          headless: "shell",
          slowMo: 500,
        });
        const page = await browser.newPage();
        console.log("jobListingUrls detected:", JobPostingUrls);
        for (const JobPostingUrl of JobPostingUrls) {
          console.log("Process this job posting url", JobPostingUrl);

          await page.goto(JobPostingUrl, { waitUntil: "networkidle2" });
          let pageLayout: string;
          // get the page layout
          await this.scrollToBottom(page);

          const pageContent = await page.content();
          if (!pageContent) {
            await page.waitForNetworkIdle({
              timeout: 10000,
            });
          }
          pageLayout = convert(pageContent);
          const isThisLayoutContainTheJobDetails =
            await this.isThisLayoutContainTheJobDetails(
              pageLayout,
              companyDomain,
              this.JobTitleName,
            );
          if (isThisLayoutContainTheJobDetails) {
            const object = await this.extractJobsDetails(
              pageLayout,
              this.JobTitleName,
              this.extractedJobDetails,
            );
            console.log(object);
            this.extractedJobDetails.push(object);
          } else {
            console.log("None job details detected, scraping iframe");
            const frameUrl = await this.getFrameUrl(page);
            if (frameUrl && frameUrl.length > 0) {
              for (const url of frameUrl) {
                console.log("found frameUrl", frameUrl);
                await page.goto(url, { waitUntil: "networkidle2" });
                const pageContent = await page.content();
                pageLayout = convert(pageContent);
                const { object: foo } = await generateObject({
                  model: openai("gpt-4o-mini"),
                  schema: z.object({
                    isThisTheJobPostingPage: z.boolean(),
                  }),
                  prompt: isThisTheJobPostingPage({ pageLayout }),
                });
                if (!foo.isThisTheJobPostingPage) {
                  continue;
                }
                const object = await this.extractJobsDetails(
                  pageLayout,
                  this.JobTitleName,
                  this.extractedJobDetails,
                );
                console.log(object);
                this.extractedJobDetails.push(object);
              }
            }
          }
        }
        await browser.close();
      } else {
        console.log("no job posting urls detected");
      }
    }
    return this.extractedJobDetails;
  }

  async isThisLayoutContainTheJobDetails(
    pageLayout: string,
    domain: string,
    jobTitles: string[],
  ) {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        isThisLayoutContainTheJobDetails: z.boolean(),
      }),
      prompt: isThisPageLayoutContainTheJobDetails({
        pageLayout,
        domain,
        jobTitles,
      }),
    });
    console.log(
      "Return from AI this page layout is contain the job details:",
      object.isThisLayoutContainTheJobDetails,
    );
    return object.isThisLayoutContainTheJobDetails;
  }

  // helper function to check if the job title appear in the page layout
  isTheJobTitleAppearInTheLayout(pageLayout: string) {
    for (const jobTitle of this.JobTitleName) {
      console.log("jobTitle bla bla bla bla", jobTitle);
      if (pageLayout.toLowerCase().includes(jobTitle.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  // helper function to extract the job details from the page layout
  private async extractJobsDetails(
    pageLayout: string,
    jobTitles: string[],
    alreadyProcessed: any[],
  ) {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        jobNameProcessing: z.string(),
        company: z.string(),
        roleTitle: z.string(),
        roleDescription: z.string().nullable(),
        roleLocation: z.string().nullable(),
        roleSalary: z.string().nullable(),
        dateFirstPosted: z.string().nullable(),
        status: z.string(),
      }),
      prompt: getJobDetails({ pageLayout, jobTitles, alreadyProcessed }),
    });
    return object;
  }

  // helper function to get the iframe url
  private async getFrameUrl(page: Page) {
    try {
      // Get all iframe URLs
      const iframeUrls = await page.evaluate(() => {
        const iframes = document.querySelectorAll("iframe");
        return Array.from(iframes)
          .map((iframe) => iframe.src)
          .filter((src) => src);
      });

      // Filter out URLs that lead to blank pages
      const validUrls = [];
      for (const url of iframeUrls) {
        try {
          const newPage = await page.browser().newPage();
          await newPage.goto(url, {
            waitUntil: "networkidle0",
            timeout: 10000,
          });

          // Check if page has content
          const hasContent = await newPage.evaluate(() => {
            const body = document.body;
            return body && body.innerHTML.trim().length > 0;
          });

          if (hasContent) {
            validUrls.push(url);
          }

          await newPage.close();
        } catch (error) {
          console.error(`Error checking URL ${url}:`, error);
        }
      }
      console.log("validUrls", validUrls);
      return validUrls;
    } catch (error) {
      console.error("Error getting frame URLs:", error);
      return null;
    }
  }

  // helper function to scrape the job listings with puppeteer and ai
  private async scrapeJobListingsWithPuppeteerAndAI(
    url: string,
  ): Promise<string[] | null> {
    const jobLinks: string[] = [];
    const width = 1024;
    const height = 1600;
    const browser = await puppeteer.launch({
      defaultViewport: { width, height },
      headless: "shell",
      slowMo: 200,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    await this.scrollToBottom(page);
    // Get the page layout
    const pageLayout = await this.getPageLayout(page, false);
    let jobUrl: string[] | null = [];
    // scrape with out the identify button
    jobUrl = await this.SearchAndScrapeTheWebWithoutIdentifyButton({
      page,
      domainUrl: url,
    });
    if (!jobUrl) {
      console.log("cant use regular scraping,try start scraping with button");
      // scrape with identify button
      jobUrl = await this.SearchAndScrapeWebsiteWithIdentifyButton({
        pageLayout,
        page,
        domainUrl: url,
      });
    }
    // Search for potential job posting buttons (if any)
    jobUrl?.map((url) => {
      jobLinks.push(url);
    });
    await browser.close();
    return jobLinks.length > 0 ? jobLinks : null;
  }

  async SearchAndScrapeWebsiteWithIdentifyButton({
    pageLayout,
    page,
    domainUrl,
  }: {
    pageLayout: string;
    page: Page;
    domainUrl: string;
  }) {
    // console.log(`scrape the website with identify button`);
    const jobLinks: string[] = [];
    for (const buttonName of potentcialJobPostingButtonName) {
      const buttonPattern = new RegExp(
        `<([^>]+)[^>]*>\\s*${buttonName}\\s*<\\/\\1>`,
        "i",
      );
      const match = pageLayout.match(buttonPattern);
      if (match) {
        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: z.object({
            jobTitles: z.array(z.string()).nullable(),
          }),
          temperature: 0,
          prompt: findTheProtencialJobTitles({ pageLayout }),
        });
        if (!object.jobTitles) {
          console.log("No opening role detected");
          return null;
        }
        const jobTitles = object.jobTitles;
        console.log("jobTitles", jobTitles);
        if (jobTitles && jobTitles.length > 0) {
          for (const jobTitle of jobTitles) {
            this.JobTitleName.push(jobTitle);
            const { object } = await generateObject({
              model: openai("gpt-4o-mini"),
              schema: z.object({
                selector: z.string().nullable(),
              }),
              prompt: findTheSelectorsOfTheJobTitles({
                jobTitle: jobTitle,
                pageLayout: pageLayout,
              }),
            });
            const selector = object.selector;
            console.log("selector", selector);
            if (selector) {
              const jobUrls = await this.getUrlBackFromTheSelector({
                page,
                selector,
              });
              if (jobUrls) {
                jobUrls.map((url) => jobLinks.push(url));
              }
            }
          }
        }
      }
    }
    return jobLinks.length > 0 ? jobLinks : null;
  }

  async SearchAndScrapeTheWebWithoutIdentifyButton({
    page,
    domainUrl,
  }: {
    page: Page;
    domainUrl: string;
  }) {
    const pageLayout = await this.getTagWithHref(page);
    const jobLinks: string[] = [];
    const { object: jobTitleNames } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        jobTitles: z.array(z.string()).nullable(),
      }),
      temperature: 0,
      prompt: findTheProtencialJobTitles({ pageLayout }),
    });
    if (!jobTitleNames.jobTitles) {
      console.log("No opening role detected");
      return null;
    }
    console.log("Job Titles detected:", jobTitleNames);
    for (const jobTitle of jobTitleNames.jobTitles) {
      this.JobTitleName.push(jobTitle);

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          url: z.string(),
        }),
        prompt: foo({
          jobTitle: jobTitle,
          pageLayout: pageLayout,
        }),
      });

      const { object: path } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          isThisAPath: z.boolean(),
        }),
        prompt: isPath({ url: object.url }),
      });
      if (path.isThisAPath) {
        // TODO: this one some time wokring unexpectedly, need to validate the page layout more after log the url out
        const { object: url } = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: z.object({
            url: z.string(),
          }),
          prompt: combinePathToACompleteUrl({
            domain: domainUrl,
            path: object.url,
          }),
        });
        console.log("url combined from AI", url.url);
        console.log("validate the url");
        const isValidUrl =
          await this.validateThePageLayoutAfterGettingTheTargetUrl(url.url);
        console.log("isValidUrl", isValidUrl);
        if (!isValidUrl) {
          console.log("recombine the url");
          const { object: url } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
              url: z.string(),
            }),
            prompt: reCombineThePathToACompleteUrl({
              domain: domainUrl,
              path: object.url,
            }),
          });
          console.log("re validate the url after recombine the url");
          const isValidUrl =
            await this.validateThePageLayoutAfterGettingTheTargetUrl(url.url);
          if (!isValidUrl) {
            continue;
          }
          console.log(`URL combinded from AI: ${url.url}`);
          jobLinks.push(url.url);
        }
      } else {
        const url = object.url;
        if (url) {
          jobLinks.push(url);
        }
      }
    }
    return jobLinks.length > 0 ? jobLinks : null;
  }
  private async validateThePageLayoutAfterGettingTheTargetUrl(url: string) {
    // validate page again after getting the url
    const width = 1024;
    const height = 1600;
    const browser = await puppeteer.launch({
      defaultViewport: { width, height },
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto(url);
    await this.scrollToBottom(page);
    const initialLayout = await page.content();
    const pageContent = convert(initialLayout);

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        isThisUrlContainTheInformationNeeded: z.boolean(),
      }),
      prompt: isThisUrlContainTheInformationNeeded({ pageContent }),
    });
    if (object.isThisUrlContainTheInformationNeeded) {
      await browser.close();
      return true;
    }
    await browser.close();
    return false;
  }
  // scroll to the bottom of the page
  private async scrollToBottom(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async getUrlBackFromTheSelector({
    page,
    selector,
  }: {
    page: Page;
    selector: string;
  }) {
    const jobLinks: string[] | null = [];
    try {
      const elements = await page.$$(selector);
      for (let i = 0; i < elements.length; i++) {
        try {
          // Re-query the element each time to ensure we're in the correct context
          const elements = await page.$$(selector);
          const element = elements[i];
          console.log(`index: ${i}`);
          // Check visibility
          const isVisible = await element?.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });

          if (!isVisible) continue;

          // Scroll into view
          await element?.evaluate((el) => {
            el.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          });
          await page.waitForSelector(selector, { timeout: 10000 });
          await element?.hover();
          // Click the element directly
          await element?.click();
          await Promise.race([
            page.waitForNavigation({ timeout: 10000 }),
            page.waitForNetworkIdle({ timeout: 10000 }),
          ]);
          const currentUrl = await page.url();
          console.log("Current URL:", currentUrl);

          if (this.JobPostingUrl.includes(currentUrl)) {
            await page.goBack({
              waitUntil: "networkidle0",
              timeout: 10000,
            });
            console.log("go back 1");
            continue;
          }
          this.JobPostingUrl.push(currentUrl);
          jobLinks.push(currentUrl);
          await page.goBack({
            waitUntil: "networkidle0",
            timeout: 10000,
          });
          console.log("go back 2");
        } catch (error) {
          console.error("Error processing element:", error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error processing selector "${selector}":`, error);
    }
    return jobLinks.length > 0 ? jobLinks : null;
  }

  async getTagWithHref(page: Page) {
    const tagWithHrefs = await page.evaluate(() => {
      const elements = document.querySelectorAll("*[href]");
      return Array.from(elements)
        .map((element) => {
          const tagName = element.tagName.toLowerCase();
          const href = element.getAttribute("href");
          const hrefString = href ? ` href="${href}"` : "";
          const childContent = element.textContent?.trim() || "";

          return `<${tagName}${hrefString}>${childContent}</${tagName}>`;
        })
        .filter(
          (html) => !html.includes("javascript:") && !html.includes('href="#"'),
        )
        .join(" ");
    });

    return tagWithHrefs;
  }
}
