<script lang="ts">
	import { onMount } from 'svelte';
	import CanvasArea from '$lib/components/CanvasArea.svelte';
	import CharacterGrid from '$lib/components/CharacterGrid.svelte';
	import ResultDialog from '$lib/components/ResultDialog.svelte';
	import LoadingDialog from '$lib/components/LoadingDialog.svelte';
	import { drawVM, setActiveLetter } from '$lib/stores/drawVM';
	import { drawingStore, trainingStore } from '$lib/stores/drawingStore';
	import { screenSize } from '$lib/utils/mediaStore';
	import { characterLabels } from '$lib/constants/labels';
	import { characterJavaneseLabels } from '$lib/utils/labels';
	import { ApiEndpoints } from '$lib/network/api-endpoints';

	let canvasRef: { getCanvasBlob: () => Promise<Blob> } | null = null;
	let showHelp = false;

	$: isDesktop = $screenSize.width > 950;
	$: drawStatus = $trainingStore.drawModel.status;
	$: showDialog = drawStatus === 'success' || drawStatus === 'error';
	$: activeLetter = $drawVM.activeLetter;

	// set ping saat load
	onMount(() => {
		if (!$drawVM.activeLetter) {
			setActiveLetter('HA');
		}
	});

	async function handleCheck() {
		if (!canvasRef) return;
		const blob = await canvasRef.getCanvasBlob();
		await trainingStore.checkValidDrawing($drawVM.activeLetter, blob, ApiEndpoints.TRAINING);
	}

	function handleNextCharacter() {
		trainingStore.resetStatus();
		drawingStore.clearCanvas();

		const currentIndex = characterLabels.findIndex((c) => c.value === activeLetter);

		const nextLabel =
			currentIndex < characterLabels.length - 1 && drawStatus === 'success'
				? characterLabels[currentIndex + 1].value
				: characterLabels[currentIndex].value;
		setActiveLetter(nextLabel);
	}

	function handleCloseDialog() {
		trainingStore.resetStatus();
	}

	function handleShowHelp() {
		showHelp = true;
	}

	let modalEl: HTMLDivElement | null = null;

	// Klik luar area video => tutup modal
	function handleClickOutside(event: MouseEvent) {
		if (event.target === modalEl) {
			onCloseHelp();
		}
	}

	const onHelp = () => {
		showHelp = true;
	};

	function onCloseHelp() {
		showHelp = false;
	}
</script>

<svelte:head>
	<title>Training - Javanese Script</title>
	<meta name="description" content="Javanese Script Learning Platform." />
	<meta
		name="keywords"
		content="aksara jawa, belajar aksara jawa, menulis aksara jawa, huruf jawa, carakan, hanacaraka, arutala aksara, pembelajaran aksara nusantara, AI aksara jawa"
	/>
</svelte:head>

<div class="flex min-h-screen w-full items-center justify-center">
	{#if isDesktop}
		<!-- Desktop layout -->
		<div
			class="flex flex-row items-center justify-center gap-12 rounded-[40px] px-6 py-10 md:px-12 md:py-16 lg:px-[90px] lg:py-[122px]"
		>
			<CharacterGrid
				labels={characterLabels.map(({ icon, value }) => ({ label: value, icon }))}
				isDesktop={true}
				script="aksara-jawa"
			/>

			<div class="canvas-wrapper">
				<CanvasArea
					width={300}
					height={300}
					bind:this={canvasRef}
					onCheck={handleCheck}
					{onHelp}
					help={false}
				/>
			</div>
		</div>
	{:else}
		<!-- Mobile layout -->
		<div class="flex min-h-screen flex-col items-center gap-6 p-4">
			<div class="w-full max-w-screen-sm overflow-x-auto">
				<CharacterGrid
					labels={characterLabels.map(({ icon, value }) => ({ label: value, icon }))}
					isDesktop={false}
					script="aksara-jawa"
				/>
			</div>

			<CanvasArea
				width={$screenSize.width * 0.8}
				height={$screenSize.width * 0.8}
				bind:this={canvasRef}
				onCheck={handleCheck}
				{onHelp}
				help={false}
			/>
		</div>
	{/if}

	{#if drawStatus === 'loading'}
		<LoadingDialog text="Sedang Memeriksa Tulisan Anda..." />
	{/if}

	{#if showDialog}
		<ResultDialog
			show={true}
			{isDesktop}
			status={drawStatus === 'success'}
			labels={characterLabels.map(({ icon, value }) => ({ label: value, value: icon }))}
			text={`"${$drawVM.activeLetter}"`}
			onNextCharacter={handleNextCharacter}
			onCloseDialog={handleCloseDialog}
			learning="training"
		/>
	{/if}
</div>

<style>
	.canvas-wrapper {
		display: flex;
		width: 411px;
		height: 489px;
		padding: 10px;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10px;
		border-radius: 16px;
		background: rgba(0, 0, 0, 0);
	}
</style>
