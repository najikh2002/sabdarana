// src/routes/api/faucet/+server.ts
import { json } from '@sveltejs/kit';
import {
	createPublicClient,
	createWalletClient,
	http,
	parseEther,
	formatEther,
	isAddress,
	type Hash
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { RequestHandler } from './$types';
import { rpc } from '$lib/constants/rpc';

// ====== Konfigurasi ======
const FAUCET_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const RPC_URL = rpc;
const FAUCET_AMOUNT = parseEther('1'); // 1 ETH
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 jam

// ====== Custom Chain Sabdarana ======
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

// ====== In-memory cooldown tracking ======
const cooldowns = new Map<string, number>();

// ====== Setup Clients ======
const account = privateKeyToAccount(FAUCET_PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({
	chain: sabdaranaChain,
	transport: http(RPC_URL)
});
const walletClient = createWalletClient({
	account,
	chain: sabdaranaChain,
	transport: http(RPC_URL)
});

// ====== POST: Claim ETH ======
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { address } = await request.json();

		// Validasi address
		if (!address || !isAddress(address)) {
			return json({ error: 'Invalid address' }, { status: 400 });
		}

		// Cek cooldown
		const lastClaim = cooldowns.get(address.toLowerCase());
		if (lastClaim && Date.now() - lastClaim < COOLDOWN_TIME) {
			const remainingTime = COOLDOWN_TIME - (Date.now() - lastClaim);
			const hours = Math.ceil(remainingTime / (60 * 60 * 1000));
			return json(
				{ error: `Please wait ${hours} more hours before claiming again` },
				{ status: 429 }
			);
		}

		// Pastikan node terhubung
		const chainId = await publicClient.getChainId();
		if (chainId !== sabdaranaChain.id) {
			return json({ error: 'Wrong network connected' }, { status: 400 });
		}

		// Cek saldo faucet
		const faucetBalance = await publicClient.getBalance({ address: account.address });
		if (faucetBalance < FAUCET_AMOUNT) {
			return json({ error: 'Faucet is empty. Contact admin.' }, { status: 503 });
		}

		// Estimasi gas
		const gas = await publicClient.estimateGas({
			account: account.address,
			to: address as `0x${string}`,
			value: FAUCET_AMOUNT
		});

		// Kirim transaksi ETH
		const txHash = await walletClient.sendTransaction({
			to: address as `0x${string}`,
			value: FAUCET_AMOUNT,
			gas: (gas * BigInt(120)) / BigInt(100) // buffer 20%
		});

		await publicClient.waitForTransactionReceipt({ hash: txHash });

		// Update cooldown
		cooldowns.set(address.toLowerCase(), Date.now());

		console.log(`✅ Sent ${formatEther(FAUCET_AMOUNT)} ETH to ${address}: ${txHash}`);

		return json({
			success: true,
			txHash,
			message: `Sent ${formatEther(FAUCET_AMOUNT)} ETH to ${address}`
		});
	} catch (error: any) {
		console.error('Faucet error:', error);
		return json({ error: 'Faucet failed. Try again later.' }, { status: 500 });
	}
};

// ====== GET: Check status ======
export const GET: RequestHandler = async ({ url }) => {
	const address = url.searchParams.get('address');

	if (!address || !isAddress(address)) {
		return json({ error: 'Invalid address parameter' }, { status: 400 });
	}

	// Cooldown check
	const lastClaim = cooldowns.get(address.toLowerCase());
	const canClaim = !lastClaim || Date.now() - lastClaim >= COOLDOWN_TIME;
	const remainingTime = canClaim ? 0 : COOLDOWN_TIME - (Date.now() - lastClaim);

	// Ambil saldo ETH user
	try {
		const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` });

		return json({
			address,
			canClaim,
			remainingTime,
			balance: formatEther(ethBalance),
			amount: formatEther(FAUCET_AMOUNT),
			network: 'Sabdarana Global Network'
		});
	} catch (error) {
		console.error('❌ Error checking balance:', error);
		return json({ error: 'Failed to check balance' }, { status: 500 });
	}
};
