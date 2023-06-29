#! /usr/bin/env node

import { chromium } from "playwright";
import { cli } from "cleye";
import { appName, appVersion } from "./config";
import { slugify } from "./utils";

async function main() {
  const argv = cli({
    name: appName,
    version: appVersion,
    parameters: ["<page>"],
    flags: {
      scheme: {
        type: String,
        description: "Scheme to use",
        default: "https",
      },
      screenshot: {
        type: Boolean,
        description: "Take a screenshot",
      },
    },
  });

  let userPage = argv._.page;

  // Check if userPage is already contains https or http scheme

  if (!/^https?:\/\//i.test(userPage)) {
    userPage = `${argv.flags.scheme}://${userPage}`;
  }

  console.log(`Probing ${userPage}\n`);

  // Probing the page

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto(userPage);

  const serverHeader = response?.headers()["server"];
  const xPoweredByHeader = response?.headers()["x-powered-by"];
  const remoteAddress = await response?.serverAddr();
  const jqueryVersion = await page.evaluate(() => {
    if ((window as any).jQuery) {
      return (window as any).jQuery.fn.jquery;
    } else {
      return null;
    }
  });

  const alpineVersion = await page.evaluate(() => {
    if ((window as any).Alpine) {
      return (window as any).Alpine.version;
    } else {
      return null;
    }
  });

  const generatorContent = await page.evaluate(() => {
    const metaTag = document.querySelector('head > meta[name="generator"]');
    return metaTag ? metaTag.getAttribute("content") : null;
  });

  serverHeader && console.log(`Server: ${serverHeader}`);
  xPoweredByHeader && console.log(`X-Powered-By: ${xPoweredByHeader}`);
  remoteAddress &&
    console.log(
      `Remote address: ${remoteAddress.ipAddress}:${remoteAddress.port}`
    );
  jqueryVersion && console.log(`jQuery: ${jqueryVersion}`);
  generatorContent && console.log(`Site generator: ${generatorContent}`);
  alpineVersion && console.log(`Alpine.js: ${alpineVersion}`);
  const hreflangData = await page.evaluate(() => {
    const linkElements = Array.from(
      document.querySelectorAll('head > link[rel="alternate"]')
    );

    const filteredElements = linkElements.filter((element) =>
      element.hasAttribute("hreflang")
    );

    return filteredElements.map((element) => ({
      hreflang: element.getAttribute("hreflang"),
      href: element.getAttribute("href"),
    }));
  });
  if (hreflangData) {
    console.log("Language versions:");
    hreflangData.forEach((data) => {
      console.log(`- ${data.hreflang}: ${data.href}`);
    });
  }

  const title = await page.title();
  title && console.log(`Title: ${title}`);

  const description = await page.evaluate(() => {
    const metaTag = document.querySelector('head > meta[name="description"]');
    return metaTag ? metaTag.getAttribute("content") : null;
  });
  description && console.log(`Description: ${description}`);

  const rssFeed = await page.evaluate(() => {
    const linkElement = document.querySelector(
        'head > link[type="application/rss+xml"]'
      ),
      href = linkElement ? linkElement.getAttribute("href") : null;
    return href;
  });
  rssFeed && console.log(`RSS feed: ${rssFeed}`);

  if (argv.flags.screenshot) {
    await page.screenshot({ path: slugify(userPage) + ".png" });
  }

  await browser.close();
}

main();
