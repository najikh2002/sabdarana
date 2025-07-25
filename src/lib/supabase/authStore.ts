import { writable } from 'svelte/store';
import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

// Create user store
export const user = writable<User | null>(null);
export const loading = writable(true);

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
	user.set(session?.user ?? null);
	loading.set(false);
});

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
	user.set(session?.user ?? null);
	loading.set(false);
});