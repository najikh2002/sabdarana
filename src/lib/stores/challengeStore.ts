import { createGenericValidationStore } from './createGenericValidationStore';
import { checkChallengeValid, getChallengePing } from '$lib/services/challenge.service';
import type { ChallengeModel } from '$lib/models/challenge.model';

export const challengeStore = createGenericValidationStore<ChallengeModel>(
	checkChallengeValid,
	getChallengePing,
	{
		validateMatch: (result, expectedChar: string) => result.prediction === expectedChar
	}
);
