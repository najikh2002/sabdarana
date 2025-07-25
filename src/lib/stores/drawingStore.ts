import { writable } from 'svelte/store';
import { checkPracticeValid, getPracticePing } from '$lib/services/practice.service';
import { checkChallengeValid } from '$lib/services/challenge.service';
import { checkDrawValid } from '$lib/services/draw.service';
import type { PracticeModel } from '$lib/models/practice.model';
import type { ChallengeModel } from '$lib/models/challenge.model';
import type { DrawModel } from '$lib/models/draw.model';

export interface Point {
	x: number;
	y: number;
}

export type Stroke = Point[];

interface DrawingState {
	strokes: Stroke[];
	currentStroke: Stroke;
	activeLetter: string;
	status: boolean | null;
	results: string[];
	drawModel: {
		status: 'init' | 'loading' | 'success' | 'error';
		data?: any;
		error?: any;
	};
	ping: string;
}

const initialState: DrawingState = {
	strokes: [],
	currentStroke: [],
	activeLetter: '',
	status: null,
	results: [],
	drawModel: { status: 'init' },
	ping: ''
};

const initialChallangeState: DrawingState = {
	strokes: [],
	currentStroke: [],
	activeLetter: '',
	status: null,
	results: [],
	drawModel: { status: 'init' },
	ping: ''
};

function createDrawingStore() {
	const { subscribe, update, set } = writable<DrawingState>(initialState);

	return {
		subscribe,

		// Stroke interaction
		startDrawing(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [point]
			}));
		},

		draw(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [...state.currentStroke, point]
			}));
		},

		endDrawing() {
			update((state) => {
				if (state.currentStroke.length > 0) {
					return {
						...state,
						strokes: [...state.strokes, state.currentStroke],
						currentStroke: []
					};
				}
				return state;
			});
		},

		clearCanvas() {
			update((state) => ({
				...state,
				strokes: [],
				currentStroke: [],
				status: null,
				results: []
			}));
		},

		setActiveLetter(letter: string) {
			update((state) => ({
				...state,
				activeLetter: letter
			}));
		},

		setStatus(status: boolean) {
			update((state) => ({
				...state,
				status
			}));
		},

		setResults(newResults: string[]) {
			update((state) => ({
				...state,
				results: newResults
			}));
		},

		// ML-related
		async checkValidDrawing(canvasBlob: Blob, url: any, labels: { icon: string; label: string }[]) {
			update((state) => ({
				...state,
				drawModel: { status: 'loading' }
			}));

			try {
				const result = await checkPracticeValid(canvasBlob, url);
				const isValid = labels.some((l) => l.label === result.prediction);
				console.log(isValid);

				if (isValid) {
					update((state) => ({
						...state,
						drawModel: { status: 'success', data: result }
					}));
				} else {
					// Prediction tidak dikenali
					update((state) => ({
						...state,
						drawModel: {
							status: 'error',
							error: new Error(`Prediction "${result.prediction}" not recognized`)
						}
					}));
				}
			} catch (err) {
				update((state) => ({
					...state,
					drawModel: { status: 'error', error: err }
				}));
			}
		},

		async getPing() {
			try {
				const ping = await getPracticePing();
				update((state) => ({ ...state, ping }));
			} catch (err) {
				console.error('Ping error:', err);
			}
		},

		resetStatus() {
			update((state) => ({
				...state,
				drawModel: { status: 'init' },
				status: null,
				results: []
			}));
		},

		getStrokesAsArray(): number[][][] {
			// @ts-ignore
			const s = get({ subscribe });
			return s.strokes.map((stroke: any) => stroke.map((p: any) => [p.x, p.y]));
		}
	};
}

function createChallangeStore() {
	const { subscribe, update, set } = writable<DrawingState>(initialChallangeState);

	return {
		subscribe,

		// Stroke interaction
		startDrawing(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [point]
			}));
		},

		draw(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [...state.currentStroke, point]
			}));
		},

		endDrawing() {
			update((state) => {
				if (state.currentStroke.length > 0) {
					return {
						...state,
						strokes: [...state.strokes, state.currentStroke],
						currentStroke: []
					};
				}
				return state;
			});
		},

		clearCanvas() {
			update((state) => ({
				...state,
				strokes: [],
				currentStroke: [],
				status: null,
				results: []
			}));
		},

		setActiveLetter(letter: string) {
			update((state) => ({
				...state,
				activeLetter: letter
			}));
		},

		setStatus(status: boolean) {
			update((state) => ({
				...state,
				status
			}));
		},

		setResults(newResults: string[]) {
			update((state) => ({
				...state,
				results: newResults
			}));
		},

		// ML-related
		async checkValidChallenge(challengeLetter: string, canvasBlob: Blob, url: any) {
			update((state) => ({
				...state,
				drawModel: { status: 'loading' }
			}));

			try {
				const result: ChallengeModel = await checkChallengeValid(challengeLetter, canvasBlob, url);
				// const isValid = labels.some((l) => l.label === result.prediction);

				console.log(`Hasil: ${result.status}`);
				if (result.status) {
					update((state) => ({
						...state,
						drawModel: { status: 'success', data: result.status }
					}));
				} else {
					update((state) => ({
						...state,
						drawModel: {
							status: 'error',
							error: new Error(`Prediction "${result}" not recognized`)
						}
					}));
				}
			} catch (err) {
				update((state) => ({
					...state,
					drawModel: { status: 'error', error: err }
				}));
			}
		},

		async getPing() {
			try {
				const ping = await getPracticePing();
				update((state) => ({ ...state, ping }));
			} catch (err) {
				console.error('Ping error:', err);
			}
		},

		resetStatus() {
			update((state) => ({
				...state,
				drawModel: { status: 'init' },
				status: null,
				results: []
			}));
		},

		getStrokesAsArray(): number[][][] {
			// @ts-ignore
			const s = get({ subscribe });
			return s.strokes.map((stroke: any) => stroke.map((p: any) => [p.x, p.y]));
		}
	};
}

function createTrainingStore() {
	const { subscribe, update, set } = writable<DrawingState>(initialChallangeState);

	return {
		subscribe,

		// Stroke interaction
		startDrawing(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [point]
			}));
		},

		draw(point: Point) {
			update((state) => ({
				...state,
				currentStroke: [...state.currentStroke, point]
			}));
		},

		endDrawing() {
			update((state) => {
				if (state.currentStroke.length > 0) {
					return {
						...state,
						strokes: [...state.strokes, state.currentStroke],
						currentStroke: []
					};
				}
				return state;
			});
		},

		clearCanvas() {
			update((state) => ({
				...state,
				strokes: [],
				currentStroke: [],
				status: null,
				results: []
			}));
		},

		setActiveLetter(letter: string) {
			update((state) => ({
				...state,
				activeLetter: letter
			}));
		},

		setStatus(status: boolean) {
			update((state) => ({
				...state,
				status
			}));
		},

		setResults(newResults: string[]) {
			update((state) => ({
				...state,
				results: newResults
			}));
		},

		// ML-related
		async checkValidDrawing(activeLetter: string, canvasBlob: Blob, url: any) {
			update((state) => ({
				...state,
				drawModel: { status: 'loading' }
			}));

			try {
				const result: DrawModel = await checkDrawValid(activeLetter, canvasBlob, url);
				console.log(result);

				if (result.status) {
					update((state) => ({
						...state,
						drawModel: { status: 'success', data: result }
					}));
				} else {
					update((state) => ({
						...state,
						drawModel: {
							status: 'error',
							error: new Error(`Prediction "${result}" not recognized`)
						}
					}));
				}
			} catch (err) {
				update((state) => ({
					...state,
					drawModel: { status: 'error', error: err }
				}));
			}
		},

		async getPing() {
			try {
				const ping = await getPracticePing();
				update((state) => ({ ...state, ping }));
			} catch (err) {
				console.error('Ping error:', err);
			}
		},

		resetStatus() {
			update((state) => ({
				...state,
				drawModel: { status: 'init' },
				status: null,
				results: []
			}));
		},

		getStrokesAsArray(): number[][][] {
			// @ts-ignore
			const s = get({ subscribe });
			return s.strokes.map((stroke: any) => stroke.map((p: any) => [p.x, p.y]));
		}
	};
}

export const drawingStore = createDrawingStore();
export const challengeStore = createChallangeStore();
export const trainingStore = createTrainingStore();
