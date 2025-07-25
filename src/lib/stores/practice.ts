import { writable } from 'svelte/store';
import { checkPracticeValid, getPracticePing } from '$lib/services/practice.service';
import type { PracticeModel } from '$lib/models/practice.model';

export const practice = writable<{
	strokes: number[][][];
	drawModel: {
		status: 'init' | 'loading' | 'success' | 'error';
		data?: PracticeModel;
		error?: any;
	};
	ping: string;
}>({
	strokes: [],
	drawModel: { status: 'init' },
	ping: ''
});

export const practiceActions = {
	startStroke(point: number[]) {
		practice.update((s) => {
			s.strokes.push([point]);
			return s;
		});
	},

	drawPoint(point: number[]) {
		practice.update((s) => {
			s.strokes[s.strokes.length - 1].push(point);
			return s;
		});
	},

	endStroke() {},

	clearCanvas() {
		practice.update((s) => {
			s.strokes = [];
			return s;
		});
	},

	async checkValidDrawing(canvasBlob: Blob) {
		practice.update((s) => {
			s.drawModel = { status: 'loading' };
			return s;
		});

		try {
			const result = await checkPracticeValid(canvasBlob);
			practice.update((s) => {
				s.drawModel = { status: 'success', data: result };
				return s;
			});
		} catch (err) {
			practice.update((s) => {
				s.drawModel = { status: 'error', error: err };
				return s;
			});
		}
	},

	async getPing() {
		try {
			const ping = await getPracticePing();
			practice.update((s) => {
				s.ping = ping;
				return s;
			});
		} catch (e) {
			console.error(e);
		}
	},

	resetStatus() {
		practice.update((s) => {
			s.drawModel = { status: 'init' };
			return s;
		});
	}
};
