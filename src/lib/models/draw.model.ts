export interface DrawModel {
	status: boolean;
}

export function drawModelFromJson(json: string): DrawModel {
	return JSON.parse(json);
}

export function drawModelToJson(model: DrawModel): string {
	return JSON.stringify(model);
}
