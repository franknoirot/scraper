<script>
    export let object = {
        name: 'No name set',
        children: [
            { name: '', children: [] }
        ],
    }
    export let href = ''
    export let expanded = true
    $: descendants = (object.children) ? getDescendants(object) : 0

    function getDescendants(tree, nodes = 0) {
        if (!tree.children) return nodes + 1
        return tree.children.reduce((acc, child) => acc + getDescendants(child), nodes)
    }

    object.children = (object.children && (object.children.length > 0)) ? object.children.sort((a,b) => (a.name < b.name) ? -1 : 1) : null
</script>

<ul id={ !href ? 'root-node' : ''} class={ (!expanded ? 'closed' : '') + ' ' + ((object.children && object.children.length > 0) ? 'branch-node' : 'leaf-node') }>
    {#if object.children && object.children.length > 0 }
    <div class='branch-wrapper'>
        <a class='branch-link' href={ href ? href : object.name } target='_blank'>{ object.name }</a>
        <span class='children-label'>{ object.children.length } { object.children.length > 1 ? 'children' : 'child' }</span>
        {#if descendants !== object.children.length}
        <span class='children-label descendants'>{ descendants } { 'descendents' }</span>
        {/if}
        <button on:click={ () => { expanded = !expanded }}>{ expanded ? '← Collapse' : 'Expand →' }</button>
    </div>
    {#each object.children as child, i (object.name+'-'+child.name+'-'+i)}
    <svelte:self object={ child } href={ href ? href + child.name : object.name + child.name } expanded={ expanded }/>
    {/each}
    {:else}
    <li>
        <a class='leaf-link' href={ href ? href : object.name } target='_blank' >{ object.name }</a>
    </li>
    {/if}
</ul>

<style>
    ul, li {
        box-sizing: border-box;
        display: block;
        margin: 1.9em 0 1.75em 0;
    }

    ul {
        position: relative;
    }

    ul::before {
        content: '';
        position: absolute;
        top: -2em;
        left: 11px;
        width: 1px;
        background: var(--text-dark);
        height: 1.6em;
    }

    .branch-node:not(:last-of-type)::after {
        content: '';
        position: absolute;
        width: 1px;
        height: 100%;
        top: 0;
        left: 11px;
        background: var(--text-dark);
    }

    ul > div {
        height: fit-content;
    }

    ul.closed > ul,
    ul.closed > li {
        display: none;
    }

    li {
        list-style-type: none;
        width: fit-content;
    }

    .branch-link, .leaf-link, button {
        --line-weight: 1px;
        --inset: 28px;
        text-decoration: none;
        color: var(--text-dark);
        border: none;
        font-size: 1em;
        background: var(--bg-20pct);
        border-radius: 3em;
        padding: .35em 1.75em;
        margin: 0;
        box-sizing: border-box;
        position: relative;
        line-height: 2;
    }

    .branch-link:hover,
    .leaf-link:hover {
        background: var(--text-medium);
        color: var(--bg-light);
    }

    button {
        margin-inline-start: auto;
        background: none;
        color: var(--text-medium);
        padding: 0 1.5em;
        font-size: .8rem;
    }
    button:hover {
        background: var(--bg-5pct);
    }

    .branch-link:not(last-child)::before,
    .leaf-link:not(last-child)::before {
        position: absolute;
        content: '';
        right: 100%;
        width: var(--inset);
        height: 125%;
        top: calc(-50% - .3em);
        border-radius: 0 0 0 calc(var(--inset) / 2);
        border: solid var(--line-weight) var(--text-dark);
        border-top: none;
        border-right: none;
    }

    .leaf-link:not(last-child)::before {
        border-radius: 0;
    }

    .leaf-link {
        border-radius: .25em;
        padding: .35em 1.25em;
    }

    ul:not(:last-of-type)::after {
        position: absolute;
        content: '';
        background: var(--text-dark);
        width: 1px;
        left: 11px;
        height: 2em;
        bottom: -.5em;
    }

    .children-label {
        display: inline-block;
        font-size: .8rem;
        color: var(--text-dark);
        margin: 0 1em;
    }

    .descendants {
        color: var(--text-medium);
    }

    #root-node {
        margin-block-start: 1.3em;
    }

    #root-node::before,
    #root-node::after {
        display: none;
    }
</style>