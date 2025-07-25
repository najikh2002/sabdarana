import { supabase } from './client';
import type { Provider } from '@supabase/supabase-js';
import { PUBLIC_BASE_URL } from '$env/static/public';

export interface AuthResponse {
	success: boolean;
	error?: string;
	user?: any;
}

// Helper function to get the redirect URL
function getRedirectUrl(path: string = '/auth/callback'): string {
	// Use PUBLIC_BASE_URL if set, otherwise fall back to window.location.origin
	if (typeof window !== 'undefined') {
		return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}${path}` : `${window.location.origin}${path}`;
	}
	return `${PUBLIC_BASE_URL || 'http://localhost:5173'}${path}`;
}

// Manual registration
export async function signUpWithEmail(email: string, password: string, username: string): Promise<AuthResponse> {
	try {
		
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username: username,
					display_name: username
				},
				emailRedirectTo: getRedirectUrl('/auth/callback')
			}
		});

		if (error) {
				
			// Provide more specific error messages
			if (error.message.includes('already registered')) {
				return { success: false, error: 'Email sudah terdaftar. Silakan login.' };
			}
			if (error.message.includes('valid email')) {
				return { success: false, error: 'Format email tidak valid' };
			}
			if (error.message.includes('password')) {
				return { success: false, error: 'Password tidak memenuhi syarat (minimal 6 karakter)' };
			}
			
			return { success: false, error: error.message };
		}

		return { success: true, user: data.user };
	} catch (error) {
		return { success: false, error: 'Terjadi kesalahan saat mendaftar' };
	}
}

// Manual login
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
	try {
		
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
				
			// Provide more specific error messages
			if (error.message.includes('Invalid login credentials')) {
				return { success: false, error: 'Email atau password salah' };
			}
			if (error.message.includes('Email not confirmed')) {
				return { success: false, error: 'Email belum diverifikasi. Silakan cek inbox Anda.' };
			}
			if (error.message.includes('User not found')) {
				return { success: false, error: 'User tidak ditemukan. Silakan daftar terlebih dahulu.' };
			}
			
			return { success: false, error: error.message };
		}

		return { success: true, user: data.user };
	} catch (error) {
		return { success: false, error: 'Terjadi kesalahan saat masuk' };
	}
}

// Google OAuth login
export async function signInWithGoogle(): Promise<AuthResponse> {
	try {
		
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: getRedirectUrl('/auth/callback'),
				queryParams: {
					access_type: 'offline',
					prompt: 'consent',
				}
			}
		});

		if (error) {
				return { success: false, error: error.message };
		}

		// OAuth redirect will happen automatically
		return { success: true };
	} catch (error) {
		return { success: false, error: 'Terjadi kesalahan saat masuk dengan Google' };
	}
}

// Logout
export async function signOut(): Promise<void> {
	try {
		await supabase.auth.signOut();
	} catch (error) {
	}
}

// Get current user
export async function getCurrentUser() {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResponse> {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: getRedirectUrl('/auth/reset-password')
		});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		return { success: false, error: 'Terjadi kesalahan saat reset password' };
	}
}

// Update password
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
	try {
		const { error } = await supabase.auth.updateUser({
			password: newPassword
		});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		return { success: false, error: 'Terjadi kesalahan saat update password' };
	}
}