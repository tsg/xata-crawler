# Simple website crawler to Xata

This uses Crawlee, Cheerio, and Breakdance to do a simple crawler that inserts the content of a website as Markdown in a Xata database. The data can be used then for search, semantic search, or Q&A with ChatGPT.

To crawl a new website:

* Create a new Xata database, with this schema (you can create it with `xata init --schema schema.json`):

```json
{
  "tables": [
    {
      "name": "content",
      "columns": [
        {
          "name": "url",
          "type": "string"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "website",
          "type": "string"
        },
        {
          "name": "content",
          "type": "text"
        }
      ]
    }
  ]
}
```
* Update `.xatarc` with your Xata DB URL, or use `xata init` to connect it.
* Edit the `websites` array in `src/main.ts` to add the website you want to crawl.
* Run `npm start` to crawl the website.