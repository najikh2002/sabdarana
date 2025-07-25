// lib/stores/drawStore.ts
import { createGenericValidationStore } from './createGenericValidationStore';
import { checkDrawValid, getDrawPing } from '$lib/services/draw.service';
import type { DrawModel } from '$lib/models/draw.model';

export const drawStore = createGenericValidationStore<DrawModel>(
	checkDrawValid,
	getDrawPing
	// bisa tambahkan validasi jika perlu
);
