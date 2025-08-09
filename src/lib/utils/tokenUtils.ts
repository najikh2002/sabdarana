// src/lib/utils/tokenUtils.ts
import abi from '$lib/constants/abi';
import { getContract } from 'viem';

// Konfigurasi token Widya
export const WIDYA_TOKEN_CONFIG = {
	address: '0x663F3ad617193148711d28f5334eE4Ed07016602', // Ganti dengan alamat contract Widya yang sudah di-deploy
	symbol: 'WDC',
	name: 'Widya',
	decimals: 18,
	image: 'https://your-domain.com/widya-logo.png' // Optional: logo token
} as const;

// ABI minimal untuk ERC20
const ERC20_ABI = abi;

/**
 * Auto-import token Widya ke wallet user menggunakan EIP-747
 */
export async function addWidyaTokenToWallet(): Promise<boolean> {
	try {
		// Check if MetaMask/wallet supports token addition
		if (!window.ethereum) {
			console.warn('No wallet detected');
			return false;
		}

		// Request wallet to add token
		const wasAdded = await window.ethereum.request({
			method: 'wallet_watchAsset',
			params: {
				type: 'ERC20',
				options: {
					address: WIDYA_TOKEN_CONFIG.address,
					symbol: WIDYA_TOKEN_CONFIG.symbol,
					decimals: WIDYA_TOKEN_CONFIG.decimals,
					image: WIDYA_TOKEN_CONFIG.image
				}
			}
		});

		if (wasAdded) {
			console.log('✅ Widya token added to wallet successfully');
		} else {
			console.log('❌ User rejected token addition');
		}

		return wasAdded;
	} catch (error) {
		console.error('❌ Failed to add Widya token to wallet:', error);
		return false;
	}
}

/**
 * Auto-import token dengan verificasi contract terlebih dahulu
 */
export async function autoImportWidyaToken(publicClient: any): Promise<boolean> {
	try {
		// Verify contract exists and get token details
		const contract = getContract({
			address: WIDYA_TOKEN_CONFIG.address as `0x${string}`,
			abi: ERC20_ABI,
			client: publicClient
		});

		// Get token details from contract
		const [name, symbol, decimals] = await Promise.all([
			contract.read.name(),
			contract.read.symbol(),
			contract.read.decimals()
		]);

		console.log('📋 Token details verified:', { name, symbol, decimals });

		// Add to wallet with verified details
		const wasAdded = await window.ethereum.request({
			method: 'wallet_watchAsset',
			params: {
				type: 'ERC20',
				options: {
					address: WIDYA_TOKEN_CONFIG.address,
					symbol: symbol,
					decimals: Number(decimals),
					image: WIDYA_TOKEN_CONFIG.image
				}
			}
		});

		return wasAdded;
	} catch (error) {
		console.error('❌ Auto-import failed:', error);
		return false;
	}
}

/**
 * Get Widya token balance untuk address tertentu
 */
export async function getWidyaBalance(publicClient: any, address: string): Promise<bigint> {
	try {
		const contract = getContract({
			address: WIDYA_TOKEN_CONFIG.address as `0x${string}`,
			abi: ERC20_ABI,
			client: publicClient
		});

		const balance = await contract.read.balanceOf([address as `0x${string}`]);
		return balance as bigint;
	} catch (error) {
		console.error('❌ Failed to get Widya balance:', error);
		return BigInt(0);
	}
}

// Type definitions for window.ethereum
declare global {
	interface Window {
		ethereum?: {
			request: (args: { method: string; params?: any[] | object }) => Promise<any>;
			isMetaMask?: boolean;
			isConnected?: () => boolean;
		};
	}
}
