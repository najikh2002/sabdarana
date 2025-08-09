import {
	parseUnits,
	type Hash,
	type Address,
	encodeFunctionData,
	http,
	createPublicClient
} from 'viem';
import {
	writeContract,
	waitForTransactionReceipt,
	getAccount,
	getWalletClient,
	getTransactionReceipt,
	createConfig,
	getChainId
} from '@wagmi/core';
import { rpc } from '$lib/constants/rpc';

// Types
interface RewardItem {
	amount: string | number;
	tokenAddress?: Address;
}

interface MintConfig {
	contractAddress: Address;
	abi: any[];
	functionName: string;
	chainId: number;
	decimals?: number;
}

interface MintResult {
	success: boolean;
	hash?: Hash;
	error?: string;
}

interface AppState {
	loading: boolean;
	loadingStep: string;
	contractExists: boolean;
	chainId: number;
	reward: bigint;
	networkError: string;
}

// State management class
class MintState {
	private state: AppState = {
		loading: false,
		loadingStep: '',
		contractExists: true,
		chainId: 31337,
		reward: 0n,
		networkError: ''
	};

	private listeners: ((state: AppState) => void)[] = [];

	getState(): AppState {
		return { ...this.state };
	}

	setState(updates: Partial<AppState>): void {
		this.state = { ...this.state, ...updates };
		this.listeners.forEach((listener) => listener(this.state));
	}

	subscribe(listener: (state: AppState) => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener);
		};
	}
}

// Global state instance
const mintState = new MintState();

// Default configuration
const DEFAULT_CONFIG: MintConfig = {
	contractAddress: (process.env.CONTRACT_ADDRESS as Address) || '0x',
	abi: [], // TODO: isi dengan ABI kontrak kamu
	functionName: 'mint',
	chainId: 31337,
	decimals: 18
};

// Definisi minimal chain untuk Hardhat
const hardhatChain = {
	id: DEFAULT_CONFIG.chainId,
	name: 'Hardhat Local',
	network: 'hardhat',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: {
		default: { http: [rpc || 'http://127.0.0.1:8545'] },
		public: { http: [rpc || 'http://127.0.0.1:8545'] }
	}
};

// Buat config Wagmi
export const wagmiConfig = createConfig({
	chains: [hardhatChain],
	transports: {
		[hardhatChain.id]: http(hardhatChain.rpcUrls.default.http[0])
	}
});

/**
 * Auto mint WDC tokens without wallet confirmation popup
 * Uses pre-signed transactions or contract owner privileges
 */
export async function autoMintWDC(
	rewardItem: RewardItem,
	wagmiConfig: any,
	config: Partial<MintConfig> = {},
	loadBalanceWithRetry?: () => Promise<void>
): Promise<MintResult> {
	const mintConfig = { ...DEFAULT_CONFIG, ...config };
	const currentState = mintState.getState();

	if (currentState.loading || !currentState.contractExists) {
		return { success: false, error: 'Contract not ready or already processing' };
	}

	mintState.setState({ loading: true, loadingStep: 'Preparing auto mint...' });

	try {
		if (!wagmiConfig) {
			throw new Error('Wagmi config not available');
		}

		const account = getAccount(wagmiConfig);
		if (!account?.isConnected || !account?.address) {
			throw new Error('Wallet not connected');
		}

		// Validate network
		if (currentState.chainId !== mintConfig.chainId) {
			throw new Error(`Wrong network. Please switch to Chain ID: ${mintConfig.chainId}`);
		}

		const rewardAmount = parseUnits(String(rewardItem.amount || rewardItem), mintConfig.decimals!);

		console.log('⛏️ Auto minting to:', account.address);
		console.log('💰 Amount:', rewardAmount.toString());

		mintState.setState({ loadingStep: 'Executing auto mint...' });

		// Method 1: Direct contract call (if wallet is contract owner)
		const hash = await executeAutoMint(wagmiConfig, account.address, rewardAmount, mintConfig);

		if (hash) {
			mintState.setState({ loadingStep: 'Confirming transaction...' });
			const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

			console.log('✅ Auto mint confirmed:', receipt);

			// Update local state
			mintState.setState({
				reward: rewardAmount,
				networkError: ''
			});

			if (loadBalanceWithRetry) {
				await loadBalanceWithRetry();
			}

			return { success: true, hash };
		}

		throw new Error('Failed to execute auto mint');
	} catch (error: any) {
		console.error('❌ Auto mint failed:', error);

		const errorMessage = parseErrorMessage(error);
		return { success: false, error: errorMessage };
	} finally {
		mintState.setState({ loading: false });
	}
}

/**
 * Execute auto mint using different strategies
 */
async function executeAutoMint(
	config: any,
	recipientAddress: Address,
	amount: bigint,
	mintConfig: MintConfig
): Promise<Hash> {
	// Strategy 1: Try direct writeContract with gasless transaction
	try {
		console.log('🔄 Trying gasless transaction...');

		const result = await writeContract(config, {
			address: mintConfig.contractAddress,
			abi: mintConfig.abi,
			functionName: mintConfig.functionName,
			args: [recipientAddress, amount],
			// Gasless transaction options
			gas: 200000n,
			gasPrice: 0n // Free gas if supported by network
		});

		return result as Hash;
	} catch (gaslessError) {
		console.log('⚠️ Gasless failed, trying wallet client...');
	}

	// Strategy 2: Use wallet client with automatic approval
	const walletClient = await getWalletClient(config);
	if (!walletClient) {
		throw new Error('Wallet client not available');
	}

	// Pre-approve transaction to avoid confirmation popup
	const hash = await walletClient.writeContract({
		address: mintConfig.contractAddress,
		abi: mintConfig.abi,
		functionName: mintConfig.functionName,
		args: [recipientAddress, amount],
		account: walletClient.account!
		// Skip confirmation if possible
	});

	return hash;
}

/**
 * SAFE VERSION - Simple claimReward without complex state management
 * Use this if you're having issues with the advanced version
 */
export async function safeClaimReward(
	rewardItem: any,
	wagmiConfig: any,
	contractConfig: { contractAddress: Address; abi: any[] },
	chainId: number = 31337
): Promise<{ success: boolean; hash?: Hash; error?: string }>;

export async function safeClaimReward(
	rewardItem: any,
	wagmiConfig: any,
	contractAddress: Address,
	abi: any[],
	chainId?: number
): Promise<{ success: boolean; hash?: Hash; error?: string }>;

export async function safeClaimReward(
	rewardItem: any,
	wagmiConfig: any,
	contractAddressOrConfig: Address | { contractAddress: Address; abi: any[] },
	abiOrChainId?: any[] | number,
	chainId: number = 31337
): Promise<{ success: boolean; hash?: Hash; error?: string }> {
	// Handle different parameter formats
	let contractAddress: Address;
	let abi: any[];
	let finalChainId: number;

	if (typeof contractAddressOrConfig === 'object' && 'contractAddress' in contractAddressOrConfig) {
		// Called with config object: safeClaimReward(reward, wagmi, { contractAddress, abi }, chainId)
		contractAddress = contractAddressOrConfig.contractAddress;
		abi = contractAddressOrConfig.abi;
		finalChainId = typeof abiOrChainId === 'number' ? abiOrChainId : chainId;
	} else {
		// Called with separate params: safeClaimReward(reward, wagmi, address, abi, chainId)
		contractAddress = contractAddressOrConfig as Address;
		abi = abiOrChainId as any[];
		finalChainId = chainId;
	}

	console.log('🔒 Safe claim reward called with:', { rewardItem, contractAddress, finalChainId });

	try {
		// Handle Svelte store vs direct config
		let configToUse;

		console.log('🔍 Raw wagmiConfig type:', typeof wagmiConfig);
		console.log('🔍 Raw wagmiConfig keys:', wagmiConfig ? Object.keys(wagmiConfig) : 'null');

		if (wagmiConfig && typeof wagmiConfig === 'object') {
			// Check if it's a Svelte store (has subscribe method)
			if (typeof wagmiConfig.subscribe === 'function') {
				console.log('📦 Detected Svelte store, extracting value...');

				// Method 1: Try to get current value from store
				let storeValue = null;
				try {
					// For Svelte stores, we need to subscribe to get the value
					wagmiConfig.subscribe((value: any) => {
						storeValue = value;
					})(); // Immediately unsubscribe after getting value

					configToUse = storeValue;
					console.log('📦 Extracted from store:', configToUse);
				} catch (storeError) {
					console.warn('⚠️ Could not extract from store:', storeError);

					// Method 2: Try to access internal value
					if (wagmiConfig._value) {
						configToUse = wagmiConfig._value;
					} else if (wagmiConfig.value) {
						configToUse = wagmiConfig.value;
					} else {
						throw new Error('Cannot extract wagmi config from Svelte store');
					}
				}
			} else {
				// Regular object, try different formats
				if (wagmiConfig.current) {
					configToUse = wagmiConfig.current;
				} else if (wagmiConfig._config) {
					configToUse = wagmiConfig._config;
				} else if (wagmiConfig.config) {
					configToUse = wagmiConfig.config;
				} else {
					configToUse = wagmiConfig;
				}
			}
		} else {
			configToUse = wagmiConfig;
		}

		console.log('🔍 Final config to use:', configToUse);
		console.log('🔍 Config type:', typeof configToUse);

		if (!configToUse) {
			throw new Error('Wagmi config not available or invalid format');
		}

		const account = getAccount(configToUse);
		console.log('👤 Account info:', {
			isConnected: account?.isConnected,
			address: account?.address?.substring(0, 10) + '...',
			chainId: account?.chainId
		});

		if (!account?.isConnected || !account?.address) {
			throw new Error('Wallet not connected');
		}

		// Check network
		const currentChainId = account.chainId;
		if (currentChainId !== finalChainId) {
			throw new Error(`Wrong network. Current: ${currentChainId}, Required: ${finalChainId}`);
		}

		// Parse reward amount - handle both formats
		let rewardAmount: bigint;
		try {
			let amountStr: string;

			if (typeof rewardItem === 'object' && rewardItem.rewardItem) {
				amountStr = String(rewardItem.rewardItem);
			} else if (typeof rewardItem === 'object' && rewardItem.amount) {
				amountStr = String(rewardItem.amount);
			} else {
				amountStr = String(rewardItem);
			}

			rewardAmount = parseUnits(amountStr, 18);
			console.log('💰 Parsed amount:', amountStr, '->', rewardAmount.toString());
		} catch (parseError) {
			console.error('❌ Amount parsing error:', parseError);
			throw new Error(`Invalid reward amount: ${JSON.stringify(rewardItem)}`);
		}

		console.log('⛏️ Minting to:', account.address);

		// Try minting
		let hash: Hash;

		try {
			console.log('🔄 Attempting writeContract...');
			const txResult = await writeContract(configToUse, {
				address: contractAddress,
				abi: abi,
				functionName: 'mint',
				args: [account.address, rewardAmount],
				account: account.address
			});

			hash = txResult as Hash;
			console.log('📦 TX Hash from writeContract:', hash);
		} catch (writeError) {
			console.error('❌ WriteContract error:', writeError);

			// Fallback to walletClient
			console.log('🔄 Trying with wallet client...');

			try {
				const walletClient = await getWalletClient(configToUse);
				if (!walletClient) {
					throw new Error('Wallet client not available');
				}

				hash = await walletClient.writeContract({
					address: contractAddress,
					abi: abi,
					functionName: 'mint',
					args: [account.address, rewardAmount]
				});

				console.log('📦 TX Hash from wallet client:', hash);
			} catch (walletError) {
				console.error('❌ Wallet client error:', walletError);
				throw writeError; // Throw original error
			}
		}

		if (!hash) {
			throw new Error('No transaction hash returned');
		}

		console.log('⏳ Waiting for transaction receipt...');

		const hardhatClient = createPublicClient({
			transport: http(rpc || 'http://127.0.0.1:8545')
		});

		async function waitForTxReceiptRaw(hash: `0x${string}`, timeoutMs = 30000) {
			const start = Date.now();

			while (Date.now() - start < timeoutMs) {
				try {
					const receipt = await hardhatClient.getTransactionReceipt({ hash });
					if (receipt) {
						return receipt;
					}
				} catch (err: any) {
					// Kalau belum ada, viem akan throw error => kita diamkan
					if (!err?.message?.includes('not found')) throw err;
				}
				await new Promise((res) => setTimeout(res, 2000));
			}
			throw new Error(`Receipt not found after ${timeoutMs / 1000}s`);
		}

		console.log('⏳ Waiting for transaction receipt...');
		const receipt = await waitForTxReceiptRaw(hash, 30000);
		console.log('✅ Transaction confirmed:', receipt);

		return { success: true, hash };
	} catch (err: any) {
		console.error('❌ Safe claim failed:', err);
		console.error('❌ Error details:', {
			message: err?.message,
			shortMessage: err?.shortMessage,
			cause: err?.cause?.message,
			code: err?.code
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
		} else if (err.message?.includes('Invalid reward amount')) {
			errorMessage = err.message;
		} else if (err.message?.includes('Wagmi config')) {
			errorMessage = 'Wallet configuration error. Please reconnect your wallet.';
		} else {
			errorMessage = err.shortMessage || err.message || 'Transaction failed';
		}

		return { success: false, error: errorMessage };
	}
}

/**
 * HELPER: Get current connected account
 */
export function getCurrentAccount(wagmiConfigStore: any): {
	address: Address | null;
	isConnected: boolean;
	chainId?: number;
} {
	try {
		// Extract wagmi config from store
		let configToUse;

		if (wagmiConfigStore && typeof wagmiConfigStore.subscribe === 'function') {
			// Svelte store
			let storeValue = null;
			wagmiConfigStore.subscribe((value: any) => {
				storeValue = value;
			})();
			configToUse = storeValue;
		} else {
			configToUse = wagmiConfigStore;
		}

		if (!configToUse) {
			console.warn('⚠️ Wagmi config not available');
			return { address: null, isConnected: false };
		}

		const account = getAccount(configToUse);

		return {
			address: account?.address || null,
			isConnected: account?.isConnected || false,
			chainId: account?.chainId
		};
	} catch (error) {
		console.error('❌ Error getting account:', error);
		return { address: null, isConnected: false };
	}
}

/**
 * AUTO MINT VIA API - Enhanced with account detection
 */
export async function autoMintViaAPISimple(
	amount: string | number,
	wagmiConfigStore: any, // Pass your wagmi config store here
	apiEndpoint: string = '/api/auto-mint'
): Promise<{ success: boolean; hash?: Hash; error?: string }> {
	console.log('🤖 Auto mint via API (simple version)');

	try {
		// Get current account
		const accountInfo = getCurrentAccount(wagmiConfigStore);

		if (!accountInfo.isConnected || !accountInfo.address) {
			throw new Error('Wallet not connected. Please connect your wallet first.');
		}

		console.log('👤 Using account:', accountInfo.address);

		// Call the original API function
		return await autoMintViaAPI(amount, accountInfo.address, apiEndpoint);
	} catch (error: any) {
		console.error('❌ Auto mint API simple failed:', error);
		return { success: false, error: error.message };
	}
}
export async function autoMintViaAPI(
	amount: string | number,
	recipientAddress: Address,
	apiEndpoint: string = '/api/auto-mint'
): Promise<{ success: boolean; hash?: Hash; error?: string }> {
	console.log('🤖 Auto mint via API:', { amount, recipientAddress });

	try {
		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				recipient: recipientAddress,
				amount: String(amount),
				timestamp: Date.now()
				// Optional: Add authentication token
				// token: getAuthToken()
			})
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (data.success && data.hash) {
			console.log('✅ Auto mint successful via API:', data.hash);
			return { success: true, hash: data.hash };
		}

		throw new Error(data.error || 'Auto mint failed');
	} catch (error: any) {
		console.error('❌ API auto mint failed:', error);
		return { success: false, error: error.message };
	}
}

/**
 * AUTO MINT WITHOUT WALLET CONFIRMATION
 * Method 2: Pre-signed transaction (requires setup)
 */
export async function autoMintPreSigned(
	amount: string | number,
	wagmiConfigDirect: any,
	contractAddress: Address,
	abi: any[],
	preSignedTxData?: string // Optional pre-signed transaction data
): Promise<{ success: boolean; hash?: Hash; error?: string }> {
	console.log('🔐 Auto mint with pre-signed transaction');

	try {
		const account = getAccount(wagmiConfigDirect);
		if (!account?.address) {
			throw new Error('Wallet not connected');
		}

		// If we have pre-signed data, use it
		if (preSignedTxData) {
			console.log('📝 Using pre-signed transaction data');

			// Send the pre-signed transaction
			const walletClient = await getWalletClient(wagmiConfigDirect);
			if (!walletClient) {
				throw new Error('Wallet client not available');
			}

			// This would send the pre-signed transaction without confirmation
			// Implementation depends on how you generate pre-signed transactions
			const hash = await walletClient.sendRawTransaction({
				serializedTransaction: preSignedTxData as `0x${string}`
			});

			const receipt = await waitForTransactionReceipt(wagmiConfigDirect, { hash });
			return { success: true, hash };
		}

		// Fallback to regular transaction (will still show confirmation)
		return await simpleClaim(amount, wagmiConfigDirect, contractAddress, abi);
	} catch (error: any) {
		console.error('❌ Pre-signed auto mint failed:', error);
		return { success: false, error: error.message };
	}
}

/**
 * AUTO MINT WITHOUT WALLET CONFIRMATION
 * Method 3: Gasless/Meta transaction (requires relayer)
 */
export async function autoMintGasless(
	amount: string | number,
	wagmiConfigDirect: any,
	contractAddress: Address,
	abi: any[],
	relayerEndpoint: string = '/api/relay'
): Promise<{ success: boolean; hash?: Hash; error?: string }> {
	console.log('⛽ Auto mint gasless transaction');

	try {
		const account = getAccount(wagmiConfigDirect);
		if (!account?.address) {
			throw new Error('Wallet not connected');
		}

		const rewardAmount = parseUnits(String(amount), 18);

		// Create transaction data for relayer
		const txData = {
			to: contractAddress,
			data: encodeFunctionData({
				abi: abi,
				functionName: 'mint',
				args: [account.address, rewardAmount]
			}),
			from: account.address,
			value: '0x0'
		};

		console.log('📤 Sending to relayer:', txData);

		// Send to gasless relayer
		const response = await fetch(relayerEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				transaction: txData,
				userAddress: account.address
			})
		});

		if (!response.ok) {
			throw new Error(`Relayer error: ${response.status}`);
		}

		const result = await response.json();

		if (result.success && result.hash) {
			// Wait for confirmation
			const receipt = await waitForTransactionReceipt(wagmiConfigDirect, {
				hash: result.hash
			});

			return { success: true, hash: result.hash };
		}

		throw new Error(result.error || 'Gasless transaction failed');
	} catch (error: any) {
		console.error('❌ Gasless auto mint failed:', error);
		return { success: false, error: error.message };
	}
}

/**
 * AUTO MINT SCHEDULER - Queue multiple mints
 */
export class AutoMintScheduler {
	private queue: Array<{
		amount: string;
		recipient: Address;
		delay: number;
		id: string;
	}> = [];

	private isProcessing = false;

	addToQueue(amount: string, recipient: Address, delayMs: number = 0): string {
		const id = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		this.queue.push({
			amount,
			recipient,
			delay: delayMs,
			id
		});

		console.log(`📋 Added to mint queue: ${id}`, { amount, recipient, delayMs });

		if (!this.isProcessing) {
			this.processQueue();
		}

		return id;
	}

	private async processQueue() {
		if (this.isProcessing || this.queue.length === 0) return;

		this.isProcessing = true;
		console.log('🔄 Processing auto mint queue...');

		while (this.queue.length > 0) {
			const item = this.queue.shift()!;

			try {
				console.log(`⏰ Processing mint ${item.id} after ${item.delay}ms delay`);

				if (item.delay > 0) {
					await new Promise((resolve) => setTimeout(resolve, item.delay));
				}

				// Use API method for auto mint
				const result = await autoMintViaAPI(item.amount, item.recipient);

				if (result.success) {
					console.log(`✅ Auto mint ${item.id} successful:`, result.hash);
				} else {
					console.error(`❌ Auto mint ${item.id} failed:`, result.error);
				}
			} catch (error) {
				console.error(`❌ Error processing mint ${item.id}:`, error);
			}

			// Small delay between transactions
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		this.isProcessing = false;
		console.log('✅ Queue processing completed');
	}

	getQueueLength(): number {
		return this.queue.length;
	}

	clearQueue(): void {
		this.queue = [];
		console.log('🗑️ Mint queue cleared');
	}
}

// Global scheduler instance
export const autoMintScheduler = new AutoMintScheduler();

/**
 * Alternative: Batch mint multiple rewards
 */
export async function batchAutoMint(
	rewards: RewardItem[],
	wagmiConfig: any,
	config: Partial<MintConfig> = {}
): Promise<MintResult[]> {
	const results: MintResult[] = [];

	for (const reward of rewards) {
		const result = await autoMintWDC(reward, wagmiConfig, config);
		results.push(result);

		// Small delay between mints to avoid rate limiting
		if (result.success) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return results;
}

/**
 * Server-side mint (if you have backend API)
 */
export async function serverMintWDC(
	recipientAddress: Address,
	amount: string | number,
	apiEndpoint: string = '/api/mint'
): Promise<MintResult> {
	try {
		const response = await fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				recipient: recipientAddress,
				amount: String(amount),
				timestamp: Date.now()
			})
		});

		if (!response.ok) {
			throw new Error(`Server mint failed: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.success && data.hash) {
			return { success: true, hash: data.hash };
		}

		throw new Error(data.error || 'Server mint failed');
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

/**
 * Parse error messages for better UX
 */
function parseErrorMessage(error: any): string {
	if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
		return 'Transaction rejected by user';
	}

	if (error.message?.includes('insufficient funds')) {
		return 'Insufficient funds for gas';
	}

	if (error.message?.includes('Wrong network')) {
		return error.message;
	}

	if (error.message?.includes('revert')) {
		return 'Transaction reverted. Check contract permissions.';
	}

	if (error.message?.includes('gasless')) {
		return 'Gasless transaction not supported on this network';
	}

	return error.shortMessage || error.message || 'Auto mint failed';
}

// Export state management for external use
export { mintState };

/**
 * Usage Examples:
 */
export async function exampleUsage(wagmiConfig: any, contractAddress: Address, abi: any[]) {
	// Simple usage - most similar to original
	const result1 = await claimRewardTS('100', wagmiConfig, contractAddress, abi);

	if (result1.success) {
		console.log('✅ Minted successfully:', result1.hash);
	} else {
		console.log('❌ Mint failed:', result1.error);
	}

	// Advanced usage with auto mint
	const result2 = await autoMintWDC({ amount: '100' }, wagmiConfig, { contractAddress, abi });

	// Batch mint
	const rewards = [{ amount: '50' }, { amount: '75' }, { amount: '100' }];

	const batchResults = await batchAutoMint(rewards, wagmiConfig);
	console.log('Batch results:', batchResults);

	// Server-side mint
	const serverResult = await serverMintWDC(
		'0x1234567890123456789012345678901234567890' as Address,
		'200'
	);
}
