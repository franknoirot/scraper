<script>
    import { tick } from 'svelte'
    export let modelIndex = 0
    export let valueIndex = 0
    export let closeCallback = undefined
    export let iFrameSrc = undefined
    let isPickingElem = false
    let iFrame, iFrameDocument

    async function initIFrame() {
        await tick()

        console.log('iFrame = ', iFrame, iFrame.contentWindow.document.body, iFrame.contentDocument.body)
        console.log('iFrame height = ', iFrame.contentDocument.documentElement, iFrame.contentDocument.body.clientHeight, iFrame.contentDocument.body.getBoundingClientRect())
        iFrameDocument = iFrame.contentDocument
    }

    $: if (iFrame && iFrame.src) {
        initIFrame()
    }

    function handleIFrameClick(event) {
        console.log('click location in app = ', event.offsetX, event.offsetY, iFrameDocument.scrollTop, iFrameDocument.body.clientHeight)

        // const iFrameElem = iFrameDocument.elementFromPoint(event.offsetX, event.offsetY)

        // console.log('nearest element in iFrame = ', iFrameElem)

        isPickingElem = false
    }
</script>

<div class='popup-bg' on:click={ () => { if (closeCallback) closeCallback() }}></div>
<div class='popup'>
    <div class='url-bar'>
        <label for='url-input'>URL:</label>
        <input id='url-input' type='text' value={ (iFrameSrc) ? iFrameSrc : '' }
            on:blur={ e => { iFrameSrc = e.target.value }}
            on:keypress={ e => { if (e.key === 'Enter') { iFrameSrc = e.target.value }}} />
        <button class='close-btn' on:click={ () => { if (closeCallback) closeCallback() }}>
            <svg viewBox='0 0 10 10'>
                <path d='M 1 1 l 8 8' />
                <path d='M 1 9 l 8 -8' />
            </svg>
        </button>
    </div>
    <div class={ 'iframe-click-wrapper ' + (isPickingElem ? 'is-picking' : '') }>
        <iframe src={ iFrameSrc ? iFrameSrc : '' } title='Visual Selector Preview' frameborder='0'
            bind:this={ iFrame }>
            Load a URL!
        </iframe>
        <div class='click-target' on:click={ e => { if (iFrame && iFrameSrc) handleIFrameClick(e) }}></div>
    </div>
    <div class='controls-row'>
        <button class='element-picker' on:click={ () => { isPickingElem = true }}>
            <svg style='margin-inline-end: .5em; ' width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="26" height="26" rx="8" stroke="#084A5F" stroke-width="2" stroke-linejoin="round" stroke-dasharray="10 5"/>
                <path d="M7.99609 11.7266L4.31641 10.6836L5.00781 8.5625L8.65234 10.0273L8.41797 5.9375H10.7148L10.4805 10.1094L14.0312 8.66797L14.7227 10.8125L10.9727 11.8555L13.4336 14.9727L11.5703 16.2969L9.4375 12.875L7.32812 16.1797L5.46484 14.9141L7.99609 11.7266Z" fill="#084A5F"/>
            </svg>
            Pick an Element
        </button>
    </div>
</div>

<style>
    .popup {
        --w: 80vw;
        --h: 80vh;
        width: var(--w);
        height: var(--h);
        position: fixed;
        top: calc((100vh - var(--h)) / 2);
        left: calc((100vw - var(--w)) / 2);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
    }
    .popup-bg {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background: rgba(14, 20, 55, 0.9);
    }

    .url-bar {
        display: flex;
        width: 100%;
        background: var(--bg-light);
        min-height: 2em;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
    }

    .url-bar label {
        width: min-content;
        padding: .5rem 1rem;
        background: var(--bg-20pct);
        color: var(--text-dark);
    }

    .url-bar input {
        width: 100%;
        height: 100%;
        border: none;
        margin: 0;
        padding: .3em 1.5em;
        font-size: .9rem;
    }

    button {
        background: var(--bg-20pct);
        margin: 0;
        border: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    button:hover {
        background: var(--text-medium);
        color: var(--bg-light);
    }

    button svg {
        --size: 1em;
        width: var(--size);
        height: var(--size);
        margin: 0;
        padding: 0;
    }

    button path {
        stroke: var(--text-dark);
        stroke-linecap: round;
    }

    button:hover path,
    button:hover rect {
        stroke: var(--bg-light);
    }

    iframe {
        height: 100%;
        background: var(--bg-light);
        width: 100%;
    }

    .iframe-click-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .is-picking {
        cursor: crosshair;
        outline: solid 7px var(--success);
    }

    .click-target {
        pointer-events: none;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }

    .is-picking .click-target {
        pointer-events: all;
    }

    .controls-row {
        min-height: 2em;
        background: var(--bg-20pct);
        border-radius: 0 0 8px 8px;
        overflow: hidden;
    }

    .element-picker {
        height: 100%;
        padding: .3em .5em;
    }
</style>