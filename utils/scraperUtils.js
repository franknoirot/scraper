const scrapeVal = async function(page, config) {
    return getPropVal(await page.$(config.selector), config.value)
        .catch(err => console.error(err))
}

const scrapeVals = async function(page, config) {
    const vals = await page.$$(config.selector)
    if(vals.length > 0) {
        return Promise.all(vals.map(el => getPropVal(el, config.value).catch(err => console.error(err))))
    }
    return null
}

async function getPropVal(res, prop) {
    const content = await res.getProperty(prop).catch(err => console.error(err))
    return await content.jsonValue().catch(err => console.error(err))
}

module.exports = {
    scrapeVal,
    scrapeVals,
}