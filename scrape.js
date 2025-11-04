import puppeteer from "puppeteer";
import fsPromises from "fs/promises";

const HEADLESS = process.env.HEADLESS !== "false";
const parseLimit = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const LEETCODE_TARGET = parseLimit(process.env.LEETCODE_LIMIT, 100);
const LEETCODE_DESCRIPTIONS = parseLimit(process.env.LEETCODE_DESCRIPTIONS, 10);
const CODEFORCES_PAGES = parseLimit(process.env.CODEFORCES_PAGES, 2);
const CODEFORCES_PER_PAGE = parseLimit(process.env.CODEFORCES_PER_PAGE, 10);
const SCRAPE_DELAY = parseLimit(process.env.SCRAPE_DELAY_MS, 300);
const launchOptions = {
  headless: HEADLESS ? "new" : false,
  defaultViewport: null,
  args: ["--disable-blink-features=AutomationControlled"],
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/114.0.5735.199 Safari/537.36";

async function scrapeLeetcodeProblems(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.goto("https://leetcode.com/problemset/", {
    waitUntil: "domcontentloaded",
  });

  const problemSelector =
    "a.group.flex.flex-col.rounded-\\[8px\\].duration-300";

  let allProblems = [];
  let prevCount = 0;

  while (allProblems.length < LEETCODE_TARGET) {
    await page.evaluate((sel) => {
      const currProblemsOnPage = document.querySelectorAll(sel);

      if (currProblemsOnPage.length) {
        currProblemsOnPage[currProblemsOnPage.length - 1].scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, problemSelector);

    await page.waitForFunction(
      (sel, prev) => document.querySelectorAll(sel).length > prev,
      {},
      problemSelector,
      prevCount
    );

    allProblems = await page.evaluate((sel) => {
      const nodes = Array.from(document.querySelectorAll(sel));

      return nodes.map((el) => ({
        title: el
          .querySelector(".ellipsis.line-clamp-1")
          ?.textContent.trim()
          .split(". ")[1],
        url: el.href,
      }));
    }, problemSelector);

    prevCount = allProblems.length;
    await delay(SCRAPE_DELAY);
  }

  const problemsWithDescriptions = [];

  for (let i = 0; i < Math.min(LEETCODE_DESCRIPTIONS, allProblems.length); i++) {
    const { title, url } = allProblems[i];

    const problemPage = await browser.newPage();

    try {
      await problemPage.setUserAgent(userAgent);
      await problemPage.goto(url, { waitUntil: "domcontentloaded" });

      const description = await problemPage.evaluate(() => {
        const descriptionDiv = document.querySelector(
          'div.elfjS[data-track-load="description_content"]'
        );
        if (!descriptionDiv) {
          return "";
        }
        const paragraphs = Array.from(descriptionDiv.querySelectorAll("p"));
        const collectedDescription = [];
        for (const p of paragraphs) {
          if (p.innerHTML.trim() === "&nbsp;") {
            break;
          }
          const text = (p.innerText || "").trim();
          if (text) {
            collectedDescription.push(text);
          }
        }
        return collectedDescription.join(" ");
      });

      problemsWithDescriptions.push({ title, url, description });
    } catch (err) {
      console.error(`Error fetching description for ${title} (${url}):`, err);
    } finally {
      await problemPage.close();
      await delay(SCRAPE_DELAY);
    }
  }

  await page.close();
  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/leetcode_problems.json",
    JSON.stringify(problemsWithDescriptions, null, 2)
  );
}

async function scrapeCodeforcesProblems(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(userAgent);

  const problems = [];

  for (let pageIndex = 1; pageIndex <= CODEFORCES_PAGES; pageIndex++) {
    const url = `https://codeforces.com/problemset/page/${pageIndex}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await delay(SCRAPE_DELAY);

    const problemSelector =
      "table.problems tr td:nth-of-type(2) > div:first-of-type > a";

    const links = await page.evaluate((sel) => {
      const anchors = document.querySelectorAll(sel);

      return Array.from(anchors).map((a) => a.href);
    }, problemSelector);

    const limitedLinks = links.slice(0, CODEFORCES_PER_PAGE);

    for (const link of limitedLinks) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded" });

        const result = await page.evaluate(() => {
          const titleNode = document.querySelector(".problem-statement .title");
          const descriptionNode = document.querySelector(
            ".problem-statement > div:nth-of-type(2)"
          );
          const fetchedTitle = titleNode?.textContent?.split(". ")[1] ?? "";
          const fetchedDescription = descriptionNode?.textContent ?? "";
          return { title: fetchedTitle, description: fetchedDescription };
        });

        if (result.title) {
          problems.push({
            title: result.title,
            url: link,
            description: result.description,
          });
        }
      } catch (err) {
        console.warn(`Failed to scrape ${link}: ${err.message}`);
      }
      await delay(SCRAPE_DELAY);
    }
  }

  await page.close();
  await fsPromises.mkdir("./problems", { recursive: true });

  await fsPromises.writeFile(
    "./problems/codeforces_problems.json",
    JSON.stringify(problems, null, 2)
  );
}

async function run() {
  const browser = await puppeteer.launch(launchOptions);
  try {
    await scrapeCodeforcesProblems(browser);
    await scrapeLeetcodeProblems(browser);
  } finally {
    await browser.close();
  }
}

run();
