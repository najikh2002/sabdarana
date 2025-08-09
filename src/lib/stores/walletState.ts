import { writable } from 'svelte/store';

const loading = writable(false);
const loadingStep = writable('');
const reward = writable<bigint>(0n);
const balance = writable<bigint>(0n);
const currentAddress = writable('');
const warnedOnce = writable(false);
const initialized = writable(false);
const connectionChecked = writable(false);
const contractExists = writable(false);
const networkError = writable('');
const retryCount = writable(0);
const unsubscribeAccount = writable<(() => void) | null>(null);

// src/lib/stores/walletState.ts
export const walletState = {
	loading,
	loadingStep,
	reward,
	balance,
	currentAddress,
	warnedOnce,
	initialized,
	connectionChecked,
	contractExists,
	networkError,
	retryCount,
	unsubscribeAccount
};
