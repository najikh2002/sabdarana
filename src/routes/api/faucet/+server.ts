// src/routes/api/faucet/+server.ts
import { json } from '@sveltejs/kit';
import {
	createPublicClient,
	createWalletClient,
	http,
	parseEther,
	formatEther,
	isAddress,
	getContract,
	type Hash
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { RequestHandler } from './$types';
import { rpc } from '$lib/constants/rpc';
import abi from '$lib/constants/abi';

// Konfigurasi
const FAUCET_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const RPC_URL = rpc;
const ETH_FAUCET_AMOUNT = parseEther('1'); // 1 ETH
const WIDYA_FAUCET_AMOUNT = parseEther('100'); // 100 WDC
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Alamat contract Widya token (ganti dengan alamat yang benar)
const WIDYA_TOKEN_ADDRESS = '0x663F3ad617193148711d28f5334eE4Ed07016602'; // Ganti dengan alamat contract Widya Anda

// Custom chain definition
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
		public: { http: [RPC_URL] },
		default: { http: [RPC_URL] }
	}
} as const;

// ABI untuk Widya token (mint function)
const WIDYA_TOKEN_ABI = abi;

// In-memory storage untuk cooldown (dalam production gunakan database)
const cooldowns = new Map<string, number>();

// Setup clients
const publicClient = createPublicClient({
	chain: sabdaranaChain,
	transport: http(RPC_URL)
});

const account = privateKeyToAccount(FAUCET_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
	account,
	chain: sabdaranaChain,
	transport: http(RPC_URL)
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { address, tokenType = 'both' } = await request.json();

		// Validasi input
		if (!address || !isAddress(address)) {
			return json({ error: 'Invalid address' }, { status: 400 });
		}

		// Check cooldown
		const lastClaim = cooldowns.get(address.toLowerCase());
		if (lastClaim && Date.now() - lastClaim < COOLDOWN_TIME) {
			const remainingTime = COOLDOWN_TIME - (Date.now() - lastClaim);
			const hours = Math.ceil(remainingTime / (60 * 60 * 1000));
			return json(
				{ error: `Please wait ${hours} more hours before claiming again` },
				{ status: 429 }
			);
		}

		// Verify network connection
		try {
			const chainId = await publicClient.getChainId();
			if (chainId !== 31337) {
				throw new Error(`Wrong network. Expected chainId 31337, got ${chainId}`);
			}
		} catch (networkError: any) {
			console.error('❌ Network verification failed:', networkError);
			return json({ error: 'Unable to connect to Sabdarana network' }, { status: 503 });
		}

		const transactions: { type: string; hash: Hash; amount: string }[] = [];

		// Send ETH if requested
		if (tokenType === 'eth' || tokenType === 'both') {
			try {
				console.log(`💧 Sending ${formatEther(ETH_FAUCET_AMOUNT)} ETH to ${address}`);

				// Check faucet ETH balance
				const faucetBalance = await publicClient.getBalance({ address: account.address });
				if (faucetBalance < ETH_FAUCET_AMOUNT) {
					return json(
						{ error: 'ETH faucet is empty, please contact administrator' },
						{ status: 503 }
					);
				}

				const gasEstimate = await publicClient.estimateGas({
					account: account.address,
					to: address as `0x${string}`,
					value: ETH_FAUCET_AMOUNT
				});

				const ethTxHash = await walletClient.sendTransaction({
					to: address as `0x${string}`,
					value: ETH_FAUCET_AMOUNT,
					gas: (gasEstimate * BigInt(120)) / BigInt(100) // Add 20% buffer
				});

				console.log(`📦 ETH Transaction sent: ${ethTxHash}`);

				const ethReceipt = await publicClient.waitForTransactionReceipt({
					hash: ethTxHash,
					timeout: 60_000
				});

				if (ethReceipt.status !== 'success') {
					throw new Error('ETH transaction failed');
				}

				transactions.push({
					type: 'ETH',
					hash: ethTxHash,
					amount: formatEther(ETH_FAUCET_AMOUNT)
				});
			} catch (ethError) {
				console.error('❌ ETH faucet error:', ethError);
				return json({ error: 'Failed to send ETH' }, { status: 500 });
			}
		}

		// Send Widya tokens if requested
		if (tokenType === 'widya' || tokenType === 'both') {
			try {
				console.log(`🪙 Minting ${formatEther(WIDYA_FAUCET_AMOUNT)} WDC to ${address}`);

				// Setup contract
				const widyaContract = getContract({
					address: WIDYA_TOKEN_ADDRESS as `0x${string}`,
					abi: WIDYA_TOKEN_ABI,
					client: walletClient
				});

				// Mint tokens directly ke user (karena function mint di contract publik)
				const widyaTxHash = await widyaContract.write.mint([
					address as `0x${string}`,
					WIDYA_FAUCET_AMOUNT
				]);

				console.log(`📦 Widya mint transaction sent: ${widyaTxHash}`);

				const widyaReceipt = await publicClient.waitForTransactionReceipt({
					hash: widyaTxHash,
					timeout: 60_000
				});

				if (widyaReceipt.status !== 'success') {
					throw new Error('Widya mint transaction failed');
				}

				transactions.push({
					type: 'WDC',
					hash: widyaTxHash,
					amount: formatEther(WIDYA_FAUCET_AMOUNT)
				});
			} catch (widyaError) {
				console.error('❌ Widya faucet error:', widyaError);
				// Jika ETH berhasil tapi Widya gagal, tetap update cooldown
				if (transactions.length > 0) {
					cooldowns.set(address.toLowerCase(), Date.now());
				}
				return json(
					{
						error: 'Failed to mint Widya tokens',
						partialSuccess: transactions.length > 0 ? transactions : undefined
					},
					{ status: 500 }
				);
			}
		}

		// Update cooldown setelah semua berhasil
		cooldowns.set(address.toLowerCase(), Date.now());

		console.log(`✅ Faucet success for ${address}:`, transactions);

		return json({
			success: true,
			transactions,
			to: address,
			message: `Successfully sent ${transactions.map((t) => `${t.amount} ${t.type}`).join(' and ')} to ${address}`
		});
	} catch (error: any) {
		console.error('❌ Faucet error:', error);

		let errorMessage = 'Faucet request failed';

		if (error.message?.includes('insufficient funds')) {
			errorMessage = 'Faucet wallet has insufficient funds';
		} else if (error.message?.includes('network') || error.name === 'HttpRequestError') {
			errorMessage = 'Network error, please try again';
		} else if (error.name === 'TimeoutError') {
			errorMessage = 'Network timeout. Please try again.';
		} else if (error.name === 'TransportError') {
			errorMessage = 'Cannot connect to Sabdarana Global Network. Please try again later.';
		}

		return json({ error: errorMessage }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const address = url.searchParams.get('address');

	if (!address || !isAddress(address)) {
		return json({ error: 'Invalid address parameter' }, { status: 400 });
	}

	// Check cooldown status
	const lastClaim = cooldowns.get(address.toLowerCase());
	const canClaim = !lastClaim || Date.now() - lastClaim >= COOLDOWN_TIME;

	let remainingTime = 0;
	if (!canClaim && lastClaim) {
		remainingTime = COOLDOWN_TIME - (Date.now() - lastClaim);
	}

	try {
		// Get balances
		const [ethBalance, widyaBalance] = await Promise.all([
			publicClient.getBalance({ address: address as `0x${string}` }),
			getWidyaBalance(address)
		]);

		return json({
			address,
			balances: {
				ETH: formatEther(ethBalance),
				WDC: formatEther(widyaBalance)
			},
			canClaim,
			remainingTime,
			faucetAmounts: {
				ETH: formatEther(ETH_FAUCET_AMOUNT),
				WDC: formatEther(WIDYA_FAUCET_AMOUNT)
			},
			network: 'Sabdarana Global Network',
			tokenAddress: WIDYA_TOKEN_ADDRESS
		});
	} catch (error) {
		console.error('❌ Balance check error:', error);
		return json({ error: 'Failed to check balances on Sabdarana network' }, { status: 500 });
	}
};

// Helper function untuk get Widya balance
async function getWidyaBalance(address: string): Promise<bigint> {
	try {
		const widyaContract = getContract({
			address: WIDYA_TOKEN_ADDRESS as `0x${string}`,
			abi: WIDYA_TOKEN_ABI,
			client: publicClient
		});

		const balance = await widyaContract.read.balanceOf([address as `0x${string}`]);
		return balance as bigint;
	} catch (error) {
		console.error('Failed to get Widya balance:', error);
		return BigInt(0);
	}
}
