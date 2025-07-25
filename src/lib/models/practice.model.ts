export interface PracticeModel {
	prediction: string;
}

export function practiceModelFromJson(json: string): PracticeModel {
	const data = JSON.parse(json);
	return {
		prediction: data.prediction ?? ''
	};
}

export function practiceModelToJson(model: PracticeModel): string {
	return JSON.stringify(model);
}
