<script>
	import { Tabs, TabList, TabPanel, Tab } from './tabs';
	import { BuildSitemap, SetUpModels, PrepareScrape, ViewResults } from './views'
	import { scrapesRun, sitemap, scraperModels, scrapeOperations, scrapeResults, scrapeURLs } from './stores.js'

	let isConnected = navigator.onLine
	window.addEventListener('offline', () => { isConnected = false });
	window.addEventListener('online', () => { isConnected = true });
	
	let scrapeIsReady = false
	$: scrapeIsReady = ($sitemap && $scraperModels && $scrapeOperations && isConnected
			&& $scrapeOperations.every(operation => operation.model))

	let tabLabels = [
		'Build Sitemap',
		'Set Up Models',
		'Prepare Scrape',
	]
	let currView = 0
	let textInput = {}
	let textVal = ''
	let isScraping = false
	$: totalPages = $scrapeURLs ? $scrapeURLs.flat().length : undefined
	$: pagesToScrape = $scrapeURLs ? totalPages : undefined
	$: arrVal = (function (val) {
		try {
			return JSON.parse(val)
		} catch(err) {
			return null
		}
	})(textVal)

	if (window.api) {
		window.api.receive('fromMain:sitemap', newSitemap => {
			console.log('received new site map!')
			$sitemap = newSitemap
			$scrapeResults = undefined
		})

		window.api.receive('fromMain:scrapePageSuccess', url => {
			console.log(`successfully scraped page: ${ url }`)
			pagesToScrape--
		})

		window.api.receive('fromMain:scrapeSuccess', results => {
			if (tabLabels.includes('View Results')) {
				const newLabels = tabLabels.filter(label => label !== 'View Results')
				tabLabels = newLabels
			}
			console.log('scrape results: ', results)
			isScraping = false
			$scrapeResults = results
			tabLabels = [...tabLabels, 'View Results']
			$scrapesRun++
		})
		
		window.api.receive('fromMain:scrapeFailure', err => {
			console.log('err = ', err)
			$scrapeResults = undefined
			if (tabLabels.includes('View Results')) {
				const newLabels = tabLabels.filter(label => label !== 'View Results')
				tabLabels = newLabels
			}
			$scrapesRun++
		})

	}

	function handleRun() {
		console.log('models = ', $scraperModels)
		console.log('operations = ', $scrapeOperations)
		console.log('sitemap = ', $sitemap)
		console.log('scrapeURLs = ', $scrapeURLs)

		if (window.api) {
			window.api.send('toMain:scrape', {
				sitemap: $sitemap,
				operations: $scrapeOperations.map(op => {
					const newOp = op
					newOp.model = $scraperModels.find(model => model.name === newOp.model)
					return newOp
				})
			})
			isScraping = true
		} else {
			console.error('running in environment without access to Node scraper function!')
		}
	}
</script>

<Tabs>
	<header style={ (isScraping && pagesToScrape > 0) ? `--scrape-progress: ${ 100 - (pagesToScrape / totalPages * 100) }%;` : ''}>
		<span class={'connection-status' + (isConnected ? ' connected' : '') }>{ isConnected ? 'Connected' : 'Not Connected' }</span>
		<button class='run-scrape' disabled={ !scrapeIsReady }
			on:click={() => handleRun() }>Run Scrape</button>
		<TabList>
			{#each tabLabels as label, i (label)}
			<Tab className={(label.includes('Results') ? 'results' : '') + (isScraping ? ' scraping' : '')}>{ label }</Tab>
			{/each}
		</TabList>
		{#if isScraping && pagesToScrape > 0}
			<div class='progress-bar'>
				<div class='bar'></div>
				<p>{ (pagesToScrape === $scrapeURLs.flat().length) ? 'Scraping...' : `${ totalPages - pagesToScrape } of ${ totalPages } pages scraped` }</p>
			</div>
		{/if}
	</header>
	<main>
		<TabPanel key='panel-0'>
			<BuildSitemap />
		</TabPanel>
		<TabPanel key='panel-1'>
			<SetUpModels />
		</TabPanel>
		<TabPanel key='panel-2'>
			<PrepareScrape />
		</TabPanel>
		{#if $scrapeResults}
		<TabPanel key='panel-3'>
			<ViewResults/>
		</TabPanel>
		{/if}
	</main>
</Tabs>

<style>
	main {
		padding: 0 15vw;
	}

	header {
		background: var(--bg-dark);
		color: var(--bg-light);
		height: 12vh;
		min-height: 100px;
		position: relative;
	}

	.progress-bar {
		position: absolute;
		left: 50%;
		top: 2vh;
		transform: translate(-50%);
		color: var(--bg-light);
		text-align: center;
		width: 50vw;
	}

	.progress-bar .bar {
		margin: auto;
		width: var(--scrape-progress);
		background: var(--success-light);
		height: 3px;
		border-radius: 3px;
		transition: width .09s ease-in-out;
	}

	.progress-bar p {
		font-size: .8em;
		margin: .5em 0;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.connection-status {
		--color: var(--warning);
		position: absolute;
		left: 2.5em;
		top: 2vh;
		color: var(--color);
		font-size: .8em;
		text-transform: uppercase;
	}

	.connection-status::before {
		content: '';
		position: absolute;
		right: calc(100% + .5em);
		top: 50%;
		border-radius: 50%;
		background: var(--color);
		--size: .75em;
		width: var(--size);
		height: var(--size);
		transform: translate(0, -50%);
		filter: drop-shadow(0 0 3px var(--color));
	}

	.connection-status.connected {
		--color: var(--success);
	}

	.run-scrape {
		display: block;
		position: absolute;
		top: 6vh;
		right: 5vw;
		--init-transform: translate(0, -50%);
		transform: var(--init-transform);
		background: linear-gradient(35deg, var(--primary), var(--text-dark));
		color: var(--bg-light);
		border-radius: 5em;
		box-shadow: var(--bs-btn-default);
		border: none;
		padding: .3em 1.5em;
		transition: all .12s ease-in-out;
	}

	.run-scrape[disabled] {
		background: var(--bg-20pct);
		color: var(--text-dark);
		box-shadow: 0 0 0 rgba(0,0,0,1);
	}

	.run-scrape:hover:not([disabled]) {
		transform: var(--init-transform) translateY(-2px);
		box-shadow: 0 6px 8px rgba(0,0,0,0.08);
	}
</style>