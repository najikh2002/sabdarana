<script lang="ts">
	import CanvasArea from '$lib/components/CanvasArea.svelte';
	import ResultDialog from '$lib/components/ResultDialog.svelte';
	import { challengeStore, drawingStore } from '$lib/stores/drawingStore';
	import { screenSize } from '$lib/utils/mediaStore';
	import { characterSundaneseLabels } from '$lib/constants/labels';
	import LoadingDialog from '$lib/components/LoadingDialog.svelte';
	import { onMount } from 'svelte';
	import { ApiSundaneseEndpoints } from '$lib/network/api-endpoints';

	let drawingCanvasRef: { getCanvasBlob: () => Promise<Blob> } | null = null;
	let showHelp = false;
	let randomSundaneseScript = getRandomLabel();

	// reactive declarations
	$: isDesktop = $screenSize.width > 800;
	$: drawStatus = $challengeStore.drawModel.status;
	$: showDialog = drawStatus === 'success' || drawStatus === 'error';

	async function handleCheck() {
		try {
			if (!drawingCanvasRef) throw new Error('DrawingCanvas reference not set');
			const blob = await drawingCanvasRef.getCanvasBlob();
			await challengeStore.checkValidChallenge(
				randomSundaneseScript,
				blob,
				ApiSundaneseEndpoints.CHALLENGE
			);
		} catch (e) {
			console.error('Failed to get canvas blob:', e);
		}
	}

	function handleNextCharacter() {
		challengeStore.resetStatus();
		drawingStore.clearCanvas();
		if (drawStatus === 'success') {
			randomSundaneseScript = getRandomLabel();
		}
	}

	function handleCloseDialog() {
		challengeStore.resetStatus();
	}

	const onHelp = () => {
		showHelp = true;
	};

	function onCloseHelp() {
		showHelp = false;
	}

	function getRandomLabel() {
		const random =
			characterSundaneseLabels[Math.floor(Math.random() * characterSundaneseLabels.length)];
		return random.value;
	}
</script>

<svelte:head>
	<title>Challenge - Sundanese Script</title>
	<meta
		name="description"
		content="Platform pembelajaran aksara Sunda interaktif dengan bantuan AI. Latihan menulis, tantangan, dan praktik aksara Sunda untuk melestarikan budaya Sunda."
	/>
	<meta
		name="keywords"
		content="aksara sunda, belajar aksara sunda, menulis aksara sunda, huruf sunda, cacarakan, kaganga, arutala aksara, pembelajaran aksara sunda, AI aksara sunda, budaya sunda"
	/>
</svelte:head>

<div class="flex min-h-screen w-full flex-col items-center justify-center px-4">
	<!-- <div class="prompt-box">Write down the Javanese characters you remember and check them!</div> -->

	<div class="relative flex flex-1 flex-col items-center justify-center gap-6 md:flex-row">
		<div class="flex items-center justify-center text-center md:max-w-1/3 md:text-start">
			<h2 class="text-3xl font-extrabold text-gray-500">
				Write the Sundanese script for “{randomSundaneseScript}”!
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
			text={`"${randomSundaneseScript}"`}
			labels={characterSundaneseLabels.map(({ icon, value }) => ({ label: value, value: icon }))}
			onNextCharacter={handleNextCharacter}
			onCloseDialog={handleCloseDialog}
		/>
	{/if}
</div>

<style>
	.canvas-wrapper {
		border-radius: 16px;
		/* padding: 1rem;
		margin: auto; */
	}
</style>
