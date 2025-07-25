// src/lib/stores/scriptStore.ts
import { writable } from 'svelte/store';

// Ambil dari localStorage saat awal
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedScript') : null;

const initial = stored ?? 'javanese'; // default

export const scriptStore = writable<string>(initial);

// Simpan setiap kali berubah
scriptStore.subscribe((value) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('selectedScript', value);
	}
});
