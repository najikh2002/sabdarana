<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/supabase/authStore';
	import { signOut } from '$lib/supabase/auth';
	import { supabase } from '$lib/supabase/client';
	import { signerAddress, connected } from 'svelte-wagmi';
	import ConnectWallet from '$lib/components/ConnectWallet.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	onMount(async () => {
		const { data, error } = await supabase.rpc('get_user_wdc_info', {
			p_wallet: $signerAddress
		});
		console.log(data);
	});

	// Local state
	let currentUser = $state<any>(null);
	let wdcBalance = $state<number>(0);
	let miningHistory = $state<{ id: string; mined_at: string; tx_hash: string }[]>([]);

	// Sync auth user
	$effect(() => {
		currentUser = $user;
	});

	// Fetch WDC balance & mining history when wallet is connected
	$effect(() => {
		if ($signerAddress) {
			const fetchWdc = async () => {
				const { data, error } = await supabase.rpc('get_user_wdc_info', {
					p_wallet: $signerAddress
				});

				if (error) {
					console.error('[WDC Fetch Error]', error);
					return;
				}

				if (data && data.length > 0) {
					wdcBalance = data[0].balance;
					miningHistory = data.map((row: any) => ({
						id: row.mining_id,
						mined_at: row.mined_at,
						tx_hash: row.tx_hash
					}));
				}
			};

			fetchWdc();
		}
	});

	async function handleLogout() {
		await signOut();
		goto('/auth/login');
	}
</script>

<svelte:head>
	<title>Profile</title>
	<meta name="description" content="Kelola profil dan pengaturan akun Anda di Arutala Aksara" />
</svelte:head>

<div class="min-h-screen py-12">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
		<div class="rounded-lg bg-white/10 shadow backdrop-blur-md">
			<div class="px-4 py-5 sm:p-6">
				<h1 class="mb-6 text-2xl font-bold text-white">My Profile</h1>

				{#if currentUser}
					<div class="space-y-6">
						<!-- Profile Picture -->
						<div class="flex items-center space-x-6">
							{#if currentUser.user_metadata?.avatar_url}
								<img
									src={currentUser.user_metadata.avatar_url}
									alt="Profile"
									class="h-24 w-24 rounded-full"
								/>
							{:else}
								<div
									class="flex h-24 w-24 items-center justify-center rounded-full bg-sky-500 text-3xl font-semibold text-white"
								>
									{currentUser.email?.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<h2 class="text-xl font-medium text-white">
									{currentUser.user_metadata?.display_name ||
										currentUser.user_metadata?.full_name ||
										'User'}
								</h2>
								<p class="text-gray-300">{currentUser.email}</p>
							</div>
						</div>

						<!-- Web3 -->
						<!-- Web3 Info -->
						<div class="border-t border-gray-600 pt-6">
							<h2 class="mb-4 text-lg font-semibold text-white">Web3 Wallet</h2>
							{#if $connected}
								<p class="text-sm text-gray-400">Wallet Address</p>
								<p class="font-mono text-sm break-all text-[#b3f135]">{$signerAddress}</p>
								<p class="mt-2 text-sm text-gray-400">WDC Balance</p>
								<p class="text-lg font-bold text-white">{wdcBalance} WDC</p>
								<div class="mt-4">
									<ConnectWallet />
								</div>
							{:else}
								<ConnectWallet />
							{/if}
						</div>

						<!-- User Info -->
						<div class="border-t border-gray-600 pt-6">
							<dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
								<div>
									<dt class="text-sm font-medium text-gray-400">Email</dt>
									<dd class="mt-1 text-sm text-white">{currentUser.email}</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-400">Username</dt>
									<dd class="mt-1 text-sm text-white">
										{currentUser.user_metadata?.username ||
											currentUser.user_metadata?.display_name ||
											'-'}
									</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-400">Provider</dt>
									<dd class="mt-1 text-sm text-white capitalize">
										{currentUser.app_metadata?.provider || 'Email'}
									</dd>
								</div>
								<div>
									<dt class="text-sm font-medium text-gray-400">Join</dt>
									<dd class="mt-1 text-sm text-white">
										{new Date(currentUser.created_at).toLocaleDateString('id-ID', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</dd>
								</div>
							</dl>
						</div>

						<!-- Actions -->
						<div class="flex justify-between border-t border-gray-600 pt-6">
							<button
								type="button"
								onclick={() => goto('/javanese')}
								class="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
							>
								Back to Dashboard
							</button>
							<button
								type="button"
								onclick={handleLogout}
								class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
							>
								Logout
							</button>
						</div>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="mb-4 text-gray-300">Not Authorized</p>
						<a
							href="/auth/login"
							class="inline-flex items-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
						>
							Login
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<div
	class="mx-auto mt-10 rounded-xl bg-white/10 p-6 shadow-lg ring-1 ring-white/20 backdrop-blur-md md:w-[90%]"
>
	<h2 class="mb-4 text-lg font-semibold text-white">Recent Mining Activity</h2>

	{#if miningHistory.length > 0}
		<ul class="space-y-4 divide-y divide-white/10">
			{#each miningHistory as entry}
				<li class="pt-2">
					<div class="flex flex-col gap-1">
						<div class="text-sm text-white">
							⛏️ Mined at:
							<span class="ml-1 text-gray-300">
								{new Date(entry.mined_at).toLocaleString('id-ID', {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						</div>
						<div class="font-mono text-xs break-all text-green-400">
							Tx Hash: {entry.tx_hash}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-gray-300">No mining activity this month.</p>
	{/if}
</div>
