import { writable } from 'svelte/store';
import { checkChallengeValid, getChallengePing } from '$lib/services/challenge.service';
import type { ChallengeModel } from '$lib/models/challenge.model';

const availableLetters = [
	'HA',
	'NA',
	'CA',
	'RA',
	'KA',
	'DA',
	'TA',
	'SA',
	'WA',
	'LA',
	'PA',
	'DHA',
	'JA',
	'YA',
	'NYA',
	'MA',
	'GA',
	'BA',
	'THA',
	'NGA'
];

function randomLetter() {
	return availableLetters[Math.floor(Math.random() * availableLetters.length)];
}

export const challenge = writable<{
	strokes: number[][][]; // [stroke][point][x/y]
	activeLetter: string;
	drawModel: {
		status: 'init' | 'loading' | 'success' | 'error';
		data?: ChallengeModel;
		error?: any;
	};
	ping: string;
}>({
	strokes: [],
	activeLetter: randomLetter(),
	drawModel: { status: 'init' },
	ping: ''
});

export const challengeActions = {
	startStroke(point: number[]) {
		challenge.update((s) => {
			s.strokes.push([point]);
			return s;
		});
	},

	drawPoint(point: number[]) {
		challenge.update((s) => {
			s.strokes[s.strokes.length - 1].push(point);
			return s;
		});
	},

	endStroke() {
		challenge.update((s) => {
			return s;
		});
	},

	clearCanvas() {
		challenge.update((s) => {
			s.strokes = [];
			return s;
		});
	},

	setLetter(letter: string) {
		challenge.update((s) => {
			s.activeLetter = letter;
			s.strokes = [];
			return s;
		});
	},

	randomizeLetter() {
		challenge.update((s) => {
			s.activeLetter = randomLetter();
			s.strokes = [];
			return s;
		});
	},

	async checkValidDrawing(canvasBlob: Blob) {
		challenge.update((s) => {
			s.drawModel = { status: 'loading' };
			return s;
		});

		try {
			const result = await checkChallengeValid(get(challenge).activeLetter, canvasBlob);
			challenge.update((s) => {
				s.drawModel = { status: 'success', data: result };
				return s;
			});
		} catch (err) {
			challenge.update((s) => {
				s.drawModel = { status: 'error', error: err };
				return s;
			});
		}
	},

	async getPing() {
		try {
			const ping = await getChallengePing();
			challenge.update((s) => {
				s.ping = ping;
				return s;
			});
			challengeActions.randomizeLetter();
		} catch (e) {
			console.error(e);
		}
	},

	resetStatus() {
		challenge.update((s) => {
			s.drawModel = { status: 'init' };
			return s;
		});
	}
};
