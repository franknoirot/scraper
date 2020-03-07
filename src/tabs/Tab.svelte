<script>
	import { getContext } from 'svelte';
	import { TABS } from './Tabs.svelte';
	export let className = ''

	const tab = {};
	const { registerTab, selectTab, selectedTab } = getContext(TABS);

	registerTab(tab);
</script>

<style>
	button {
		counter-increment: tabs;
		position: relative;
		background: var(--bg-20pct);
		color: var(--text-dark);
		border: none;
		border-radius: 0;
		padding: .5em 2em;
		margin: 0;
		box-shadow: inset 0 -4px 6px rgba(0,0,0,0.1);
		transition: all .12s ease-in-out;
	}

	button::before {
		content: counter(tabs) '.';
		margin-inline-end: .5em;
	}

	button:first-child {
		margin-inline-start: 1em;
		border-radius: 8px 0 0 0;
	}
	
	button:last-child {
		border-radius: 0 8px 0 0;
	}

	.selected {
		background: var(--bg-light);
		box-shadow: inset 0 0 0 rgba(0,0,0,0);
	}
</style>

<button class={'tab' + (($selectedTab === tab) ? ' selected': '') + (className ? ` ${ className }` : '')}
	on:click="{() => selectTab(tab)}">
	<slot></slot>
</button>