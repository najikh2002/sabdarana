import { supabase } from './client';

export async function rewardUser(min = 1, max = 10): Promise<number> {
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw new Error('User not logged in');

	const { data, error } = await supabase.rpc('reward_user_coins', {
		p_user_id: user.id,
		p_min_coin: min,
		p_max_coin: max
	});

	if (error) throw error;
	return data; // data is the numeric reward (e.g. 7)
}
