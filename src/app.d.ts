// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
// src/app.d.ts
import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
	interface Window {
		dataLayer: any[];
		gtag: (...args: any[]) => void;
	}
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
	}
}

export {};
