const pptr = require('puppeteer')
const fs = require('fs')
const util = require('util')
const { parseSitemap } = require('sitemap')
const promWrite = util.promisify(fs.writeFile)
const promMkdir = util.promisify(fs.mkdir)
let browser = {}


run().catch(err => {
    console.error(err)
    if (browser.close) {
        browser.close()
    }
    process.exit(43)
})

async function run() {
    const sitemaps = [ // drag-and-drop file input will let user upload this on static frontend eventually
        './page-sitemap.xml',
        './post-sitemap.xml',
        './neta_result-sitemap.xml',
    ]

    // build sitemap from uploaded files. can be done clientside, will be done in frontend UI eventually.
    const sitemapConfigs = await Promise.all(sitemaps.map(async sitemap => parseSitemap(fs.createReadStream(sitemap))
        .catch(err => console.log(err))))
    const sitemapURLs = sitemapConfigs.map(config => config.urls.map(page => page.url)).flat()

    const sitemapObj = buildSitemapObj(sitemapURLs)
    addFile(``, { filename: 'sitemap', content: sitemapObj}) // will need frontend friendly version to bundle a .zip file

    const directoryCallbacks = [ // static site's GUI will let user build this object eventually
        { path: '/about/team/*', callback: getBio, on: true },
        { path: '/join-us/*', preCallback: (url, obj) => { obj.callback = url.includes('inquiry') ? getInquiry : getJob }, on: true },
    ]

    browser = await pptr.launch()
    for (dirConfig of directoryCallbacks) {
        const pageURLs = getPageURLs(dirConfig.path, sitemapObj)

        if (pageURLs.length > 0 && dirConfig.on) {
            dirConfig.values = await Promise.all(pageURLs
                .map(async url => {
                    let res = {}
                    if (dirConfig.preCallback) {
                        dirConfig.preCallback(url, dirConfig) // on frontend, user will be able to define conditional scraping
                    }
                    if (dirConfig.callback) {
                        res = crawlPage(lastPageOfPath(dirConfig.path)+'/', url, dirConfig.callback) // main scraping operation
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
}

function findNodeByName(name, childrenArr, suffix = '/') {
    return childrenArr.find(node => node.name === name + suffix)
}

function buildSitemapObj(urlArr) {
    const domain = urlArr.shift()
    const siteArr = urlArr.map(url => url.replace(domain, ''))
    const siteObj = newNode(domain)

    for (let i=0; i<siteArr.length; i++) {
        const uriParts = siteArr[i].split('/').filter(el => el && el !== '/')
        if (!siteObj.children) siteObj.children = []
        if (!findNodeByName(uriParts[0], siteObj.children)) siteObj.children.push(newNode(`${ uriParts[0] }/`))
        currNode = findNodeByName(uriParts[0], siteObj.children)

        if (uriParts.length === 1) {
            currNode.url = urlArr[i]
        }

        for(let j=1; j<uriParts.length; j++) {
            if (!currNode.children) currNode.children = []
            if (!findNodeByName(uriParts[j], currNode.children)) {
                currNode.children.push(newNode(`${ uriParts[j] }/`, ))
            }

            currNode = findNodeByName(uriParts[j], currNode.children)

            if (j === uriParts.length - 1) {
                currNode.url = urlArr[i]
            }
        }
    }

    return siteObj

    function newNode(name = '/', url) {
        return {
            name,
            url,
        }
    }
}

function getPageURLs(pagePath, sitemap) {
    const pathParts = pagePath.split('/').filter(part => part && part !== '/')

    let pathNode = sitemap
    let urls = []
    for (let i=0; i < pathParts.length; i++) {
        if (pathParts[i] !== '*') pathNode = findNodeByName(pathParts[i], pathNode.children)

        if (i === pathParts.length - 1) {
            if (pathParts[i] === '*') urls = pathNode.children.map(node => node.url)
            else urls = [pathNode.url]
        }
    }

    return urls
}

async function getPropVal(res, prop) {
    const content = await res.getProperty(prop).catch(err => console.error(err))
    return await content.jsonValue().catch(err => console.error(err))
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
        })

    return content
}

// basically need a away to create this function via UI. Going to take inspiration from browser inspector tools using an iFrame.
async function getBio(page, bio) {
    bio.name = await scrapeVal(page, { selector: 'h1', value: 'textContent' })
    bio.jobTitle = await scrapeVal(page, { selector: '.subtitle', value: 'textContent' })

    // need UI for both singular and plural scraping operations.
    // or maybe not? couldn't I just assume everything was plural and process accordingly.
    const linkedinLink = await scrapeVal(page, { selector: '.ni-linkedin + a', value: 'href' })
    if (linkedinLink) { bio.linkedin = linkedinLink }

    const bioSections = await scrapeVals(page, {selector: 'main .vc_section p', value: 'innerHTML' })
    if (bioSections) { bio.bioSections = bioSections}

    const ownWords = await scrapeVals(page, { selector: '.own-words p', value: 'innerHTML' })
    if (ownWords) { bio.ownWords = ownWords }

    bio.bioSections = bio.bioSections.filter(sectionText => bio.ownWords.every(ownWordsPara => ownWordsPara !== sectionText))
    
    return bio
}

async function getJob(page, job) {
    job.title = await scrapeVal(page, { selector: 'h1', value: 'textContent'})

    // This is the trickiest UI. what if the data is unstructured and you want to add structure?
    // here I'm parsing this 'subtitle' for the different useful bits, but I don't know
    // how to make that UI-friendly.
    const subtitle = await scrapeVal( page, { selector: '.subtitle', value: 'textContent'})
    if (subtitle) {
        job.department = subtitle.substr(0, subtitle.indexOf(', '))
        job.location = subtitle.substr(subtitle.indexOf(', ')+2, Math.max(subtitle.indexOf(' Type:'), subtitle.indexOf(' Duration:')) - subtitle.indexOf(', ') - 2)
        if (subtitle.includes('Type')) {
            const startIndex = subtitle.indexOf('Type: ') + 'Type: '.length
            job.type = subtitle.substr(startIndex, subtitle.indexOf(' Min. Exp') - startIndex)
        }
        if (subtitle.includes('Duration')) {
            const startIndex = subtitle.indexOf('Duration: ') + 'Duration: '.length
            job.duration = subtitle.substr(startIndex, subtitle.indexOf(' Min. Exp') - startIndex)
        }
        job.experience = subtitle.substr(subtitle.lastIndexOf('Experience: ') + 'Experience: '.length)
    }

    job.body = await scrapeVal(page, { selector: '.info-block .wpb_text_column .wpb_wrapper', value: 'innerHTML' })

    return job
}

async function getInquiry(page, inquiry) {
    inquiry.title = await scrapeVal(page, { selector: 'h1', value: 'textContent' })
    
    inquiry.subtitle = await scrapeVal(page, { selector: '.subtitle', value: 'textContent' })

    inquiry.body = await scrapeVal(page, { selector: '.info-block .wpb_text_column .wpb_wrapper', value: 'innerHTML' })

    return inquiry
}

async function scrapeVal(page, config) {
    return getPropVal(await page.$(config.selector), config.value)
        .catch(err => console.error(err))
}

async function scrapeVals(page, config) {
    const vals = await page.$$(config.selector)
    if(vals.length > 0) {
        return Promise.all(vals.map(el => getPropVal(el, config.value).catch(err => console.error(err))))
    }
    return null
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