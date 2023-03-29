import { CheerioCrawler, PlaywrightCrawler } from "crawlee";
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
    Skip: true,
    Name: "nuxt2-docs",
    StartUrls: ["https://nuxtjs.org/docs/get-started/installation"],
    Globs: ["http?(s)://nuxtjs.org/docs/**"],
    ContentSelector: ".docus-content",
  },
  {
    Skip: true,
    Name: "netlify-docs",
    StartUrls: ["https://docs.netlify.com/get-started/"],
    Globs: ["http?(s)://docs.netlify.com/**"],
    ContentSelector: ".wrapper__content",
  },
  {
    Skip: true,
    Name: "vercel-docs",
    StartUrls: ["https://vercel.com/docs/concepts/get-started/deploy"],
    Globs: ["http?(s)://vercel.com/docs/**"],
    ContentSelector: "main",
  },
  {
    Skip: true,
    Name: "vuejs-guide",
    StartUrls: ["https://vuejs.org/guide/introduction.html"],
    Globs: ["http?(s)://vuejs.org/guide/**"],
    ContentSelector: "main",
  },
  {
    Skip: true,
    Name: "postgres-docs",
    StartUrls: ["https://www.postgresql.org/docs/current/index.html"],
    Globs: ["http?(s)://www.postgresql.org/docs/current/**"],
    ContentSelector: "#docContent",
  },
  {
    Name: "prisma-docs",
    StartUrls: ["https://www.prisma.io/docs/getting-started"],
    Globs: ["http?(s)://www.prisma.io/docs/**"],
    ContentSelector: "article",
  },
] as WebsiteCrawlerOptions[];

for (const website of websites) {
  if (website.Skip) continue;
  const crawler = new CheerioCrawler({
    // Let's limit our crawls to make our
    // tests shorter and safer.
    maxRequestsPerCrawl: 10000,

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
