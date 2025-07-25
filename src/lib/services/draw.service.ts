import { NetworkApiService } from '$lib/network/network-api-service';
import { ApiEndpoints } from '$lib/network/api-endpoints';
import type { DrawModel } from '$lib/models/draw.model';

const api = new NetworkApiService();

export async function checkDrawValid(
	activeLetter: string,
	canvas: Blob,
	url: string
): Promise<DrawModel> {
	const file = new File([canvas], 'image.png', { type: 'image/png' });

	// @ts-ignore
	const response = await api.postImageResponse(url, { letter: activeLetter }, canvas);
	return response as DrawModel;
}

export async function getDrawPing(): Promise<any> {
	return await api.getPing();
}
