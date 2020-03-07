<script>
    export let closeCallback = ''
</script>

<div class='accordion-bar closed'>
    <button class='accordion-btn'
        on:click={ function(e) { 
            if (e.target !== this) return          
            this.parentElement.classList.toggle('closed') 
            this.parentElement.nextSibling.nextSibling.classList.toggle('closed') 
        }}>
        <slot name='button'></slot>
    </button>
    {#if closeCallback}
    <button class='accordion-delete' on:click={ () => closeCallback() }>
        <svg viewBox='0 0 10 10'>
            <path d='M 1 1 l 8 8' />
            <path d='M 1 9 l 8 -8' />
        </svg>
    </button>
    {/if}
</div>
<div class='accordion-items closed'>
    <slot name='items'></slot>
</div>

<style>
    .accordion-bar {
        display: grid;
        grid-template-columns: 1fr auto;
        --border-radius: .15em;
        box-shadow: var(--bs-btn-default);
        transition: all .12s ease-in-out;
    }

    .accordion-bar ~ .accordion-bar {
        margin-block-start: .5em;
    }

    .accordion-bar:hover {
        cursor: pointer;
        transform: translateY(-3px);
        box-shadow: 0 8px 8px rgba(0,0,0,0.09);
    }

    .accordion-bar button {
        padding: .75em;
        text-align: left;
        background: var(--bg-5pct);
        margin: 0;
        border: none;
        display: flex;
        align-items: center;
    }

    .accordion-btn {
        border-radius: var(--border-radius) 0 0 var(--border-radius);
        position: relative;
    }

    .accordion-btn::before {
        content: '▶';
        display: inline-block;
        margin-inline-end: 1em;
        transform-origin: 50% 50%;
        transform: rotate(90deg);
        transition: all .12s ease-in-out;
    }

    .closed .accordion-btn::before {
        transform: rotate(0deg);
    }

    .accordion-bar .accordion-delete {
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        background: var(--bg-20pct);
    }

    .accordion-bar .accordion-delete:hover {
        background: var(--text-medium);
    }

    .accordion-delete svg {
        --size: 1em;
        width: var(--size);
        height: var(--size);
        margin: 0;
        padding: 0;
    }

    .accordion-delete path {
        stroke: var(--text-dark);
        stroke-linecap: round;
    }

    .accordion-delete:hover path {
        stroke: var(--bg-light);
    }

    .accordion-items {
        --pad: .5em;
        transform: scaleY(1);
        transform-origin: 50% 0;
        box-sizing: border-box;
        margin: 0;
        padding: .5em var(--pad);
        padding-block-end: 0;
        transition: all .12s ease-in-out, overflow .01s linear;
    }

    .accordion-items.closed {
        transform: scaleY(0);
        height: 1px;
        margin: 0;
        padding: 0 var(--pad);
        overflow: hidden;
    }

    .accordion-items > * {
        padding: 0;
        margin: 0;
    }

</style>