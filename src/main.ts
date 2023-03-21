import { CheerioCrawler } from "crawlee";
import breakdance from "breakdance";
import { getXataClient } from "./xata.js";
import * as crypto from "crypto";

type WebsiteCrawlerOptions = {
  Skip?: boolean;
  StartUrls: string[];
  Globs: string[];
  Exclude?: string[];
  ContentSelector: string;
  TitleSelector?: string;
  Name: string;
};

const xata = getXataClient();

const websites = [
  {
    Skip: true,
    Name: "xata-guide",
    StartUrls: ["https://xata.io/docs"],
    Globs: ["http?(s)://xata.io/docs/**"],
    Exclude: ["http?(s)://xata.io/docs/api-reference/**"],
    ContentSelector: "main",
  },
  {
    Skip: true,
    Name: "nextjs-docs",
    StartUrls: ["https://nextjs.org/docs"],
    Globs: ["http?(s)://nextjs.org/docs/**"],
    ContentSelector: ".docs-content",
    Exclude: ["http?(s)://nextjs.org/docs/tag/**"],
  },
  {
    Skip: true,
    Name: "tailwind-docs",
    StartUrls: ["https://tailwindcss.com/docs"],
    Globs: ["http?(s)://tailwindcss.com/docs/**"],
    ContentSelector: "#content-wrapper",
  },
  {
    Skip: true,
    Name: "reactjs-docs",
    StartUrls: ["https://react.dev/learn"],
    Globs: ["http?(s)://react.dev/learn/**"],
    ContentSelector: "main",
  },
  {
    Skip: true,
    Name: "chackra-ui-docs",
    StartUrls: [
      "https://chakra-ui.com/getting-started",
      "https://chakra-ui.com/docs/components",
    ],
    Globs: [
      "http?(s)://chakra-ui.com/docs/**",
      "http?(s)://chakra-ui.com/getting-started/**",
    ],
    ContentSelector: "#content",
  },
  {
    Name: "vercel-docs",
    StartUrls: ["https://vercel.com/docs"],
    Globs: ["http?(s)://vercel.com/docs/**"],
    Exclude: ["http?(s)://vercel.com/docs/rest-api"],
    ContentSelector: "main .content",
  },
] as WebsiteCrawlerOptions[];

for (const website of websites) {
  if (website.Skip) continue;
  const crawler = new CheerioCrawler({
    // Let's limit our crawls to make our
    // tests shorter and safer.
    //maxRequestsPerCrawl: 20,
    maxRequestsPerCrawl: 1000,

    // enqueueLinks is an argument of the requestHandler
    async requestHandler({ $, request, enqueueLinks }) {
      const titleSelector = website.TitleSelector || "head title";
      const title = $(titleSelector).text();
      console.log(`The title of "${request.url}" is: ${title}.`);
      const content = $(website.ContentSelector).html();
      const mdContent = breakdance(content);
      if (typeof mdContent === "string") {
        console.log("Content is", mdContent.length, "characters long.");
        const id = crypto.createHash("sha1").update(request.url).digest("hex");

        await xata.db.content.createOrReplace(id, {
          url: request.url,
          title,
          website: website.Name,
          content: mdContent,
        });
      } else {
        console.log("Skipping because content is empty.", mdContent);
      }

      // The enqueueLinks function is context aware,
      // so it does not require any parameters.
      await enqueueLinks({
        strategy: "same-domain",
        globs: website.Globs,
        exclude: website.Exclude,
      });
    },
  });

  await crawler.run(website.StartUrls);
}
