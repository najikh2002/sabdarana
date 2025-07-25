import { ApiStatus } from './api-status';

export class ApiResponse<T> {
	status: ApiStatus;
	data?: T;
	message?: string;

	constructor(status: ApiStatus, data?: T, message?: string) {
		this.status = status;
		this.data = data;
		this.message = message;
	}

	static init<T>() {
		return new ApiResponse<T>(ApiStatus.INIT);
	}

	static loading<T>() {
		return new ApiResponse<T>(ApiStatus.LOADING);
	}

	static success<T>(data: T) {
		return new ApiResponse<T>(ApiStatus.SUCCESS, data);
	}

	static error<T>(message: string) {
		return new ApiResponse<T>(ApiStatus.ERROR, undefined, message);
	}

	toString(): string {
		return `Status: ${this.status}\nMessage: ${this.message}\nData: ${JSON.stringify(this.data)}`;
	}
}
