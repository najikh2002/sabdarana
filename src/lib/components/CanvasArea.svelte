<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { drawingStore } from '$lib/stores/drawingStore';
	import { get } from 'svelte/store';

	export let width: number;
	export let height: number;
	export let help: boolean = false;
	export let onCheck: () => void;
	export let onHelp: () => void;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let drawing = false;

	// Konversi posisi pointer ke koordinat asli canvas
	function getRelativePoint(event: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: ((event.clientX - rect.left) * width) / rect.width,
			y: ((event.clientY - rect.top) * height) / rect.height
		};
	}

	function handleStart(event: PointerEvent) {
		const point = getRelativePoint(event);
		drawingStore.startDrawing(point);
		drawing = true;
	}

	function handleMove(event: PointerEvent) {
		if (!drawing) return;
		const point = getRelativePoint(event);
		drawingStore.draw(point);
	}

	function handleEnd() {
		if (drawing) {
			drawingStore.endDrawing();
			drawing = false;
		}
	}

	function drawStrokes() {
		const { strokes, currentStroke } = get(drawingStore);

		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, width, height);

		ctx.lineWidth = 5;
		ctx.lineCap = 'round';
		ctx.strokeStyle = 'black';

		for (const stroke of strokes) {
			ctx.beginPath();
			for (let i = 0; i < stroke.length; i++) {
				const { x, y } = stroke[i];
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}

		if (currentStroke.length > 0) {
			ctx.beginPath();
			for (let i = 0; i < currentStroke.length; i++) {
				const { x, y } = currentStroke[i];
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
	}

	function clearCanvas() {
		drawingStore.clearCanvas();
		drawingStore.resetStatus();
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		const unsubscribe = drawingStore.subscribe(() => {
			drawStrokes();
		});
		return unsubscribe;
	});

	export async function getCanvasBlob(): Promise<Blob> {
		await tick();
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) resolve(blob);
				else reject(new Error('Failed to create blob from canvas'));
			}, 'image/jpeg');
		});
	}
</script>

<div class="canvas-container">
	<div class="canvas-wrapper">
		<canvas
			bind:this={canvas}
			{width}
			{height}
			on:pointerdown={handleStart}
			on:pointermove={handleMove}
			on:pointerup={handleEnd}
			on:pointerleave={handleEnd}
		></canvas>
		<button on:click={clearCanvas} class="clear-btn md:hover:bg-[#b2f135c2]" title="Clear canvas"
			>✕</button
		>
	</div>
	{#if help}
		<div class="flex w-full justify-between">
			<button on:click={onHelp} class="btn help-btn">Help</button>
			<button on:click={onCheck} class="btn check-btn">Check</button>
		</div>
	{:else}
		<button on:click={onCheck} class="btn check-btn">Check</button>
	{/if}
</div>

<style>
	.canvas-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.canvas-wrapper {
		position: relative;
		width: 100%;
		max-width: 300px;
		aspect-ratio: 1 / 1;
	}

	canvas {
		width: 100%;
		height: 100%;
		background-color: white;
		border: 2px solid #b3f135;
		border-radius: 20px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		touch-action: none;
		display: block;
	}

	.clear-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		background: #b3f135;
		color: white;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		border: none;
		cursor: pointer;
		font-size: 18px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: background 0.2s;
	}

	.btn {
		margin-top: 16px;
		color: white;
		border-radius: 24px;
		padding: 10px 32px;
		font-size: 18px;
		border: none;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background 0.2s;
	}

	.check-btn {
		border-radius: 35px;
		border: 1px solid var(--Foundation-Green-green-400, #b3f135);
		background: var(
			--gradient-green,
			linear-gradient(
				96deg,
				rgba(187, 255, 114, 0.9) 1.29%,
				rgba(123, 226, 12, 0.9) 50.7%,
				rgba(67, 126, 4, 0.9) 100.11%
			)
		);
	}
	.check-btn:hover {
		background: #b3f135;
		box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
	}
	.help-btn:hover {
		background: linear-gradient(
			96.44deg,
			rgba(255, 185, 114, 0.9) 20.29%,
			rgba(252, 113, 19, 0.9) 60.7%,
			hsla(17, 90%, 40%, 0.9) 90.11%
		);
	}

	.help-btn {
		background: linear-gradient(
			96.44deg,
			rgba(255, 185, 114, 0.9) 1.29%,
			rgba(252, 113, 19, 0.9) 50.7%,
			rgba(196, 62, 10, 0.9) 100.11%
		);
	}
</style>
