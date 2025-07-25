import { writable } from 'svelte/store';

type ValidationStatus = 'init' | 'loading' | 'success' | 'error';

interface ValidationState<T> {
	status: ValidationStatus;
	data?: T;
	error?: any;
	ping: string;
}

export function createGenericValidationStore<T>(
	checkFn: (...args: any[]) => Promise<T>,
	pingFn: () => Promise<any>,
	options?: {
		validateMatch?: (result: T, ...args: any[]) => boolean;
	}
) {
	const initialState: ValidationState<T> = {
		status: 'init',
		ping: ''
	};

	const { subscribe, update, set } = writable(initialState);

	return {
		subscribe,

		async check(...args: any[]) {
			update((s) => ({ ...s, status: 'loading' }));
			try {
				const result = await checkFn(...args);

				const isValid = options?.validateMatch ? options.validateMatch(result, ...args) : true;

				if (isValid) {
					update((s) => ({ ...s, status: 'success', data: result }));
				} else {
					update((s) => ({
						...s,
						status: 'error',
						error: new Error('Validation failed')
					}));
				}
			} catch (err) {
				update((s) => ({ ...s, status: 'error', error: err }));
			}
		},

		async ping() {
			try {
				const ping = await pingFn();
				update((s) => ({ ...s, ping }));
			} catch (err) {
				console.error('Ping error:', err);
			}
		},

		reset() {
			set(initialState);
		}
	};
}
