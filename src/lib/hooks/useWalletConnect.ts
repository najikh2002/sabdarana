// src/lib/hooks/useWalletConnect.ts
import { writable } from 'svelte/store';
import {
	createPublicClient,
	createWalletClient,
	http,
	custom,
	formatEther,
	type Address
} from 'viem';
import { addWidyaTokenToWallet, getWidyaBalance, WIDYA_TOKEN_CONFIG } from '../utils/tokenUtils';
import { rpc } from 'viem/utils';

// Sabdarana chain config
const sabdaranaChain = {
	id: 31337,
	name: 'Sabdarana Global Network',
	network: 'sabdarana',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH'
	},
	rpcUrls: {
		public: { http: [`${rpc}`] }, // Sesuaikan dengan RPC Anda
		default: { http: [`${rpc}`] }
	}
} as const;

// Wallet state
export const walletStore = writable({
	isConnected: false,
	address: null as Address | null,
	ethBalance: '0',
	widyaBalance: '0',
	isLoading: false,
	error: null as string | null
});

class WalletManager {
	private publicClient: any;
	private walletClient: any;

	constructor() {
		this.publicClient = createPublicClient({
			chain: sabdaranaChain,
			transport: http()
		});
	}

	async connectWallet(): Promise<boolean> {
		try {
			walletStore.update((state) => ({ ...state, isLoading: true, error: null }));

			if (!window.ethereum) {
				throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
			}

			// Request account access
			const accounts = await window.ethereum.request({
				method: 'eth_requestAccounts'
			});

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found');
			}

			const address = accounts[0] as Address;

			// Setup wallet client
			this.walletClient = createWalletClient({
				chain: sabdaranaChain,
				transport: custom(window.ethereum)
			});

			// Get balances
			const [ethBalance, widyaBalance] = await Promise.all([
				this.publicClient.getBalance({ address }),
				getWidyaBalance(this.publicClient, address)
			]);

			// Update store
			walletStore.update((state) => ({
				...state,
				isConnected: true,
				address,
				ethBalance: formatEther(ethBalance),
				widyaBalance: formatEther(widyaBalance),
				isLoading: false
			}));

			// Auto-import Widya token setelah 1 detik (beri waktu wallet untuk stabilize)
			setTimeout(async () => {
				try {
					const imported = await addWidyaTokenToWallet();
					if (imported) {
						console.log('🪙 Widya token automatically added to wallet');
						// Refresh balance setelah import
						this.refreshBalances();
					}
				} catch (error) {
					console.log('Token auto-import failed (user might have rejected):', error);
				}
			}, 1000);

			// Setup event listeners
			this.setupEventListeners();

			return true;
		} catch (error: any) {
			walletStore.update((state) => ({
				...state,
				isLoading: false,
				error: error.message || 'Failed to connect wallet'
			}));
			return false;
		}
	}

	async disconnectWallet(): Promise<void> {
		walletStore.update((state) => ({
			isConnected: false,
			address: null,
			ethBalance: '0',
			widyaBalance: '0',
			isLoading: false,
			error: null
		}));
	}

	async refreshBalances(): Promise<void> {
		try {
			const currentState = get(walletStore);
			if (!currentState.address) return;

			const [ethBalance, widyaBalance] = await Promise.all([
				this.publicClient.getBalance({ address: currentState.address }),
				getWidyaBalance(this.publicClient, currentState.address)
			]);

			walletStore.update((state) => ({
				...state,
				ethBalance: formatEther(ethBalance),
				widyaBalance: formatEther(widyaBalance)
			}));
		} catch (error) {
			console.error('Failed to refresh balances:', error);
		}
	}

	async switchToSabdaranaNetwork(): Promise<boolean> {
		try {
			if (!window.ethereum) return false;

			// Try to switch to Sabdarana network
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x7A69' }] // 31337 in hex
			});

			return true;
		} catch (switchError: any) {
			// Network not added to wallet, try to add it
			if (switchError.code === 4902) {
				try {
					await window.ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [
							{
								chainId: '0x7A69',
								chainName: 'Sabdarana Global Network',
								rpcUrls: ['http://localhost:8545'], // Sesuaikan dengan RPC Anda
								nativeCurrency: {
									name: 'Ether',
									symbol: 'ETH',
									decimals: 18
								}
							}
						]
					});
					return true;
				} catch (addError) {
					console.error('Failed to add Sabdarana network:', addError);
					return false;
				}
			}
			return false;
		}
	}

	private setupEventListeners(): void {
		if (!window.ethereum) return;

		// Account changed
		window.ethereum.on?.('accountsChanged', (accounts: string[]) => {
			if (accounts.length === 0) {
				this.disconnectWallet();
			} else {
				// Reconnect with new account
				this.connectWallet();
			}
		});

		// Chain changed
		window.ethereum.on?.('chainChanged', (chainId: string) => {
			// Refresh the page atau handle chain change
			window.location.reload();
		});
	}

	async manuallyAddWidyaToken(): Promise<boolean> {
		return await addWidyaTokenToWallet();
	}

	getPublicClient() {
		return this.publicClient;
	}

	getWalletClient() {
		return this.walletClient;
	}
}

// Export singleton instance
export const walletManager = new WalletManager();

// Helper function to get current store value
function get(store: any) {
	let value: any;
	store.subscribe((v: any) => (value = v))();
	return value;
}
