export interface ChallengeModel {
	status: boolean;
	prediction: string;
}

export function challengeModelFromJson(json: string): ChallengeModel {
	const data = JSON.parse(json);
	return {
		status: data.status,
		prediction: data.prediction ?? ''
	};
}

export function challengeModelToJson(model: ChallengeModel): string {
	return JSON.stringify(model);
}
