import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/utils/auth-guard';

export const load: PageServerLoad = async (event) => {
	const session = await requireAuth(event);
	
	return {
		session
	};
};