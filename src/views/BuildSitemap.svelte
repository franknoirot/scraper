<script>
    import { sitemap, sitemapFiles } from '../stores.js'
    import Accordion from '../components/Accordion.svelte'
    import TreeView from '../components/TreeView.svelte'
    let sitemapDelete = () => { $sitemap = null }


    async function handleSitemapUpload(e) {
        if (!e.target.files) {
            e.target.value = ''
            return
        }

        $sitemapFiles = Array.from(e.target.files).map(file => {
            return {
                name: file.name,
                entries: null,
            }
        })

        const filesAsDataURL = await Promise.all(Array.from(e.target.files).map(async file => {
            return {
                name: file.name,
                dataURL: await readAsDataURLAsync(file),
            }
        }))

        window.api.send('toMain:sitemap', filesAsDataURL)
    }

    async function readAsDataURLAsync(file) {
        const fr = new FileReader()

        return new Promise((resolve, reject) => {
            fr.onerror = () => {
                fr.abort()
                reject(new DOMException("Problem parsing file."))
            }

            fr.onload = () => resolve(fr.result)

            fr.readAsDataURL(file)
        })
    }
</script>

<h1>Sources</h1>
{#if !$sitemap}
<label>Upload one or more .xml files
    <input type='file' accept='.xml' on:change={ e => handleSitemapUpload(e) } multiple='true'
        />
</label>
{:else}
<Accordion closeCallback={ () => sitemapDelete() }>
    <span slot='button'>{ $sitemapFiles.length } files</span>
    <ol slot='items'>
        {#each $sitemapFiles as file, i (file.name)}
        <li>{ file.name }</li>
        {/each}
    </ol>
</Accordion>
<TreeView object={ $sitemap } />
{/if}


<style>
    ol {
        padding-inline-start: 0;
        margin-block-start: 0;
    }
    li {
        color: var(--text-dark);
        padding: .75em 1em;
        border: solid 1px var(--bg-5pct);
        list-style-position: inside;
    }
</style>