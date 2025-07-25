<script lang="ts">
	import { onMount } from 'svelte';
	import { drawVM } from '$lib/stores/drawVM';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let strokes: any[] = [];

	drawVM.subscribe((vm) => {
		strokes = vm.strokes;
		drawCanvas();
	});

	function drawCanvas() {
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = 'black';
		ctx.lineWidth = 5;
		ctx.lineCap = 'round';

		for (const stroke of strokes) {
			if (stroke.length < 2) continue;
			ctx.beginPath();
			ctx.moveTo(stroke[0].x, stroke[0].y);
			for (let i = 1; i < stroke.length; i++) {
				ctx.lineTo(stroke[i].x, stroke[i].y);
			}
			ctx.stroke();
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		drawCanvas();
	});

	// **Expose method ke parent**
	export function getCanvasBlob(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (!blob) reject('Failed to get canvas blob');
				else resolve(blob);
			});
		});
	}
</script>

<canvas bind:this={canvas} width={400} height={400} class="rounded-lg border border-gray-300"
></canvas>
