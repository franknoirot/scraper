const fs = require('fs')
const pptr = require('puppeteer')
const fsPromises = require('fs').promises
const util = require('util')
const { parseSitemap } = require('sitemap')
const { buildSitemapObj, getPageURLs } = require('./utils/sitemapUtils.js')
const { scrapeVals } = require('./utils/scraperUtils.js')
const promWrite = util.promisify(fs.writeFile)
const promMkdir = util.promisify(fs.mkdir)
let browser = {}
let timerStart
let directoryCallbacks

const sitemap = async function(sitemaps) {
    const dirName = './tmp/xml'

    sitemapArrayBuffers = sitemaps.map(({ dataURL }) => Buffer.from(dataURL.split(",")[1], 'base64'))
    await promMkdir(dirName, { recursive: true })
    for (let i=0; i<sitemaps.length; i++) {
        const url = `${ dirName }/${ sitemaps[i].name }`
        await promWrite(url, sitemapArrayBuffers[i], 'utf8')
        sitemaps[i].url = url
    }

    console.log('sitemaps urls = ', sitemaps.map(s => s.url))

    sitemaps = sitemaps.sort((a, b) => { // try to get the most complete sitemap first, usually includes word 'pages'
        if (a.name.includes('page')) return -1
        else if (b.name.includes('page')) return 1
        return 0
    })

    const sitemapConfigs = await Promise.all(sitemaps.map(async sitemap => parseSitemap(fs.createReadStream(sitemap.url, 'utf8'))
        )).catch(err => console.log(err))

    const sitemapURLs = sitemapConfigs.map(config => config.urls.map(page => page.url)).flat()

    return buildSitemapObj(sitemapURLs)
}

const scrape = async function({ sitemap, operations }, notify) {
    const dirCallbacks = operations.map(({ directory, model, on}) => {
        return {
            modelName: model.name,
            path: directory,
            on,
            callback: async function(url, dataObj) {
                const promises = model.values.map(async ({ value: key, selector, property }) => { 
                    const scrapedVal = await scrapeVals(url, { selector, value: property }).catch(err => console.log(err))
                    dataObj[key] = (scrapedVal) ? ((scrapedVal.length > 1) ? scrapedVal : scrapedVal[0]) : null
                    return scrapedVal
                })

                await Promise.all(promises)
                return dataObj
            },
        }
    })

    console.log('dirCallbacks', dirCallbacks)

    return await run(sitemap, dirCallbacks, notify)
    .then((results) => {
        console.log(
        `crawling complete!

        ${ results.reduce((acc, dirConfig) => acc + dirConfig.pageURLs.length, 0) } pages crawled and converted to JSON in ${ (Date.now() - timerStart) / 1000 } seconds. 
        `)   

        return results.map(dirConfig => {
            const config = {}
            Object.keys(dirConfig).forEach(key => {
                if (dirConfig[key] !== 'function') { config[key] = dirConfig[key] }
            })
            return config
        })
    })
}

async function run(sitemap, directoryCallbacks, notificationCallback) {
    timerStart = Date.now()    
    
    addFile(``, { filename: 'sitemap', content: sitemap }) // will need frontend friendly version to bundle a .zip file

    browser = await pptr.launch()
    
    for (dirConfig of directoryCallbacks) {
        dirConfig.pageURLs = getPageURLs(dirConfig.path, sitemap)

        if (dirConfig.pageURLs.length > 0 && dirConfig.on) {
            console.log('dirConfig = ', dirConfig)
            const maxTabs = 4
            let activeTabs = 0

            dirConfig.values = await Promise.all(
                dirConfig.pageURLs.map(async (url, index) => {
                    console.log('url = ', url, index)
                    if (dirConfig.preCallback) {
                        dirConfig.preCallback(url, dirConfig) // TODO: on frontend, user will be able to define conditional scraping
                    }

                    if (dirConfig.callback) {
                        let cancelMaxTimeout = null
                        if (activeTabs >= maxTabs) {  
                            console.log('awaiting next available tab!', url, lastPageOfPath(url))
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

                        res = await crawlPage(lastPageOfPath(dirConfig.path)+'/', url, dirConfig.callback) // main scraping operation
                            .catch(err => console.log(url, err))
                        
                        console.log(`Successfully scraped ${ url }`)
                        notificationCallback(url)
                        activeTabs = activeTabs - 1
                        if (cancelMaxTimeout) { cancelMaxTimeout() }
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

    return directoryCallbacks
}


async function crawlPage(dir, url, crawlFn) {
    const page = await browser.newPage().catch(err => console.log(err))
    let content = null
    if (await !page.isClosed()) {
        await page.goto(url).catch(err => console.log(err))
        
        content = await crawlFn(page, { url }).catch(err => console.log(err))
        console.log('url = ', url, 'content = ', content)
        await page.close().catch(err => console.log(err))
    }

    // await addFile(dir,
    //     { 
    //         filename: lastPageOfPath(url),
    //         content,
    //     }
    // ).catch(err => console.log(err))

    return content
}

async function addFile(path, fileConfig) {
    await promMkdir(path, { recursive: true })
    promWrite(`${ path }${ fileConfig.filename }${ fileConfig.extension ? fileConfig.extension : '.json' }`, Buffer.from(JSON.stringify(fileConfig.content,null,2)), 'utf8')
}

function lastPageOfPath(path) {
    const page =  path.substr(path.substr(0,path.length-(path.length - path.lastIndexOf('/'))).lastIndexOf('/')+1)
    return page.substr(0, page.length-1)
}

function logJSON(obj) {
    console.log(JSON.stringify(obj,null,2))
}

async function fullPageScreenshot(url, config) {
    if (!browser || !browser.isConnected()) {
        browser = await pptr.launch()
    }

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080, })
    await page.goto(url)
    const screenshot = await page.screenshot({
        path: config.filePath,
        type: 'png',
        fullPage: true,
    })

    await browser.close()
    return screenshot
}

module.exports = {
    sitemap,
    scrape,
    addFile,
    lastPageOfPath,
    fullPageScreenshot
}