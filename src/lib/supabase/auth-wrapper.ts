import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from './auth';
import type { AuthResponse } from './auth';

// Wrapper functions with CORS error handling
export async function signUpWithEmailSafe(email: string, password: string, username: string): Promise<AuthResponse> {
	try {
		return await signUpWithEmail(email, password, username);
	} catch (error) {
		console.error('SignUp error (possibly CORS):', error);
		
		// Check if it's a CORS error
		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			return {
				success: false,
				error: 'Network error. Jika menggunakan Arc browser, coba gunakan Chrome/Brave atau disable shield untuk domain ini.'
			};
		}
		
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function signInWithEmailSafe(email: string, password: string): Promise<AuthResponse> {
	try {
		return await signInWithEmail(email, password);
	} catch (error) {
		console.error('SignIn error (possibly CORS):', error);
		
		// Check if it's a CORS error
		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			return {
				success: false,
				error: 'Network error. Jika menggunakan Arc browser, coba gunakan Chrome/Brave atau disable shield untuk domain ini.'
			};
		}
		
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export async function signInWithGoogleSafe(): Promise<AuthResponse> {
	try {
		return await signInWithGoogle();
	} catch (error) {
		console.error('Google SignIn error (possibly CORS):', error);
		
		// Check if it's a CORS error
		if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
			return {
				success: false,
				error: 'Network error. Jika menggunakan Arc browser, coba gunakan Chrome/Brave atau disable shield untuk domain ini.'
			};
		}
		
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}