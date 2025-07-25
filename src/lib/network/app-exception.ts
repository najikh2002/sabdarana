export class AppException extends Error {
	constructor(
		message?: string,
		private prefix?: string
	) {
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype); // untuk extend Error dengan benar
	}

	toString() {
		return `${this.prefix ?? ''}${this.message}`;
	}
}

export class FetchDataException extends AppException {
	constructor(message?: string) {
		super(message, 'Error During Communication: ');
	}
}

export class BadRequestException extends AppException {
	constructor(message?: string) {
		super(message, 'Invalid Request: ');
	}
}

export class UnauthorisedException extends AppException {
	constructor(message?: string) {
		super(message, 'Unauthorised: ');
	}
}

export class InvalidInputException extends AppException {
	constructor(message?: string) {
		super(message, 'Invalid Input: ');
	}
}

export class NotFoundException extends AppException {
	constructor(message?: string) {
		super(message ?? 'Not Found');
	}
}
