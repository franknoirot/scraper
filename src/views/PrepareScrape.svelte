<script>
    import { scrapesRun, sitemap, scraperModels, scrapeOperations, 
        addOperation, removeOperation, updateOperationValue,
        scrapeURLs, scrapeResults } from '../stores.js'
    import Accordion from '../components/Accordion.svelte'

    function isValidPath(path, sitemap) {
        const splitPath = path.split('/').filter(el => el && el !== '*')
        let currDir = sitemap.children
        let valid = true
        for(let i=0; i<splitPath.length; i++) {
            const foundDir = currDir.find(child => child.name === splitPath[i]+'/')
            if (!foundDir) {
                valid = false
                break
            }
            currDir = foundDir.children
        }
        return valid
    }

    function handleUpdate(val, index, key) {
        updateOperationValue(val, index, key) 
        // $scrapeResults = undefined
    }
</script>

<h1>Scrape Operations</h1>
{#if $scrapeOperations && $scrapeOperations.length > 0 }
<div class='operations'>
    <div class='item-row'>
        <strong>Directory</strong>
        <strong>Model</strong>
        <strong>On</strong>
    </div>
    {#each $scrapeOperations as operation, i (`${$scrapesRun}-operation-${i}`)}
        <div class='item-row'>
            <input type='text' value={ operation.directory } on:input={ e => handleUpdate(e.target.value, i, 'directory') }
                class={ ($sitemap && !isValidPath(operation.directory, $sitemap)) ? 'invalid' : '' } />
            <select value={ operation.model } on:input={ e => handleUpdate(e.target.value, i, 'model') }>
                {#if $scraperModels && $scraperModels.length > 0}
                <option value=''>Choose a Model</option>
                {#each $scraperModels as model, i ('scraper-model-'+i)}
                <option value={ model.name }>{ model.name }</option>
                {/each}
                {:else}
                <option value=''>Set up models first!</option>
                {/if}
            </select>
            <input type='checkbox' checked={ operation.on } on:input={ () => handleUpdate() } />
            <button class='remove-value' on:click={ () => removeOperation(i) } >
                <svg viewBox='0 0 10 10'>
                    <path d='M 1 1 l 8 8' />
                    <path d='M 1 9 l 8 -8' />
                </svg>
            </button>
        </div>
    {/each}
</div>
{/if}
<button class='add-operation' on:click={() => {
    addOperation()
    <!-- $scrapeResults = undefined -->
}}><strong>+ Add</strong>&nbsp;operation</button>
<style>
    button {
        --line-weight: 1px;
        --inset: 28px;
        text-decoration: none;
        border: none;
        border-radius: 3em;
        padding: .35em 1.75em;
        margin: 0;
        box-sizing: border-box;
        position: relative;
        background: none;
        color: var(--text-medium);
        display: block;
        margin: .3em auto;
    }

    button:hover {
        background: var(--bg-5pct);
    }

    .add-operation {
        margin: 1em 0;
    }

    .invalid {
        border: solid 1px var(--warning);
    }

    input {
        margin-block-end: 0;
        background: none;
        border: none;
        border-bottom: 1px transparent solid;
        color: var(--text-dark);
        padding-block-start: 0;
        padding-block-end: 0;
    }

    input:focus {
        border-bottom: 1px solid var(--text-dark);
        outline: none;
        filter: none;
    }

    .operations {
        border: solid 1px var(--bg-20pct);
        border-radius: 0 0 4px 4px;
    }

    .item-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr) auto;
        gap: .5em;
        justify-content: center;
        align-items: center;
        padding: .75em .75em;
        position: relative;
    }

    .remove-value {
        position: absolute;
        left: 100%;
        top: 0;
        background: var(--bg-20pct);
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: .2em;
        margin: 0;
        height: 100%;
        width: 1.75em;
        border-radius: 0 4px 4px 0;
        opacity: 0;
    }

    .item-row:hover .remove-value,
    .item-row:focus-within .remove-value {
        opacity: 1;
    }

    .remove-value svg {
        --size: .8em;
        width: var(--size);
        height: var(--size);

    }

    .remove-value path {
        stroke: var(--text-dark);
        stroke-linecap: round;
    }

    .remove-value:hover {
        background: var(--text-medium);
    }

    .remove-value:hover path {
        stroke: var(--bg-light);
    }

    .item-row:not(:last-child) {
        border-bottom: solid 1px var(--bg-20pct);
    }

    .item-row input {
        padding-inline-end: 1em;
        box-sizing: border-box;
    }

    .item-row select {
        margin: 0;
    }
</style>