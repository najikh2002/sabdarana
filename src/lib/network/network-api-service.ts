import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { BaseApiService } from './base-api-service';
import {
	BadRequestException,
	FetchDataException,
	NotFoundException,
	UnauthorisedException
} from './app-exception';

export class NetworkApiService extends BaseApiService {
	private dio: AxiosInstance;

	constructor() {
		super();
		this.dio = axios.create({
			baseURL: this.baseUrl,
			headers: { 'Content-Type': 'application/json' },
			validateStatus: (status: any) => status != null && status < 500
		});
	}

	async getPing(): Promise<string> {
		try {
			const response = await this.dio.get('/ping');
			return response.data.toString();
		} catch (e) {
			throw this.handleError(e);
		}
	}

	async getResponse(url: string): Promise<any> {
		try {
			const response = await this.dio.get(url);
			return response.data;
		} catch (e) {
			throw this.handleError(e);
		}
	}

	async postResponse(url: string, body: any): Promise<any> {
		try {
			const response = await this.dio.post(url, body);
			return response.data;
		} catch (e) {
			throw this.handleError(e);
		}
	}

	async postImageResponse(url: string, body: Record<string, any>, image: Blob): Promise<any> {
		try {
			const formData = new FormData();

			// Tambahkan field tambahan kalau memang dibutuhkan
			for (const key in body) {
				formData.append(key, String(body[key]));
			}

			const file = new File([image], 'image.jpeg', { type: 'image/jpeg' });
			formData.append('file', file);

			const response = await fetch(this.baseUrl + url, {
				method: 'POST',
				body: formData,
				headers: {}
			});

			const data = await response.json();
			return data;
		} catch (e: any) {
			console.error('POST error:', e.message);
			throw e;
		}
	}

	private handleError(error: any): Error {
		const e = error as AxiosError;

		if (e.response) {
			const status = e.response.status;
			const message = JSON.stringify(e.response.data ?? {});

			switch (status) {
				case 400:
					return new BadRequestException(message);
				case 401:
				case 403:
					return new UnauthorisedException(message);
				case 404:
					return new NotFoundException(message);
				case 500:
				default:
					return new FetchDataException(`Server error ${status}`);
			}
		} else if (e.request) {
			return new FetchDataException('No Internet connection');
		} else {
			return new FetchDataException(e.message || 'Unknown error occurred');
		}
	}
}
