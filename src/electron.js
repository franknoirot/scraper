const electron = require('electron') 
const { app, shell, BrowserWindow, ipcMain, dialog } = electron
const path = require('path')
const scraper = require('./scraperJS')

let mainWindow

let watcher
if (process.env.NODE_ENV === 'development') {
    watcher = require('chokidar').watch(`${ __dirname }/../public/build`, { ignoreInitial: true })
    watcher.on('change', () => {
        mainWindow.reload()
    })
}

// Listen for app.ready
app.on('ready', createWindow)


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })

    // load html from svelte frontend
    mainWindow.loadURL(`file://${ __dirname }/../public/index.html`)
    mainWindow.on('closed', () => {
        mainWindow = null

        if (watcher) watcher.close()
    })

    // This is the actual solution
    mainWindow.webContents.on("new-window", function(event, url) {
        console.log('trying to open a new window')
        event.preventDefault();
        shell.openExternal(url);
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

// listen for sitemap event 
ipcMain.on('toMain:sitemap', async (e, sitemaps) => mainWindow.webContents.send('fromMain:sitemap', await scraper.sitemap(sitemaps)))

// listen for scrape event 
ipcMain.on('toMain:scrape', async function (e, scraperConfig) {
    console.log('Received payload :', JSON.stringify(scraperConfig,null,2))

    
    scraper.scrape(scraperConfig, notifyFrontend)
        .then(results => mainWindow.webContents.send('fromMain:scrapeSuccess', results))
        .catch(err => mainWindow.webContents.send('fromMain:scrapeFailure', err.lineNumber + ': ' + err.message))
    
    function notifyFrontend(url) {
        mainWindow.send('fromMain:scrapePageSuccess', url)
    }
})

ipcMain.on('toMain:save', async (e, data) => {
    const savePath = await dialog.showSaveDialog(mainWindow, {
        title: 'Save sitemap crawl data',
        defaultPath: 'sitemap',
        message: 'Select a directory to save your sitemap and scraped data to',
        buttonLabel: 'Save Files',
        nameFieldLabel: 'Folder Name',
        properties: 'createDirectory showOverwriteConfirmation',
    })

    if (savePath.canceled) return


    await scraper.addFile(savePath.filePath + '/', {
        filename: 'sitemap',
        content: data.sitemap,
    })

    for (dirConfig of data.dirConfigs) {
        if (!dirConfig.values || !dirConfig.values[0]) continue
        for (url of dirConfig.pageURLs) {
            const content = {}
            const value = dirConfig.values.find(result => result.url === url)
            Object.keys(dirConfig.values[0])
                .forEach(key => { content[key] = value[key] })

            const filePath = savePath.filePath +'/'+ scraper.lastPageOfPath(dirConfig.path)
            const leafDir = scraper.lastPageOfPath(url)
            await scraper.addFile( filePath, { 
                filename: leafDir,
                content,
            })

            if (data.takeScreenshots) {
                await scraper.fullPageScreenshot(url, { filePath: filePath +'/'+ leafDir + '.png' })
            }
        }
    }
})
