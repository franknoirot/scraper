const findNodeByName = function(name, childrenArr, suffix = '/') {
    return childrenArr.find(node => node.name === name + suffix)
}

const buildSitemapObj = function(urlArr) {
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

const getPageURLs = function(pagePath, sitemap) {
    const pathParts = pagePath.split('/').filter(part => part && part !== '/')

    let pathNode = sitemap
    let urls = []
    for (let i=0; i < pathParts.length; i++) {
        if (!pathNode) continue
        if (pathParts[i] !== '*') pathNode = findNodeByName(pathParts[i], pathNode.children)

        if (i === pathParts.length - 1) {
            if (pathParts[i] === '*') urls = (pathNode.children && pathNode.children instanceof Array) ? pathNode.children.map(node => node ? node.url : '').filter(f => f) : []
            else urls = (pathNode) ? [pathNode.url] : undefined
        }
    }

    return urls
}

module.exports = {
    buildSitemapObj,
    getPageURLs,
}