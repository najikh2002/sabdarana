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
	import { defineChain, parseUnits, isAddress, parseEther, formatEther } from 'viem';
	import {
		writeContract,
		waitForTransactionReceipt,
		readContract,
		getAccount,
		getWalletClient,
		watchAccount,
		getPublicClient,
		getBalance,
		sendTransaction
	} from '@wagmi/core';
	import { walletState } from '$lib/stores/walletState';
	import { rpc } from '$lib/constants/rpc';

	// Update RPC configuration untuk globalNode
	const RPC_URL = rpc || 'https://sabdarana-network.arutalaaksara.com';

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
	const FAUCET_AMOUNT = '1'; // 1 ETH per request
	const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	// Faucet private key (dalam production, ini harus di-secure dengan proper key management)
	const FAUCET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

	const hardhat = defineChain({
		id: 31337,
		name: 'Sabdarana',
		network: 'sabdarana',
		nativeCurrency: {
			decimals: 18,
			name: 'Ethereum',
			symbol: 'ETH'
		},
		rpcUrls: {
			default: { http: [RPC_URL] },
			public: { http: [RPC_URL] }
		},
		testnet: false // Set ke false karena ini global network
	});

	// State untuk faucet
	let ethBalance = 0n;
	let lastFaucetClaim = 0;
	let canClaimFaucet = true;
	let faucetLoading = false;
	let faucetError = '';

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

			defaultConfig({
				appName: 'Sabdarana',
				connectors: [
					injected({
						chains: [hardhat],
						shimDisconnect: false
					})
				],
				chains: [hardhat],
				autoConnect: true,
				walletConnectProjectId: 'aee031fb671149534998b02bf449f1e4',
				storage: {
					key: 'sabdarana-global-wagmi',
					serialize: JSON.stringify,
					deserialize: JSON.parse
				}
			});

			console.log('🔧 Initializing wagmi...');
			await init();
			await new Promise((resolve) => setTimeout(resolve, 500));
			$initialized = true;

			await waitForWagmiReady();
			await waitForStorageHydration();
			await checkContractExists();

			if ($contractExists) {
				setupAccountWatcher();
				await checkConnectionWithRetry();
			}
		} catch (error) {
			console.error('❌ Initialization failed:', error);
			$networkError = `Initialization failed: ${error.message}`;

			if ($retryCount < MAX_RETRY) {
				$retryCount++;
				console.log(`🔄 Retrying initialization (${retryCount}/${MAX_RETRY})...`);
				setTimeout(() => initializeWeb3(), 2000 * $retryCount);
			}
		}
	}

	async function waitForWagmiReady() {
		const maxWait = 10000;
		const checkInterval = 200;
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
		const maxWait = 3000;
		const checkInterval = 100;
		let waited = 0;

		return new Promise<void>((resolve) => {
			const checkHydration = () => {
				try {
					const config = get(wagmiConfig);
					if (config) {
						const account = getAccount(config);
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

			if (!isAddress(CONTRACT_ADDRESS)) {
				throw new Error('Invalid contract address');
			}

			const publicClient = getPublicClient(config);
			if (!publicClient) {
				throw new Error('Public client not available');
			}

			const code = await publicClient.getCode({ address: CONTRACT_ADDRESS });

			if (!code || code === '0x') {
				throw new Error('No contract found at specified address');
			}

			try {
				await readContract(config, {
					address: CONTRACT_ADDRESS,
					abi: WDC_ABI,
					functionName: 'name'
				});

				$contractExists = true;
				$networkError = '';
				console.log('✅ Contract verified and accessible');
			} catch (readError) {
				console.warn('⚠️ Contract exists but may not be the expected type:', readError);
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
						await loadEthBalance();
						checkFaucetCooldown();
					}
				} else {
					console.log('🔌 Wallet disconnected, resetting state');
					resetWalletState();
				}
			}
		});
	}

	async function checkConnectionWithRetry() {
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

				if (account?.address && (account?.isConnected || account?.status === 'connected')) {
					$currentAddress = account.address;
					console.log('✅ Found existing connection:', $currentAddress);

					if ($contractExists) {
						await loadBalanceWithRetry();
						await loadEthBalance();
						checkFaucetCooldown();
					}
					break;
				} else if (account?.status === 'connecting') {
					console.log('🔄 Connection in progress, waiting...');
					await new Promise((resolve) => setTimeout(resolve, 2000));
					continue;
				} else {
					console.log(`❌ No connection found on attempt ${i + 1}`);
				}

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
					$balance = 0n;
					$networkError = 'Unable to load balance. Contract may be unavailable.';
				} else {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}
	}

	async function loadEthBalance() {
		try {
			const config = get(wagmiConfig);
			if (!config) {
				throw new Error('Wagmi config not available');
			}

			const account = getAccount(config);
			if (!account?.address) {
				throw new Error('No wallet address available');
			}

			console.log('🔍 Checking ETH balance for:', account.address);

			const balance = await getBalance(config, {
				address: account.address
			});

			console.log('💰 ETH Balance result:', balance);
			ethBalance = balance.value;
		} catch (error) {
			console.error('❌ ETH balance load failed:', error);
		}
	}

	function checkFaucetCooldown() {
		if (typeof window !== 'undefined') {
			const lastClaim = localStorage.getItem(`faucet_${$currentAddress}`);
			if (lastClaim) {
				lastFaucetClaim = parseInt(lastClaim);
				const timePassed = Date.now() - lastFaucetClaim;
				canClaimFaucet = timePassed >= COOLDOWN_TIME;
			} else {
				canClaimFaucet = true;
			}
		}
	}

	function resetWalletState() {
		$currentAddress = '';
		$balance = 0n;
		$reward = 0n;
		$warnedOnce = false;
		$networkError = '';
		ethBalance = 0n;
		lastFaucetClaim = 0;
		canClaimFaucet = true;
		faucetError = '';
	}

	// Faucet ETH function
	export async function claimETH() {
		if (faucetLoading || !$contractExists) return;

		faucetLoading = true;
		faucetError = '';

		try {
			const config = get(wagmiConfig);
			if (!config) {
				throw new Error('Wagmi config not available');
			}

			const account = getAccount(config);
			if (!account?.isConnected || !account?.address) {
				throw new Error('Wallet not connected');
			}

			// Check network
			if ($chainId !== 31337) {
				throw new Error('Wrong network. Please switch to Sabdarana (Chain ID: 31337)');
			}

			// Check cooldown
			if (!canClaimFaucet) {
				const remainingTime = COOLDOWN_TIME - (Date.now() - lastFaucetClaim);
				const hours = Math.ceil(remainingTime / (60 * 60 * 1000));
				throw new Error(`Please wait ${hours} more hours before claiming again`);
			}

			console.log('💧 Claiming ETH from faucet for:', account.address);

			// Menggunakan Hardhat's built-in accounts untuk faucet
			// Dalam environment production, Anda perlu setup proper faucet backend
			const walletClient = await getWalletClient(config);
			if (!walletClient) {
				throw new Error('Wallet client not available');
			}

			// Simulasi faucet dengan transfer dari account hardhat default
			// Dalam production, ini harus diganti dengan proper faucet backend API call
			const response = await fetch('/api/faucet', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					address: account.address,
					amount: FAUCET_AMOUNT
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Faucet request failed');
			}

			const result = await response.json();
			console.log('✅ Faucet transaction:', result);

			// Update state
			if (typeof window !== 'undefined') {
				localStorage.setItem(`faucet_${$currentAddress}`, Date.now().toString());
			}
			lastFaucetClaim = Date.now();
			canClaimFaucet = false;

			// Reload ETH balance
			await loadEthBalance();

			alert(`✅ Successfully claimed ${FAUCET_AMOUNT} ETH! TX: ${result.txHash}`);
		} catch (err: any) {
			console.error('❌ ETH faucet failed:', err);
			faucetError = err.message || 'Failed to claim ETH';
			alert(`❌ Faucet failed: ${faucetError}`);
		} finally {
			faucetLoading = false;
		}
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

			if ($chainId !== 31337) {
				throw new Error('Wrong network. Please switch to Sabdarana (Chain ID: 31337)');
			}

			const rewardAmount = parseUnits(`${rewardItem}`, 18);
			console.log('⛏️ Minting to:', account.address);
			$loadingStep = 'Sending transaction...';

			try {
				const txResult = await writeContract(config, {
					address: CONTRACT_ADDRESS,
					abi: WDC_ABI,
					functionName: 'mint',
					args: [account.address, rewardAmount],
					account: account.address
				});

				hash = txResult?.hash || txResult;

				if (!hash) {
					throw new Error('No transaction hash returned');
				}

				console.log('📦 TX Hash:', hash);
			} catch (writeError) {
				console.error('❌ WriteContract error:', writeError);

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
				$networkError = '';
			} else {
				throw new Error('Failed to get transaction hash');
			}
		} catch (err: any) {
			console.error('❌ Claim failed:', err);

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
		$networkError = '';
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
				alert(
					'⚠️ Contract not accessible on Sabdarana Global Network. Please check your connection.'
				);
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

	function formatEthBalance(bal: bigint): string {
		return formatEther(bal);
	}

	function getCooldownRemaining(): string {
		if (canClaimFaucet) return '';

		const remainingTime = COOLDOWN_TIME - (Date.now() - lastFaucetClaim);
		const hours = Math.floor(remainingTime / (60 * 60 * 1000));
		const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

		return `${hours}h ${minutes}m`;
	}

	function retryConnection() {
		$networkError = '';
		$retryCount = 0;
		resetWalletState();
		$initialized = false;
		$connectionChecked = false;
		$contractExists = false;
		initializeWeb3();
	}

	$: if ($chainId && $chainId !== 31337 && !$warnedOnce && $isConnectedAndReady) {
		console.log('⚠️ Wrong network detected:', $chainId);
		$warnedOnce = true;
	}

	$: if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		console.log('🎯 Reactive state:', {
			$connected: $connected,
			$initialized,
			$connectionChecked,
			$contractExists,
			$currentAddress,
			$balance: $balance.toString(),
			ethBalance: ethBalance.toString(),
			$chainId: $chainId,
			$isConnectedAndReady: $isConnectedAndReady,
			$networkError,
			canClaimFaucet
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

				<!-- ETH Balance and Faucet -->
				<div class="space-y-3 rounded bg-gray-700 p-4 text-center">
					<div>
						<p class="text-white">
							ETH Balance:
							<span class="font-bold text-blue-300">
								{formatEthBalance(ethBalance)} ETH
							</span>
						</p>
					</div>

					<!-- ETH Faucet Button -->
					<button
						class="w-full rounded bg-blue-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={claimETH}
						disabled={faucetLoading || !canClaimFaucet || !$contractExists}
					>
						{#if faucetLoading}
							⏳ Claiming ETH...
						{:else if !canClaimFaucet}
							💧 ETH Faucet ({getCooldownRemaining()} left)
						{:else}
							💧 Claim {FAUCET_AMOUNT} ETH
						{/if}
					</button>

					{#if faucetError}
						<p class="text-xs text-red-300">{faucetError}</p>
					{/if}

					{#if !canClaimFaucet}
						<p class="text-xs text-yellow-300">Cooldown: 24 hours between claims</p>
					{/if}
				</div>

				<!-- WDC Token Section -->
				<!-- <div class="space-y-3 text-center">
					<button
						class="w-full rounded bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={() => claimReward(10)}
						disabled={$loading || !$contractExists}
					>
						{$loading
							? '⏳ Claiming...'
							: $contractExists
								? '🎁 Claim 10 WDC'
								: '❌ Contract Unavailable'}
					</button>

					{#if $reward > 0n}
						<p class="text-sm text-green-400">Claimed {formatBalance($reward)} WDC</p>
					{/if}
				</div> -->

				<!-- <div class="rounded bg-gray-700 p-4 text-center">
					<p class="text-white">
						WDC Balance:
						<span class="font-bold text-yellow-300">
							{$contractExists ? formatBalance($balance) : 'N/A'} WDC
						</span>
					</p>
					{#if !$contractExists}
						<p class="mt-1 text-xs text-red-300">Contract not accessible</p>
					{/if}
				</div> -->

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
					Current: {$chainId} | Required: 31337 (Sabdarana Global Network)
				</p>
				<p class="mt-1 text-xs text-yellow-100">Please switch network in your wallet</p>
			</div>
		{/if}

		<!-- Contract info -->
		{#if $contractExists}
			<div class="text-center text-xs text-gray-500">
				<p>Contract: {CONTRACT_ADDRESS}</p>
				<p>Network: Sabdarana Global Network (Chain ID: 31337)</p>
				<p>RPC: {RPC_URL}</p>
			</div>
		{/if}
	</div>
</div>
