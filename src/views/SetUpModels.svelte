<script>
    import { sitemap, scrapesRun, scraperModels, addModel, updateName, removeModel,
        addModelValue, updateModelValue, removeModelValue } from '../stores.js'
    import VisualPicker from '../components/VisualPicker.svelte'
    import Accordion from '../components/Accordion.svelte'

    let showVisualPicker = false
</script>

<h1>Models</h1>
{#if $scraperModels && $scraperModels.length > 0 }
    {#each $scraperModels as model, i (`${scrapesRun}-model-${i}`)}
    <Accordion closeCallback={ () => removeModel(i) } >
        <input slot='button' type='text' value={ model.name } on:input={ function (e) { updateName(e.target.value, this.dataset.index) } }
            data-index={ i } />
        <div slot='items' class='items'>
            <div class='item-row'>
                <strong>Value</strong>
                <strong>Selector</strong>
                <strong>Property</strong>
            </div>
            {#each model.values as valueObj, j (`model-${i}-${j}`)}
                <div class='item-row'>
                    {#each Object.keys(valueObj) as key, k (model.name+key+j+k+i)}
                    <input type='text' value={ valueObj[key] } on:input={ e => updateModelValue(e.target.value, i, j, key) } />
                    {/each}
                    <button class='visual-selector' on:click={ () => { console.log('sitemap = ', $sitemap); showVisualPicker = [i, j] }}>
                        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.5 21L1 1L19 11.5L12.5 14L17.5 21L15.5 22.5L10.5 15.5L6.5 21Z"/>
                        </svg>
                    </button>
                    <button class='remove-value' on:click={ () => removeModelValue(i, j) } >
                        <svg viewBox='0 0 10 10'>
                            <path d='M 1 1 l 8 8' />
                            <path d='M 1 9 l 8 -8' />
                        </svg>
                    </button>
                </div>
            {/each}
            <button class='add-value' on:click={ () => addModelValue(i) }><strong>+ Add</strong>&nbsp;Value</button>
        </div>
    </Accordion>
    {/each}
{/if}
<button class='add-model' on:click={ () => addModel() }><strong>+ Add</strong>&nbsp;Model</button>
{#if showVisualPicker}
<VisualPicker modelIndex={ showVisualPicker[0] } valueIndex={ showVisualPicker[1] }
    closeCallback={ () => { showVisualPicker = false }} iFrameSrc={ $sitemap ? $sitemap.name : '' } />
{/if}

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

    .add-model {
        margin: 1em 0;
    }

    .add-value {
        font-size: .8em;
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

    .items {
        border: solid 1px var(--bg-20pct);
        border-radius: 0 0 4px 4px;
    }

    .item-row {
        display: grid;
        grid-template-columns: 25% 50% 25%;
        justify-content: center;
        padding: .3em .75em;
        position: relative;
    }

    .remove-value,
    .visual-selector {
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

    .visual-selector {
        right: 100%;
        left: unset;
        border-radius: 4px 0 0 4px;
    }

    .item-row:hover .remove-value,
    .item-row:focus-within .remove-value,
    .item-row:hover .visual-selector,
    .item-row:focus-within .visual-selector {
        opacity: 1;
    }

    .remove-value svg,
    .visual-selector svg {
        --size: .8em;
        width: var(--size);
        height: var(--size);
    }

    .remove-value path,
    .visual-selector path {
        stroke: var(--text-dark);
        stroke-linecap: round;
    }

    .remove-value:hover,
    .visual-selector:hover {
        background: var(--text-medium);
    }

    .remove-value:hover path,
    .visual-selector:hover path {
        stroke: var(--bg-light);
    }

    .item-row:not(:last-child) {
        border-bottom: solid 1px var(--bg-20pct);
    }

    .item-row input {
        padding-inline-end: 1em;
        box-sizing: border-box;
    }
</style>