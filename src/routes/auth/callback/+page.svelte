<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/supabase/authStore';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	// svelte-ignore non_reactive_update
	let errorMessage = '';
	let isProcessing = $state(true);

	onMount(() => {
		// Set up auth state listener
		const unsubscribe = user.subscribe((currentUser) => {
			if (currentUser) {
				goto('/auth/sync');
			} else if (!isProcessing) {
				errorMessage = 'Login gagal. Silakan coba lagi.';
				setTimeout(() => goto('/auth/login'), 3000);
			}
		});

		// Check for immediate error
		if (data.error) {
			errorMessage = data.error_description || data.error;
			isProcessing = false;
			setTimeout(() => goto('/auth/login'), 3000);
			return;
		}

		// If no code, redirect to login
		if (!data.code) {
			goto('/auth/login');
			return;
		}

		// Wait for Supabase to process the OAuth callback automatically
		setTimeout(() => {
			isProcessing = false;
			// If still no user after timeout, show error
			if (!$user) {
				errorMessage = 'OAuth login timeout. Silakan coba lagi.';
				setTimeout(() => goto('/auth/login'), 3000);
			}
		}, 5000);

		// Cleanup
		return () => {
			unsubscribe();
		};
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="max-w-md text-center">
		{#if errorMessage}
			<div class="mb-4 rounded-lg bg-red-50 p-6">
				<div class="mb-2 flex items-center">
					<svg class="mr-2 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						></path>
					</svg>
					<p class="font-medium text-red-800">Login Error</p>
				</div>
				<p class="text-sm text-red-600">{errorMessage}</p>
				<p class="mt-4 text-sm text-gray-500">Redirecting to login page...</p>
			</div>
		{:else}
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
			></div>
			<p class="font-medium text-gray-600">Memproses login...</p>
			<p class="mt-2 text-sm text-gray-500">Mohon tunggu sebentar</p>
		{/if}
	</div>
</div>
