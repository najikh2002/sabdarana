<script lang="ts">
	import { rewardUser } from '$lib/supabase/reward';
	let reward = 0;
	let loading = false;

	async function claimReward() {
		loading = true;
		try {
			reward = await rewardUser(5, 20);
		} catch (err) {
			console.error('Failed to reward:', err);
		}
		loading = false;
	}
</script>

<button on:click={claimReward} class="rounded bg-[#b3f135] px-4 py-2 font-semibold text-black">
	{#if loading}
		Menghitung...
	{:else}
		Claim WDC
	{/if}
</button>

{#if reward > 0}
	<p class="mt-4 text-white">Selamat! Anda mendapatkan <strong>{reward} WDC</strong> 🎉</p>
{/if}
