// src/lib/utils/mediaStore.ts
import { writable } from 'svelte/store';

function createScreenSizeStore() {
	const { subscribe, set } = writable(getSize());

	function getSize() {
		if (typeof window === 'undefined') return { width: 0, height: 0 };
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	}

	const update = () => set(getSize());

	if (typeof window !== 'undefined') {
		window.addEventListener('resize', update);
	}

	return {
		subscribe
	};
}

export const screenSize = createScreenSizeStore();
