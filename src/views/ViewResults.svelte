<script>
    import { sitemap, scrapesRun, scrapeResults } from '../stores.js'
    import Accordion from '../components/Accordion.svelte'

    function saveData(takeScreenshots = false) {
        if (window.api) {
            window.api.send('toMain:save', {
                sitemap: $sitemap,
                dirConfigs: $scrapeResults,
                takeScreenshots,
            })
        }
    }
</script>

<div class='flex-out'>
    <h1>Scrape Results</h1>
    <div class='flex-out'>
        <button class='save save-screenshots' on:click={ () => saveData(true) }>Save Data + Screenshots</button>
        <button class='save' on:click={ () => saveData() }>Save Data</button>
    </div>
</div>
{#if $scrapeResults}
    {#each $scrapeResults as operation, i ($scrapesRun+'-operation-'+i)}
    <Accordion>
        <div slot='button'>
            <span><strong>{ operation.path }</strong> crawled using <strong>{ operation.modelName }</strong> model.</span>
            <span class='pages-label'>{ operation.pageURLs.length } pages</span>
        </div>
        <div slot='items'>
            {#each operation.values as entry, j ('operation-'+i+'-entry-'+j)}
            <div class='item'>
                {#each Object.keys(entry).sort((a,b) => (a === 'url') ? -1 : 0) as key, k (`operation-${i}-entry-${j}-val-${k}`)}
                {#if key === 'url'}
                <div class='item-header'>{ entry[key] }</div>
                {#if j === 0}
                <div class='item-row'>
                    <span><strong>Key</strong></span>
                    <span><strong>Value</strong></span>
                </div>
                {/if}
                {:else}
                <div class='item-row'>
                    <span>{ key }</span>
                    <span>{ entry[key] }</span>
                </div>
                {/if}
                {/each}
            </div>
            {/each}
        </div>
    </Accordion>
    {/each}
    <!-- <pre>{ JSON.stringify($scrapeResults,null,2) }</pre> -->
{/if}


<style>
    .item {
        margin: .75em 0;
        border: solid 1px var(--bg-20pct);
        border-radius: 4px;
    }

    .item-header {
        background: var(--bg-20pct);
        padding: .3em .75em;
    }

    .item-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        justify-content: center;
        padding: .3em .75em;
        gap: .75em;
        position: relative;
    }

    .item-row:not(:last-child) {
        border-bottom: solid 1px var(--bg-20pct);
    }
    
    .pages-label {
        display: inline-block;
        font-size: .8rem;
        margin: 0 1em;
    }

    .flex-out {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .save {
        display: inline-block;
		background: var(--success-light);
		color: var(--success-dark);
		border-radius: 5em;
		box-shadow: var(--bs-btn-default);
		border: none;
		padding: .3em 1.5em;
		transition: all .12s ease-in-out;
    }
    .save:hover {
        transform: translateY(-2px);
    }

    .save-screenshots {
        background: none;
        border: solid 2px var(--success-primary);
        margin-inline-end: 1.5em;
    }
</style>