<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CharacterLabel } from '$lib/constants/labels';

	export let isDesktop: boolean;
	export let status: boolean;
	export let text: string;
	export let labels: CharacterLabel[];
	export let onNextCharacter: () => void;

	const dispatch = createEventDispatcher<{
		close: void;
		nextCharacter: void;
	}>();

	// Reactive variable untuk menyimpan ikon karakter dari text
	$: characterIcon = (() => {
		const match = text.match(/'([^']+)'/);
		const prediction = match ? match[1] : '';
		// @ts-ignore
		const label = labels.find((l) => l.label === prediction);
		return label?.icon;
	})();

	function handleClose() {
		dispatch('close');
	}

	function handleNext() {
		onNextCharacter();
		dispatch('nextCharacter');
	}
</script>

<div class="dialog-content" class:desktop={isDesktop}>
	{#if isDesktop}
		<div class="desktop-container">
			<img
				src={status ? '/write_success.png' : '/write_failed.png'}
				alt={status ? 'Success' : 'Failed'}
				width="200"
				height="200"
			/>
			<div class="text-container">
				<h2>{status ? 'Great!' : 'Oops!'}</h2>
				{#if status && characterIcon}
					<span class="character-icon">{characterIcon}</span>
				{/if}
				<p>
					{text ||
						(status
							? 'Anda telah menyelesaikan karakter ini.\nSiap lanjut?'
							: 'Sepertinya tulisan aksara Anda perlu diperbaiki.')}
				</p>
			</div>
		</div>
		<div class="actions">
			<button class="close-btn" on:click={handleClose}>Tutup</button>
			<button class="next-btn" on:click={handleNext}>Karakter Berikutnya</button>
		</div>
	{:else}
		<div class="mobile-container">
			<img
				src={status ? '/write_success.png' : '/write_failed.png'}
				alt={status ? 'Success' : 'Failed'}
				width="120"
				height="120"
			/>
			<h2>{status ? 'Great!' : 'Oops!'}</h2>
			{#if status && characterIcon}
				<span class="character-icon">{characterIcon}</span>
			{/if}
			<p>
				{text ||
					(status
						? 'Anda telah menyelesaikan karakter ini.\nSiap lanjut?'
						: 'Sepertinya tulisan aksara Anda perlu diperbaiki.')}
			</p>
			<div class="actions-mobile">
				<button class="next-btn" on:click={handleNext}>Karakter Berikutnya</button>
				<button class="close-btn" on:click={handleClose}>Tutup</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dialog-content {
		background-color: white;
		border-radius: 15px;
		padding: 32px;
		text-align: center;
		max-width: 90%;
	}

	.desktop-container {
		display: flex;
		align-items: center;
		gap: 40px;
	}

	.text-container {
		text-align: right;
	}

	.mobile-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	h2 {
		font-size: 56px;
		font-weight: 900;
		font-family: 'Poppins', sans-serif;
		color: #0e3f66;
		margin: 0;
	}

	p {
		font-size: 20px;
		color: #0e3f66;
		white-space: pre-line;
		margin: 8px 0 0;
	}

	.character-icon {
		font-family: 'NotoSansJavanese', sans-serif;
		font-size: 40px;
		color: #0e3f66;
		display: block;
		margin: 8px 0;
	}

	.actions {
		display: flex;
		justify-content: space-evenly;
		margin-top: 20px;
	}

	.actions-mobile {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}

	.close-btn {
		background-color: #e9f5fe;
		border: 1px solid #2196f3;
		border-radius: 24px;
		padding: 12px 64px;
		color: #2196f3;
		font-size: 24px;
		cursor: pointer;
	}

	.next-btn {
		background-color: #2196f3;
		border: none;
		border-radius: 24px;
		padding: 12px 20px;
		color: white;
		font-size: 24px;
		font-weight: bold;
		cursor: pointer;
	}

	.mobile-container h2 {
		font-size: 32px;
	}

	.mobile-container p {
		font-size: 16px;
	}

	.mobile-container .character-icon {
		font-size: 24px;
	}

	.mobile-container .next-btn,
	.mobile-container .close-btn {
		width: 100%;
		padding: 12px;
		font-size: 18px;
	}
</style>
