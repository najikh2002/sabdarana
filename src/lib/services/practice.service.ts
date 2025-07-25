import { NetworkApiService } from '$lib/network/network-api-service';
import { ApiEndpoints } from '$lib/network/api-endpoints';
import { BaseApiService } from '$lib/network/base-api-service';
import type { PracticeModel } from '$lib/models/practice.model';

const api = new NetworkApiService();

export async function checkPracticeValid(canvas: Blob, url: any): Promise<PracticeModel> {
	// const uint8Array = new Uint8Array(await canvas.arrayBuffer());
	const response = await api.postImageResponse(url, {}, canvas);

	return response as PracticeModel;
}

export async function getPracticePing(): Promise<any> {
	return await api.getPing();
}
