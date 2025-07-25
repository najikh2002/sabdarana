<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let countdown = $state(5);
	let intervalId: ReturnType<typeof setInterval>;

	onMount(() => {
		// Start countdown
		intervalId = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(intervalId);
				goto('/');
			}
		}, 1000);

		// Cleanup on component destroy
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<svelte:head>
	<title>404 - Halaman Tidak Ditemukan | Arutala Aksara</title>
	<meta
		name="description"
		content="Halaman yang Anda cari tidak ditemukan. Anda akan diarahkan ke halaman utama."
	/>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-16">
	<div class="w-full max-w-lg text-center">
		<!-- Error Code -->
		<h1 class="mb-4 text-8xl font-bold text-[#b3f135]">404</h1>

		<!-- Error Message -->
		<h2 class="mb-6 text-3xl font-semibold text-white">Page Not Found!</h2>

		<!-- Countdown -->
		<div class="mb-8">
			<div
				class="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#b3f135] bg-sky-500/20"
			>
				<span class="text-3xl font-bold text-[#b3f135]">{countdown}</span>
			</div>
			<p class="mt-4 text-gray-400">
				You redirect automation in {countdown} seconds
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<a
				href="/"
				class="inline-flex items-center justify-center rounded-md border border-transparent bg-[#b3f135] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[#b2f135e7]"
			>
				Back to Homepage
			</a>
			<button
				onclick={() => history.back()}
				class="inline-flex items-center justify-center rounded-md border border-gray-500 px-6 py-3 text-base font-medium text-gray-300 transition-colors hover:bg-gray-800"
			>
				Back
			</button>
		</div>
	</div>
</div>
