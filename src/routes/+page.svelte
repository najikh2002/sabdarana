<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem('selectedScript');
			const priorities = ['sundanese', 'javanese'];

			const fallback = 'javanese';
			const matched = priorities.find((p) => p === stored) ?? fallback;

			goto(`/${matched}`, { replaceState: true });
		}
	});
</script>

<!-- Optional fallback UI -->
<p class="text-center text-white">Redirect to Homepage...</p>
