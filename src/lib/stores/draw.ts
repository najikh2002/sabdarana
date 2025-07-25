import { writable } from 'svelte/store';
import { checkDrawValid, getDrawPing } from '$lib/services/draw.service';
import type { DrawModel } from '$lib/models/draw.model';

export const draw = writable<{
	strokes: number[][][];
	activeLetter: string;
	drawModel: { status: 'init' | 'loading' | 'success' | 'error'; data?: DrawModel; error?: any };
	ping: string;
}>({
	strokes: [],
	activeLetter: 'HA',
	drawModel: { status: 'init' },
	ping: ''
});

export const drawActions = {
	startStroke(point: number[]) {
		draw.update((s) => {
			s.strokes.push([point]);
			return s;
		});
	},

	drawPoint(point: number[]) {
		draw.update((s) => {
			s.strokes[s.strokes.length - 1].push(point);
			return s;
		});
	},

	endStroke() {},

	clearCanvas() {
		draw.update((s) => {
			s.strokes = [];
			return s;
		});
	},

	setLetter(letter: string) {
		draw.update((s) => {
			s.activeLetter = letter;
			s.strokes = [];
			return s;
		});
	},

	async checkValidDrawing(canvasBlob: Blob) {
		draw.update((s) => {
			s.drawModel = { status: 'loading' };
			return s;
		});

		try {
			const result = await checkDrawValid(get(draw).activeLetter, canvasBlob);
			draw.update((s) => {
				s.drawModel = { status: 'success', data: result };
				return s;
			});
		} catch (err) {
			draw.update((s) => {
				s.drawModel = { status: 'error', error: err };
				return s;
			});
		}
	},

	async getPing() {
		try {
			const ping = await getDrawPing();
			draw.update((s) => {
				s.ping = ping;
				return s;
			});
		} catch (e) {
			console.error(e);
		}
	},

	resetStatus() {
		draw.update((s) => {
			s.drawModel = { status: 'init' };
			return s;
		});
	}
};
