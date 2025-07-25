import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';

export async function requireAuth(event: ServerLoadEvent) {
	const session = await event.locals.getSession();

	if (!session) {
		throw redirect(303, '/auth/login');
	}

	return session;
}
