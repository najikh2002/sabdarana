import { writable } from 'svelte/store';

export const dialogVisible = writable(false);
export const dialogMessage = writable('');
export const showDropdown = writable(false);
