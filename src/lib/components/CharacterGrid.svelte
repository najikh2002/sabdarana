<script lang="ts">
	import { drawVM, setActiveLetter, clearCanvas } from '$lib/stores/drawVM';

	export let labels: { label: string; icon: string }[];
	export let isDesktop: boolean;
	export let script: string;

	// Reaktif untuk track letter yang aktif
	$: activeLetter = $drawVM.activeLetter || 'HA';

	const handleSelect = (label: string) => {
		if (activeLetter !== label) {
			setActiveLetter(label);
			clearCanvas();
		}
	};
</script>

{#if isDesktop}
	<div class="grid w-[600px] grid-cols-5 gap-2">
		{#each labels as item}
			<button
				on:click={() => handleSelect(item.label)}
				class={`relative flex h-[100px] w-[100px] flex-col items-center justify-center font-sans transition
					${activeLetter === item.label ? 'text-[#b3f135]' : 'text-gray-400'} cursor-pointer transition-all hover:scale-125`}
			>
				<img class="absolute -z-10 scale-110" src="/rock-grid-char.png" alt="" />
				<div class={script}>{item.icon}</div>
				<div class="latin">{item.label}</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="scroll-container">
		{#each labels as item}
			<button
				on:click={() => handleSelect(item.label)}
				class={`relative flex h-[100px] w-[100px] flex-col items-center justify-center rounded-2xl font-sans transition
					${activeLetter === item.label ? 'text-[#b3f135]' : 'text-gray-400'}`}
			>
				<img class="absolute -z-10 scale-110" src="/rock-grid-char.png" alt="" />
				<div class={script}>{item.icon}</div>
				<div class="latin">{item.label}</div>
			</button>
		{/each}
	</div>
{/if}

<style>
	@font-face {
		font-family: 'AksaraJawa';
		src: url('/fonts/AksaraJawa.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
	}

	@font-face {
		font-family: 'AksaraSunda';
		src: url('/fonts/AksaraSunda.otf') format('opentype');
		font-weight: normal;
		font-style: normal;
	}

	.scroll-container {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		gap: 8px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding: 8px;
		width: 310px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.scroll-container::-webkit-scrollbar {
		display: none;
	}

	.aksara-jawa {
		font-family: 'AksaraJawa';
		font-size: 18px;
		line-height: 1;
	}

	.aksara-sunda {
		font-family: 'AksaraSunda';
		font-size: 18px;
		line-height: 1;
	}

	.latin {
		font-size: 13px;
	}
</style>
