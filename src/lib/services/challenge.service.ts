import { NetworkApiService } from '$lib/network/network-api-service';
import { ApiEndpoints } from '$lib/network/api-endpoints';
import type { ChallengeModel } from '$lib/models/challenge.model';

const api = new NetworkApiService();

export async function checkChallengeValid(
	challengeLetter: string,
	canvasBlob: Blob,
	url: any
): Promise<ChallengeModel> {
	const formData = new FormData();
	const file = new File([canvasBlob], 'image.png', { type: 'image/png' });

	formData.append('letter', challengeLetter); // harus sesuai Form(...) di backend
	formData.append('file', file); // harus UploadFile = File(...)

	const response = await api.postImageResponse(url, { letter: challengeLetter }, canvasBlob);

	return response as ChallengeModel;
}

export async function getChallengePing(): Promise<any> {
	return await api.getPing();
}
