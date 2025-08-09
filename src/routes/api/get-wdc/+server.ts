import { json } from '@sveltejs/kit';
import { walletManager } from '$lib/utils/walletManager'; // jika masih satu file, cukup panggil langsung
// @ts-ignore
export const POST = async ({ request }) => {
	try {
		const { amount } = await request.json();
		const result = await walletManager.claimReward(amount);

		return json({
			success: true,
			txHash: result.hash,
			rewardAmount: result.rewardAmount.toString()
		});
	} catch (err) {
		console.error('❌ Failed to claim reward:', err);
		return json({ error: 'Failed to claim reward' }, { status: 500 });
	}
};
