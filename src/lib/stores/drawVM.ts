import { writable } from 'svelte/store';

export interface Point {
	x: number;
	y: number;
}

export type Stroke = Point[];

export const drawVM = writable({
	strokes: [] as Stroke[],
	currentStroke: [] as Stroke,
	activeLetter: '',
	status: null as boolean | null,
	results: [] as string[]
});

export function startDrawing(point: Point) {
	drawVM.update((vm) => ({
		...vm,
		currentStroke: [point]
	}));
}

export function draw(point: Point) {
	drawVM.update((vm) => ({
		...vm,
		currentStroke: [...vm.currentStroke, point]
	}));
}

export function endDrawing() {
	drawVM.update((vm) => {
		if (vm.currentStroke.length > 0) {
			return {
				...vm,
				strokes: [...vm.strokes, vm.currentStroke],
				currentStroke: []
			};
		}
		return vm;
	});
}

export function clearCanvas() {
	drawVM.update((vm) => ({
		...vm,
		strokes: [],
		currentStroke: []
	}));
}

export function setActiveLetter(letter: string) {
	drawVM.update((vm) => ({
		...vm,
		activeLetter: letter
	}));
}

export function setStatus(status: boolean) {
	drawVM.update((vm) => ({
		...vm,
		status
	}));
}

export function resetStatus() {
	drawVM.update((vm) => ({
		...vm,
		status: null,
		results: []
	}));
}

export function setResults(newResults: string[]) {
	drawVM.update((vm) => ({
		...vm,
		results: newResults
	}));
}
