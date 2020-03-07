import { writable, derived } from 'svelte/store'
import { getPageURLs } from './scraperJS/utils/sitemapUtils'

export const scrapesRun = writable(0)

export const sitemap = writable(null)

export const sitemapFiles = writable(null)

export const scraperModels = writable(undefined)

export function addModel() {
    scraperModels.update(oldModels => {
        const newModel = {
            name: 'Post',
            values: [
                {value: 'title', selector: 'h1', property: 'textContent'},
            ]
        }

        return oldModels ? [...oldModels, newModel] : [newModel]
    })
}

export function removeModel(index) {
    scraperModels.update(oldModels => {
        if (oldModels.length === 1) return undefined
        if (index === 0) return [...oldModels.slice(1)]
        return [...oldModels.slice(0, index), ...oldModels.slice(index+1, oldModels.length)]
    })
}

export function updateName(val, index) {
    scraperModels.update(oldModels => {
        const newModels = [...oldModels]
        newModels[index].name = val
        return newModels
    })
}

export function addModelValue(modelIndex) {
    scraperModels.update(oldModels => {
        const defaultValue = { value: 'someValue', selector: '.some-class img', property: 'src' }
        const newModels = [...oldModels]
        newModels[modelIndex].values.push(defaultValue)
        return newModels
    })
}

export function updateModelValue(val, modelIndex, valueIndex, valueKey) {
    scraperModels.update(oldModels => {
        const newModels = [...oldModels]
        newModels[modelIndex].values[valueIndex][valueKey] = val
        return newModels
    })
}

export function removeModelValue(modelIndex, valueIndex) {
    scraperModels.update(oldModels => {
        const newModels = [...oldModels]
        if (newModels[modelIndex].values.length === 1) { newModels[modelIndex].values = [] }
        else if (valueIndex === 0) { newModels[modelIndex].values = [...newModels[modelIndex].values.slice(1)] }
        else { newModels[modelIndex].values = [...newModels[modelIndex].values.slice(0, valueIndex), ...newModels[modelIndex].values.slice(valueIndex+1, newModels[modelIndex].values.length)] }
        return newModels
    })
}

export const scrapeOperations = writable(undefined)

export function addOperation() {
    scrapeOperations.update(oldOperations => {
        const newOperation = {
            directory: '/about/team/*',
            model: '',
            on: true,
        }

        return oldOperations ? [...oldOperations, newOperation] : [newOperation]
    })
}

export function removeOperation(index) {
    scrapeOperations.update(oldOperations => {
        if (oldOperations.length === 1) return undefined
        if (index === 0) return [...oldOperations.slice(1)]
        return [...oldOperations.slice(0, index), ...oldOperations.slice(index+1, oldOperations.length)]
    })
}

export function updateOperationValue(val, index, key) {
    scrapeOperations.update(oldOperations => {
        const newOperations = [...oldOperations]
        newOperations[index][key] = val
        return newOperations
    })
}

export const scrapeURLs = derived([scrapeOperations, sitemap],
    ([$scrapeOperations, $sitemap]) => ($scrapeOperations && $sitemap) ? $scrapeOperations.map(operation => getPageURLs(operation.directory, $sitemap)) : undefined)

export const scrapeResults = writable(null)