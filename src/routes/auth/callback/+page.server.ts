import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// Check if this is a valid OAuth callback
		const code = url.searchParams.get('code');
		const error = url.searchParams.get('error');
		const error_description = url.searchParams.get('error_description');
		
		
		// Return the OAuth parameters to the client
		return {
			code,
			error,
			error_description,
			fullUrl: url.toString()
		};
	} catch (err) {
		
		// Return error info to client
		return {
			error: 'server_error',
			error_description: 'Failed to process callback',
			fullUrl: url.toString()
		};
	}
};