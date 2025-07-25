<script lang="ts">
	import { user } from '$lib/supabase/authStore';
	import LogoutButton from './LogoutButton.svelte';
	
	$: currentUser = $user;
</script>

{#if currentUser}
	<div class="flex items-center gap-4 rounded-lg bg-white/10 p-4 backdrop-blur">
		<div class="flex-1">
			<p class="text-sm text-white/80">Logged in as:</p>
			<p class="font-medium text-white">{currentUser.email}</p>
		</div>
		<LogoutButton />
	</div>
{/if}