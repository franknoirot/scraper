const { scrapeVal, scrapeVals } = require('./utils/scraperUtils.js')

const scrapeFns = {    
    // basically need a away to create this function via UI. Going to take inspiration from browser inspector tools using an iFrame.
    getBio: async function(page, bio) {
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
    },

    getJob: async function(page, job) {
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
    },

    getInquiry: async function(page, inquiry) {
        inquiry.title = await scrapeVal(page, { selector: 'h1', value: 'textContent' })
        
        inquiry.subtitle = await scrapeVal(page, { selector: '.subtitle', value: 'textContent' })

        inquiry.body = await scrapeVal(page, { selector: '.info-block .wpb_text_column .wpb_wrapper', value: 'innerHTML' })

        return inquiry
    },

    getClient: async function(page, client) {
        client.name = await scrapeVal(page, { selector: 'h1', value: 'textContent' })
        
        client.subtitle = await scrapeVal(page, { selector: '.subtitle', value: 'textContent' })
    
        client.body = await scrapeVal(page, { selector: '.wpb_text_column .wpb_wrapper', value: 'innerHTML' })
    
        return client
    }
}

exports.scrapeFns = scrapeFns