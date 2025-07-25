<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/supabase/auth';
	
	let loading = $state(false);
	
	async function handleLogout() {
		loading = true;
		await signOut();
		goto('/auth/login');
	}
</script>

<button
	onclick={handleLogout}
	disabled={loading}
	class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
>
	{loading ? 'Logging out...' : 'Logout'}
</button>