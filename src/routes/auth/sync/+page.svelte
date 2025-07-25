<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase/client';

	onMount(async () => {
		// Get the current session from Supabase client
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (session) {
			// Force a page reload to sync cookies
			window.location.href = '/javanese';
		} else {
			// No session, redirect to login
			goto('/auth/login');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="text-center">
		<div
			class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[#b3f135]"
		></div>
		<p class="font-medium text-gray-600">Sync...</p>
	</div>
</div>
