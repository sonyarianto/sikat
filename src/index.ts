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

  // Probing target page

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await page.goto(userPage);

  const serverHeader = response?.headers()["server"];
  serverHeader && console.log(`Server: ${serverHeader}`);

  const xPoweredByHeader = response?.headers()["x-powered-by"];
  xPoweredByHeader && console.log(`X-Powered-By: ${xPoweredByHeader}`);

  const remoteAddress = await response?.serverAddr();
  remoteAddress &&
    console.log(
      `Remote address: ${remoteAddress.ipAddress}:${remoteAddress.port}`
    );

  // Libraries detection

  let libraries: string[] = [];

  const jqueryVersion = await page.evaluate(() => {
    if ((window as any).jQuery) {
      return (window as any).jQuery.fn.jquery;
    } else {
      return null;
    }
  });

  if (jqueryVersion) {
    libraries.push(`jQuery ${jqueryVersion}`);
  }

  const alpineVersion = await page.evaluate(() => {
    if ((window as any).Alpine) {
      return (window as any).Alpine.version;
    } else {
      return null;
    }
  });

  if (alpineVersion) {
    libraries.push(`Alpine.js ${alpineVersion}`);
  }

  if (libraries.length > 0) {
    console.log("Libraries:");
    libraries.forEach((name) => {
      console.log(`- ${name}`);
    });
  }

  const generatorContent = await page.evaluate(() => {
    const metaTag = document.querySelector('head > meta[name="generator"]');
    return metaTag ? metaTag.getAttribute("content") : null;
  });
  generatorContent && console.log(`Site generator: ${generatorContent}`);

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
  if (hreflangData.length > 0) {
    console.log("Languages:");
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

  // Analytics detection

  let analytics: string[] = [];

  const isUsingMicrosoftClarity = await page.evaluate(() => {
    const scriptPattern =
      /\(function\s*\(\s*c,\s*l,\s*a,\s*r,\s*i,\s*t,\s*y\s*\)\s*\{/;
    const htmlContent = document.documentElement.innerHTML;
    return scriptPattern.test(htmlContent);
  });

  if (isUsingMicrosoftClarity) {
    analytics.push("Microsoft Clarity");
  }

  const isUsingGTM = await page.evaluate(() => {
    const scriptPattern = /\(function\s*\(\s*w,\s*d,\s*s,\s*l,\s*i\s*\)\s*\{/;
    const htmlContent = document.documentElement.innerHTML;
    return scriptPattern.test(htmlContent);
  });

  if (isUsingGTM) {
    analytics.push("Google Tag Manager");
  }

  const isUsingGA = await page.evaluate(() => {
    const scriptPattern =
      /\(function\s*\(\s*i,\s*s,\s*o,\s*g,\s*r,\s*a,\s*m\s*\)\s*\{/;
    const htmlContent = document.documentElement.innerHTML;
    return scriptPattern.test(htmlContent);
  });

  if (isUsingGA) {
    analytics.push("Google Analytics");
  }

  if (analytics.length > 0) {
    console.log("Analytics:");
    analytics.forEach((name) => {
      console.log(`- ${name}`);
    });
  }

  if (argv.flags.screenshot) {
    await page.screenshot({ path: slugify(userPage) + ".png" });
  }

  await browser.close();
}

main();
