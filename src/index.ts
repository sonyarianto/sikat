#! /usr/bin/env node

import { chromium } from "playwright";
import { cli } from "cleye";
import { appName, appVersion } from "./config";

async function main() {
  const argv = cli({
    name: appName,
    version: appVersion,
    parameters: [
        '<url>'
    ],
    flags: {
        scheme: {
            type: String,
            description: 'Scheme to use',
            default: 'https'
        } 
    }
  });

  const url = `${argv.flags.scheme}://${argv._.host}`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.screenshot({ path: "example.png" });
  await browser.close();
}

main();
