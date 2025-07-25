export abstract class BaseApiService {
	baseUrl = 'https://be-arutala.vercel.app';

	abstract getPing(): Promise<string>;
	abstract getResponse(url: string): Promise<any>;
	abstract postResponse(url: string, body: any): Promise<any>;
	abstract postImageResponse(url: string, body: any, image: Blob): Promise<any>;
}
