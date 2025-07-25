<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { afterNavigate, invalidateAll } from '$app/navigation';
	import { scriptStore } from '$lib/stores/scriptStore';
	import { supabase } from '$lib/supabase/client';
	import type { LayoutData } from './$types';
	import { defaultConfig } from 'svelte-wagmi';
	import { injected } from '@wagmi/connectors';
	import { PUBLIC_ALCHEMY_ID, PUBLIC_WALLETCONNECT_ID } from '$env/static/public';

	let erckit;

	let { children, data }: { children: any; data: LayoutData } = $props();

	$effect(() => {
		const segments = page.url.pathname.split('/');
		const scriptCandidate = segments[1];
		const supportedScripts = ['javanese', 'sundanese'];
		if (supportedScripts.includes(scriptCandidate)) {
			scriptStore.set(scriptCandidate);
		}
	});

	onMount(async () => {
		erckit = defaultConfig({
			appName: 'ScriptCoin',
			alchemyId: PUBLIC_ALCHEMY_ID,
			walletConnectProjectId: PUBLIC_WALLETCONNECT_ID,
			connectors: [injected()]
		});
		await erckit.init();
	});

	onMount(() => {
		// Handle session state changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			// Sync session to server
			if (
				event === 'SIGNED_IN' ||
				event === 'SIGNED_OUT' ||
				event === 'TOKEN_REFRESHED' ||
				event === 'USER_UPDATED'
			) {
				// Invalidate all data to refresh server-side session
				await invalidateAll();
			}
		});

		if (browser && window.gtag) {
			window.gtag('config', 'G-YGDY47402E', {
				page_path: normalizePath()
			});
		}

		// Cleanup subscription
		return () => {
			subscription.unsubscribe();
		};
	});

	afterNavigate(() => {
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('config', 'G-YGDY47402E', {
				page_path: normalizePath()
			});
		}
	});

	function normalizePath() {
		return window.location.pathname.replace(
			/^\/(javanese|balinese|sundanese|lampungnese|bataknese)(\/|$)/,
			'/'
		);
	}
</script>

<svelte:head>
	<!-- Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-YGDY47402E"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());
		gtag('config', 'G-YGDY47402E');
	</script>
</svelte:head>

<main class="relative min-h-screen overflow-hidden">
	<!-- Background Layer -->
	<div class="absolute inset-0 -z-10">
		<!-- Background Image -->
		<img src="/bg.png" alt="" class="h-full w-full object-cover object-center" />
	</div>

	<!-- Page Content -->
	<div class="relative z-10">
		{@render children()}
	</div>
</main>
