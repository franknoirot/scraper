const pptr = require('puppeteer')
const fs = require('fs')
const fsPromises = require('fs').promises
const util = require('util')
const { parseSitemap } = require('sitemap')
const { buildSitemapObj, getPageURLs } = require('./utils/sitemapUtils.js')
const { scrapeFns } = require('./scrapeFns.js')
const promWrite = util.promisify(fs.writeFile)
const promMkdir = util.promisify(fs.mkdir)
let browser = {}
let timerStart


const directoryCallbacks = [ // static site's GUI will let user build this object eventually
    { path: '/about/team/*', callback: scrapeFns.getBio, on: true },
    { path: '/join-us/*', preCallback: (url, obj) => { obj.callback = url.includes('inquiry') ? scrapeFns.getInquiry : scrapeFns.getJob }, on: true },
    { path: '/results/clients/*', callback: scrapeFns.getClient, on: true}
]


run()
.then((results) => {
    console.log(
    `crawling complete!
    ${ results.sitemaps.length } sitemaps combined and parsed into a JSON tree containing ${ results.sitemapURLs.length } URLs.
    ${ directoryCallbacks.reduce((acc, dirConfig) => acc + dirConfig.pageURLs.length, 0) } pages crawled and converted to JSON in ${ (Date.now() - timerStart) / 1000 } seconds. 
    `)

    process.exit(0)
})
.catch(err => {
    console.error(err)
    if (browser.close) {
        browser.close()
    }
    process.exit(43)
})

async function run() {
    timerStart = Date.now()
    const sitemaps = await fsPromises.readdir('./xml', { withFileTypes: true }).then(arr =>
        arr.map(fileObj => fileObj.name)
        .filter(filename => filename.includes('.xml'))
        .sort((a, b) => { // try to get the most complete sitemap first, usually includes word 'pages'
            if (a.includes('page')) return -1
            else if (b.includes('page')) return 1
            return 0
        }))

    if (!sitemaps || sitemaps.length === 0) {
        console.error('no .xml sitemap files in /xml/ directory!')
        return
    }

    // build sitemap from uploaded files. can be done clientside, will be done in frontend UI eventually.
    const sitemapConfigs = await Promise.all(sitemaps.map(async sitemap => parseSitemap(fs.createReadStream('./xml/' + sitemap))
        .catch(err => console.log(err))))
    const sitemapURLs = sitemapConfigs.map(config => config.urls.map(page => page.url)).flat()

    const sitemapObj = buildSitemapObj(sitemapURLs)
    addFile(``, { filename: 'sitemap', content: sitemapObj}) // will need frontend friendly version to bundle a .zip file


    browser = await pptr.launch()
    for (dirConfig of directoryCallbacks) {
        dirConfig.pageURLs = getPageURLs(dirConfig.path, sitemapObj)

        if (dirConfig.pageURLs.length > 0 && dirConfig.on) {
            const maxTabs = 4
            let activeTabs = 0
            dirConfig.values = await Promise.all(
                dirConfig.pageURLs.map(async (url, index) => {
                    let res = {}
                    if (dirConfig.preCallback) {
                        dirConfig.preCallback(url, dirConfig) // on frontend, user will be able to define conditional scraping
                    }
                    if (dirConfig.callback) {
                        let cancelMaxTimeout = null
                        if (activeTabs >= maxTabs) {  
                            await new Promise((resolve, reject) => {
                                maxTimeout = setTimeout(() => reject('maxTimeout exceeded'), 5000 * index) // wait 5s per page, allowing for longer wait as you go.
                                cancelMaxTimeout = () => {
                                    clearTimeout(maxTimeout)
                                    return resolve(true)
                                }
                                setInterval(() => { // check if a tab is open on an interval
                                    if(activeTabs < maxTabs) {
                                        clearTimeout(maxTimeout)
                                        return resolve(true)
                                    }
                                }, 100)
                            })
                        }
                        activeTabs++

                        res = crawlPage(lastPageOfPath(dirConfig.path)+'/', url, dirConfig.callback) // main scraping operation
                            .then(() => {
                                console.log(`Successfully scraped ${ url }`)
                                activeTabs = activeTabs - 1
                                if (cancelMaxTimeout) { cancelMaxTimeout() }
                            })
                            .catch(err => console.log(url, err))
                    }
                    if (dirConfig.postCallback) {
                        dirConfig.postCallback(url, dirConfig) // not sure how to use, but could be useful for some post-processing?
                    }

                    return res
                })
            )
        }
    }

    await browser.close()

    return {
        sitemaps,
        sitemapURLs,
        sitemapObj,
        directoryCallbacks,
    }
}


async function crawlPage(dir, url, crawlFn) {
    const page = await browser.newPage()
    await page.goto(url)
    
    const content = await crawlFn(page, { url })

    await page.close()
    
    addFile(dir,
        { 
            filename: lastPageOfPath(url),
            content,
        }
    )

    return content
}

async function addFile(path, fileConfig) {
    await promMkdir('./site/' + path, { recursive: true })
    promWrite(`./site/${ path }${ fileConfig.filename }.json`, Buffer.from(JSON.stringify(fileConfig.content,null,2)), 'utf8')
}

function lastPageOfPath(path) {
    const page =  path.substr(path.substr(0,path.length-(path.length - path.lastIndexOf('/'))).lastIndexOf('/')+1)
    return page.substr(0, page.length-1)
}

function logJSON(obj) {
    console.log(JSON.stringify(obj,null,2))
}