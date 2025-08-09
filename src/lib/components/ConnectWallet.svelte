<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get, derived } from 'svelte/store';
	import {
		web3Modal,
		connected,
		defaultConfig,
		init,
		wagmiConfig,
		chainId,
		disconnectWagmi
	} from 'svelte-wagmi';

	import { injected } from '@wagmi/connectors';
	import { defineChain, parseUnits, isAddress } from 'viem';
	import {
		writeContract,
		waitForTransactionReceipt,
		readContract,
		getAccount,
		getWalletClient,
		watchAccount,
		getPublicClient
	} from '@wagmi/core';
	import { walletState } from '$lib/stores/walletState';
	import { rpc } from '$lib/constants/rpc';

	const {
		loading,
		loadingStep,
		balance,
		reward,
		currentAddress,
		warnedOnce,
		initialized,
		connectionChecked,
		contractExists,
		networkError,
		retryCount,
		unsubscribeAccount
	} = walletState;

	import { abi as WDC_ABI } from '$lib/constants/abi';

	const CONTRACT_ADDRESS = '0x663F3ad617193148711d28f5334eE4Ed07016602';
	const MAX_RETRY = 3;

	const hardhat = defineChain({
		id: 31337,
		name: 'Sabdarana',
		network: 'localhost',
		nativeCurrency: {
			decimals: 18,
			name: 'Etherium',
			symbol: 'ETH'
		},
		rpcUrls: {
			default: { http: [rpc] },
			public: { http: [rpc] }
		},
		testnet: true
	});

	// Derived store untuk status koneksi yang reliable
	const isConnectedAndReady = derived([connected, wagmiConfig], ([$connected, $wagmiConfig]) => {
		return $connected && $wagmiConfig && initialized && $connectionChecked;
	});

	onMount(async () => {
		console.log('🚀 Component mounted, starting initialization...');
		await initializeWeb3();
		retryConnection();
	});

	onDestroy(() => {
		if ($unsubscribeAccount) {
			console.log('🧹 Cleaning up account watcher');
			$unsubscribeAccount();
		}
	});

	async function initializeWeb3() {
		try {
			console.log('⚙️ Configuring Web3Modal...');

			// Configure Web3Modal dengan storage persistence
			defaultConfig({
				appName: 'Sabdarana',
				connectors: [
					injected({
						chains: [hardhat],
						// Tambahkan shimDisconnect untuk persistence yang lebih baik
						shimDisconnect: false
					})
				],
				chains: [hardhat],
				autoConnect: true,
				walletConnectProjectId: 'aee031fb671149534998b02bf449f1e4',
				// Tambahkan storage config untuk persistence
				storage: {
					key: 'sabdarana-wagmi',
					serialize: JSON.stringify,
					deserialize: JSON.parse
				}
			});

			console.log('🔧 Initializing wagmi...');
			await init();

			// Wait extra time untuk storage hydration
			await new Promise((resolve) => setTimeout(resolve, 500));
			$initialized = true;

			// Wait untuk wagmi fully loaded dengan lebih lama
			await waitForWagmiReady();

			// Wait untuk storage hydration selesai
			await waitForStorageHydration();

			// Check contract exists
			await checkContractExists();

			// Setup account watcher only if contract exists
			if ($contractExists) {
				setupAccountWatcher();
				await checkConnectionWithRetry();
			}
		} catch (error) {
			console.error('❌ Initialization failed:', error);
			$networkError = `Initialization failed: ${error.message}`;

			// Retry initialization
			if ($retryCount < MAX_RETRY) {
				$retryCount++;
				console.log(`🔄 Retrying initialization (${retryCount}/${MAX_RETRY})...`);
				setTimeout(() => initializeWeb3(), 2000 * $retryCount);
			}
		}
	}

	async function waitForWagmiReady() {
		const maxWait = 10000; // Increase to 10 seconds
		const checkInterval = 200; // Check every 200ms
		let waited = 0;

		return new Promise<void>((resolve) => {
			const checkReady = () => {
				const config = get(wagmiConfig);
				if (config) {
					console.log('✅ Wagmi config ready');
					resolve();
					return;
				}

				waited += checkInterval;
				if (waited >= maxWait) {
					console.log('⏰ Wagmi config timeout, proceeding anyway');
					resolve();
					return;
				}

				setTimeout(checkReady, checkInterval);
			};

			checkReady();
		});
	}

	async function waitForStorageHydration() {
		// Wait untuk localStorage dan sessionStorage di-hydrate
		const maxWait = 3000;
		const checkInterval = 100;
		let waited = 0;

		return new Promise<void>((resolve) => {
			const checkHydration = () => {
				try {
					// Check if storage is accessible
					const config = get(wagmiConfig);
					if (config) {
						const account = getAccount(config);
						// Jika ada stored connection, tunggu sedikit lagi
						if (account?.status === 'connecting') {
							console.log('🔄 Still hydrating connection...');
							waited += checkInterval;
							if (waited < maxWait) {
								setTimeout(checkHydration, checkInterval);
								return;
							}
						}
					}
				} catch (error) {
					console.log('⚠️ Storage hydration check failed:', error);
				}

				console.log('✅ Storage hydration completed or timed out');
				resolve();
			};

			setTimeout(checkHydration, checkInterval);
		});
	}

	async function checkContractExists() {
		try {
			console.log('🔍 Checking contract existence...');
			const config = get(wagmiConfig);

			if (!config) {
				throw new Error('Wagmi config not available');
			}

			// Validate contract address
			if (!isAddress(CONTRACT_ADDRESS)) {
				throw new Error('Invalid contract address');
			}

			// Get public client to check if address is a contract
			const publicClient = getPublicClient(config);
			if (!publicClient) {
				throw new Error('Public client not available');
			}

			// Check if there's code at the contract address
			const code = await publicClient.getCode({ address: CONTRACT_ADDRESS });

			if (!code || code === '0x') {
				throw new Error('No contract found at specified address');
			}

			// Try to read a simple contract property to verify it's working
			try {
				await readContract(config, {
					address: CONTRACT_ADDRESS,
					abi: WDC_ABI,
					functionName: 'name' // Assuming ERC20 has name function
				});

				$contractExists = true;
				$networkError = '';
				console.log('✅ Contract verified and accessible');
			} catch (readError) {
				console.warn('⚠️ Contract exists but may not be the expected type:', readError);
				// Still set contractExists to true, let individual calls handle their errors
				$contractExists = true;
			}
		} catch (error) {
			console.error('❌ Contract check failed:', error);
			$contractExists = false;
			$networkError = `Contract not accessible: ${error.message}`;
		}
	}

	function setupAccountWatcher() {
		const config = get(wagmiConfig);
		if (!config) {
			console.error('❌ Cannot setup account watcher: wagmi config not available');
			return;
		}

		console.log('👀 Setting up account watcher...');
		$unsubscribeAccount = watchAccount(config, {
			onChange: async (account) => {
				console.log('🔄 Account state changed:', {
					address: account?.address,
					isConnected: account?.isConnected,
					status: account?.status
				});

				if (account?.isConnected && account?.address) {
					$currentAddress = account.address;
					console.log('✅ Wallet connected:', $currentAddress);

					if ($contractExists) {
						await loadBalanceWithRetry();
					}
				} else {
					console.log('🔌 Wallet disconnected, resetting state');
					resetWalletState();
				}
			}
		});
	}

	async function checkConnectionWithRetry() {
		// Tambahkan initial delay untuk memastikan storage sudah ready
		await new Promise((resolve) => setTimeout(resolve, 1000));

		for (let i = 0; i < MAX_RETRY; i++) {
			try {
				console.log(`🔍 Checking connection attempt ${i + 1}/${MAX_RETRY}...`);

				const config = get(wagmiConfig);
				if (!config) {
					throw new Error('Wagmi config not available');
				}

				const account = getAccount(config);
				console.log('📊 Current account state:', {
					address: account?.address,
					isConnected: account?.isConnected,
					status: account?.status
				});

				// Check for any connection status, not just 'connected'
				if (account?.address && (account?.isConnected || account?.status === 'connected')) {
					$currentAddress = account.address;
					console.log('✅ Found existing connection:', $currentAddress);

					if ($contractExists) {
						await loadBalanceWithRetry();
					}
					break;
				} else if (account?.status === 'connecting') {
					console.log('🔄 Connection in progress, waiting...');
					// Wait longer for connecting status
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue;
				} else {
					console.log(`❌ No connection found on attempt ${i + 1}`);
				}

				// Wait before retry dengan exponential backoff
				if (i < MAX_RETRY - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
				}
			} catch (error) {
				console.error(`❌ Connection check ${i + 1} failed:`, error);
				if (i < MAX_RETRY - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}

		$connectionChecked = true;
		console.log('🏁 Connection check completed');
	}

	async function loadBalanceWithRetry() {
		if (!$contractExists) {
			console.log('⚠️ Skipping balance load: contract not accessible');
			return;
		}

		for (let i = 0; i < MAX_RETRY; i++) {
			try {
				await cekBalance();
				break;
			} catch (error) {
				console.error(`❌ Balance load attempt ${i + 1} failed:`, error);
				if (i === MAX_RETRY - 1) {
					// Last attempt failed, show user-friendly message
					$balance = 0n;
					$networkError = 'Unable to load balance. Contract may be unavailable.';
				} else {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}
	}

	function resetWalletState() {
		$currentAddress = '';
		$balance = 0n;
		$reward = 0n;
		$warnedOnce = false;
		$networkError = '';
	}

	export async function claimReward(rewardItem: any) {
		if ($loading || !$contractExists) return;

		$loading = true;
		$loadingStep = 'Preparing transaction...';
		let hash = null;

		try {
			const config = get(wagmiConfig);
			if (!config) {
				throw new Error('Wagmi config not available');
			}

			const account = getAccount(config);
			if (!account?.isConnected || !account?.address) {
				throw new Error('Wallet not connected');
			}

			// Check network first
			if ($chainId !== 31337) {
				throw new Error('Wrong network. Please switch to Sabdarana (Chain ID: 31337)');
			}

			const rewardAmount = parseUnits(`${rewardItem}`, 18);
			console.log('⛏️ Minting to:', account.address);
			$loadingStep = 'Sending transaction...';

			// Try different approaches for writeContract
			try {
				const txResult = await writeContract(config, {
					address: CONTRACT_ADDRESS,
					abi: WDC_ABI,
					functionName: 'mint',
					args: [account.address, rewardAmount],
					account: account.address
				});

				console.log('📦 TX Result:', txResult);

				// Handle different return formats
				hash = txResult?.hash || txResult;

				if (!hash) {
					throw new Error('No transaction hash returned');
				}

				console.log('📦 TX Hash:', hash);
			} catch (writeError) {
				console.error('❌ WriteContract error:', writeError);

				// Try alternative approach with walletClient
				const walletClient = await getWalletClient(config);
				if (!walletClient) {
					throw new Error('Wallet client not available');
				}

				console.log('🔄 Trying with wallet client...');
				hash = await walletClient.writeContract({
					address: CONTRACT_ADDRESS,
					abi: WDC_ABI,
					functionName: 'mint',
					args: [account.address, rewardAmount]
				});

				console.log('📦 TX Hash (wallet client):', hash);
			}

			if (hash) {
				const receipt = await waitForTransactionReceipt(config, { hash });
				console.log('✅ Transaction confirmed:', receipt);

				$reward = rewardAmount;
				await loadBalanceWithRetry();
				alert(`✅ Berhasil claim! TX: ${hash}`);
				$networkError = ''; // Clear any previous errors
			} else {
				throw new Error('Failed to get transaction hash');
			}
		} catch (err: any) {
			console.error('❌ Claim failed:', err);
			console.error('❌ Error details:', {
				message: err?.message,
				shortMessage: err?.shortMessage,
				cause: err?.cause,
				details: err?.details,
				stack: err?.stack?.split('\n').slice(0, 3) // First 3 lines of stack
			});

			let errorMessage = 'Unknown error';

			if (err.message?.includes('User rejected') || err.message?.includes('user rejected')) {
				errorMessage = 'Transaction rejected by user';
			} else if (err.message?.includes('insufficient funds')) {
				errorMessage = 'Insufficient funds for gas';
			} else if (err.message?.includes('Wrong network')) {
				errorMessage = err.message;
			} else if (err.message?.includes('revert')) {
				errorMessage = 'Transaction reverted. You might not be the contract owner.';
			} else if (err.message?.includes('No transaction hash')) {
				errorMessage = 'Transaction failed to submit. Please try again.';
			} else {
				errorMessage = err.shortMessage || err.message || 'Transaction failed';
			}

			alert(`❌ Gagal claim: ${errorMessage}`);
		} finally {
			$loading = false;
		}
	}

	async function cekBalance() {
		const config = get(wagmiConfig);
		if (!config) {
			throw new Error('Wagmi config not available');
		}

		const account = getAccount(config);
		if (!account?.address) {
			throw new Error('No wallet address available');
		}

		console.log('🔍 Checking balance for:', account.address);

		const result = await readContract(config, {
			address: CONTRACT_ADDRESS,
			abi: WDC_ABI,
			functionName: 'balanceOf',
			args: [account.address]
		});

		console.log('💰 Balance result:', result);
		$balance = result as bigint;
		$networkError = ''; // Clear error on success
	}

	async function customDisconnect() {
		try {
			console.log('🔌 Initiating disconnect...');

			resetWalletState();

			const config = get(wagmiConfig);
			if (config) {
				await disconnectWagmi();
			}

			const modal = get(web3Modal);
			if (modal) {
				await modal.disconnect();
			}

			console.log('✅ Disconnect completed');
		} catch (error) {
			console.error('❌ Disconnect error:', error);
		}
	}

	async function connectWallet() {
		try {
			console.log('🔗 Opening wallet connection...');

			if (!$contractExists) {
				alert('⚠️ Contract not accessible. Please check your network connection and RPC URL.');
				return;
			}

			const modal = get(web3Modal);
			if (modal) {
				await modal.open();
			}
		} catch (error) {
			console.error('❌ Connect error:', error);
		}
	}

	function formatBalance(bal: bigint): string {
		if (bal === 0n) return '0';

		const balanceStr = bal.toString();
		if (balanceStr.length <= 18) {
			const decimal = balanceStr.padStart(18, '0').replace(/0+$/, '') || '0';
			return '0.' + decimal;
		} else {
			const integerPart = balanceStr.slice(0, -18);
			const decimalPart = balanceStr.slice(-18).replace(/0+$/, '');
			return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
		}
	}

	function retryConnection() {
		$networkError = '';
		$retryCount = 0;
		// Clear any cached state
		resetWalletState();
		$initialized = false;
		$connectionChecked = false;
		$contractExists = false;
		initializeWeb3();
	}

	// Reactive statement untuk handle network warning
	$: if ($chainId && $chainId !== 31337 && !$warnedOnce && $isConnectedAndReady) {
		console.log('⚠️ Wrong network detected:', $chainId);
		$warnedOnce = true;
	}

	// Debug reactive statement (remove in production)
	$: if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		console.log('🎯 Reactive state:', {
			$connected: $connected,
			$initialized,
			$connectionChecked,
			$contractExists,
			$currentAddress,
			$balance: $balance.toString(),
			$chainId: $chainId,
			$isConnectedAndReady: $isConnectedAndReady,
			$networkError
		});
	}
</script>

<div class="p-8">
	<div class="mx-auto max-w-md space-y-6">
		<!-- Network Error -->
		{#if $networkError}
			<div class="rounded-lg bg-red-600 p-4 text-center">
				<p class="font-semibold text-white">🚨 Network Error</p>
				<p class="mt-2 text-sm text-red-100">{$networkError}</p>
				<button
					class="mt-3 rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-400"
					on:click={retryConnection}
				>
					🔄 Retry Connection
				</button>
			</div>
		{/if}

		<!-- Loading state saat initialization -->
		{#if !$initialized || !$connectionChecked}
			<div class="text-center">
				<div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
				<p class="mt-4 text-white">
					{#if !$initialized}
						🔄 Initializing Web3Modal...
					{:else if !$contractExists}
						🔍 Checking contract...
					{:else}
						🔍 Checking wallet connection...
					{/if}
				</p>
				<p class="mt-2 text-sm text-gray-400">
					Retry: {$retryCount}/{MAX_RETRY}
				</p>
			</div>

			<!-- Connected state -->
		{:else if ($isConnectedAndReady && $currentAddress) || ($connected && $currentAddress && $contractExists)}
			<div class="space-y-4 rounded-lg p-6">
				<div class="text-center">
					<p class="mb-2 text-sm text-gray-300">Connected Address:</p>
					<p class="rounded bg-gray-700 p-2 font-mono text-xs break-all text-green-300">
						{$currentAddress}
					</p>
				</div>

				<div class="space-y-3 text-center">
					<!-- <button
						class="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={claimReward}
						disabled={$loading || !$contractExists}
					>
						{$loading
							? '⏳ Claiming...'
							: $contractExists
								? '🎁 Claim 10 WDC'
								: '❌ Contract Unavailable'}
					</button> -->

					{#if $reward > 0n}
						<p class="text-sm text-green-400">Claimed {formatBalance($reward)} WDC</p>
					{/if}
				</div>

				<div class="rounded bg-gray-700 p-4 text-center">
					<p class="text-white">
						Balance:
						<span class="font-bold text-yellow-300">
							{$contractExists ? formatBalance($balance) : 'N/A'} WDC
						</span>
					</p>
					{#if !$contractExists}
						<p class="mt-1 text-xs text-red-300">Contract not accessible</p>
					{/if}
				</div>

				<button
					class="w-full rounded bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
					on:click={customDisconnect}
				>
					Disconnect Wallet
				</button>
			</div>

			<!-- Disconnected state -->
		{:else}
			<div class="space-y-4 text-center">
				<button
					class="rounded-lg bg-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-blue-600 disabled:opacity-50"
					on:click={connectWallet}
					disabled={!$contractExists}
				>
					Connect Wallet
				</button>
				<p class="text-sm text-gray-400">
					{$contractExists
						? 'Connect your wallet to interact with Sabdarana'
						: 'Contract not accessible. Check network connection.'}
				</p>
			</div>
		{/if}

		<!-- Network warning -->
		{#if $chainId && $chainId !== 31337 && $isConnectedAndReady}
			<div class="rounded-lg bg-yellow-600 p-4 text-center">
				<p class="font-semibold text-white">⚠️ Wrong Network</p>
				<p class="text-sm text-yellow-100">
					Current: {$chainId} | Required: 31337 (Sabdarana)
				</p>
				<p class="mt-1 text-xs text-yellow-100">Please switch network in your wallet</p>
			</div>
		{/if}

		<!-- Contract info -->
		{#if $contractExists}
			<div class="text-center text-xs text-gray-500">
				<p>Contract: {CONTRACT_ADDRESS}</p>
				<p>Network: Sabdarana (Chain ID: 31337)</p>
			</div>
		{/if}
	</div>
</div>
