# An XML Sitemap Scraper
*for converting site data to JSON and taking screenshots, powered by Electron, Svelte, Puppeteer, and sitemap.js*

## How to use
1. Download .xml sitemap file(s) from site of your choice and place in the `/xml/` directory
2. Click the Upload Sitemaps button on the first tab
3. Define one or more Models in the second tab.
  - Name the model by clicking the model name ("Post" by default)
  - Name a field you want in your final data. This can be anything without spaces
  - Define a *Selector* to grab your data from the web page. For now this is manual, but we're working on a Visual Picker (see roadmap below)
  - Define a *Property* you want to get from the elements gathered up by the Selector. For example, if what your selecting are images and you want their URLs, you would input `src` as the Property.
4. Define one or more Operations on the third tab
  - Define a *Directory* where you want this operation to run. If you add `/*` to the directory, it will scrape all of the children of that page, so `/about/team/*` scrapes all of the children of the team page, which is each of the team member's pages on netamorphosis.com
  - Associate a *Model* with a directory. This dropdown is populated with the Models defined on the second tab
  - Toggle the Operation either on or off. This is useful if you want to break up your scrape into pieces, only doing an operation or two at a time
5. Make sure you are connected to the internet. The status badge in the upper left will tell you if you aren't.
6. Click the **Run Scrape** button. A fourth tab with your results will appear after the scrape is complete. From here you can save the data or save the data alongside screenshots of the pages.

## Roadmap
1. Add a Visual Picker tool to allow users not familiar with CSS selectors to define Models.
2. Add a Screenshot option on the Sitemap tab. Some users just need a screenshot of each page, not data scraping as well.
3. Add ability to save Sitemaps, Models, and Operations for later use.
4. Add better error handling

Some open questions we have yet to tackle:

### How to create crawl functions through UI? *(in progress)*
I think this will have to be a kind of visual inspector eventually, so that someone can select the data they want and fine-tune the selector from there. Will probably use an iFrame.

### How to set conditional callbacks (preCallback branching logic) with UI?
Some directories on sites don't have perfect logic, so can we have Models and Operations conditionally scrape and reconfigure based on conditional logic, from within the UI? No idea, starting to sound like a node-based editor, which sounds super hard.