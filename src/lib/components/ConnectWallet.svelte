<script>
	import { web3Modal, signerAddress, connected } from 'svelte-wagmi';
	import { disconnectWagmi } from 'svelte-wagmi';
</script>

{#if $connected}
	<div class="flex flex-col items-center space-y-2">
		<p class="text-white">Connected as:</p>
		<p class="font-mono text-sm break-all text-[#b3f135]">{$signerAddress}</p>
		<button
			class="rounded-xl bg-[#b3f135] px-4 py-2 font-semibold text-black transition hover:opacity-90"
			on:click={disconnectWagmi}
		>
			Disconnect
		</button>
	</div>
{:else if $web3Modal}
	<button
		class="rounded-xl bg-[#b3f135] px-6 py-3 font-semibold text-black transition hover:opacity-90"
		on:click={() => $web3Modal.open()}
	>
		Connect Wallet
	</button>
{:else}
	<p class="text-white">Loading Web3Modal...</p>
{/if}
