<script lang="ts">
	import CanvasArea from '$lib/components/CanvasArea.svelte';
	import ResultDialog from '$lib/components/ResultDialog.svelte';
	import { drawingStore } from '$lib/stores/drawingStore';
	import { screenSize } from '$lib/utils/mediaStore';
	import { characterLabels } from '$lib/constants/labels';
	import LoadingDialog from '$lib/components/LoadingDialog.svelte';
	// import { onMount } from 'svelte';
	// import { requireLogin } from '$lib/auth/authGuard';
	import { ApiEndpoints } from '$lib/network/api-endpoints';
	import { javaneseLabels } from '$lib/models/labels';

	let drawingCanvasRef: { getCanvasBlob: () => Promise<Blob> } | null = null;
	let showHelp = false;

	// reactive declarations
	$: isDesktop = $screenSize.width > 800;
	$: drawStatus = $drawingStore.drawModel.status;
	$: showDialog = drawStatus === 'success' || drawStatus === 'error';

	async function handleCheck() {
		try {
			if (!drawingCanvasRef) throw new Error('DrawingCanvas reference not set');
			const blob = await drawingCanvasRef.getCanvasBlob();
			await drawingStore.checkValidDrawing(blob, ApiEndpoints.PRACTICE, javaneseLabels);
		} catch (e) {
			console.error('Failed to get canvas blob:', e);
		}
	}

	function handleNextCharacter() {
		drawingStore.resetStatus();
		drawingStore.clearCanvas();
	}

	function handleCloseDialog() {
		drawingStore.resetStatus();
	}

	const onHelp = () => {
		showHelp = true;
	};

	function onCloseHelp() {
		showHelp = false;
	}
</script>

<svelte:head>
	<title>Practice - Javanese Script</title>
	<meta name="description" content="Javanese Script Learning Platform." />
	<meta
		name="keywords"
		content="aksara jawa, belajar aksara jawa, menulis aksara jawa, huruf jawa, carakan, hanacaraka, arutala aksara, pembelajaran aksara nusantara, AI aksara jawa"
	/>
</svelte:head>

<div class="flex min-h-screen w-full flex-col items-center justify-center px-4">
	<!-- <div class="prompt-box">Write down the Javanese characters you remember and check them!</div> -->

	<div class="relative flex flex-1 flex-col items-center justify-center gap-6 md:flex-row">
		<div class="flex items-center justify-center text-center md:max-w-1/3 md:text-start">
			<h2 class="text-3xl font-extrabold text-gray-500">
				Write down the Javanese characters you remember and check them!
			</h2>
		</div>

		<div class="canvas-wrapper">
			<CanvasArea
				bind:this={drawingCanvasRef}
				width={300}
				height={300}
				onCheck={handleCheck}
				{onHelp}
				help={false}
			/>
		</div>

		{#if drawStatus === 'loading'}
			<LoadingDialog />
		{/if}
	</div>

	{#if showDialog}
		<ResultDialog
			{isDesktop}
			show={showDialog}
			status={drawStatus === 'success'}
			text={`"${$drawingStore.drawModel.data?.prediction}"`}
			labels={characterLabels.map(({ icon, value }) => ({ label: value, value: icon }))}
			onNextCharacter={handleNextCharacter}
			onCloseDialog={handleCloseDialog}
			learning="practice"
		/>
	{/if}
</div>

<style>
	.canvas-wrapper {
		border-radius: 16px;
		/* padding: 1rem; */
		/* margin: auto; */
	}
</style>
