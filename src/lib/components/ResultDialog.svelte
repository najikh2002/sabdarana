<script lang="ts">
	import Notification from './Notification.svelte';
	import { onMount } from 'svelte';
	import { autoMintWDC, safeClaimReward } from '$lib/utils/walletManager';
	import { abi } from '$lib/constants/abi';
	import { wagmiConfig } from 'svelte-wagmi';
	import { get } from 'svelte/store';

	// Props
	export let learning: string;
	export let show: boolean;
	export let status: boolean;
	export let text: string;
	// svelte-ignore export_let_unused
	export let isDesktop: boolean;
	// svelte-ignore export_let_unused
	export let labels: Array<{ label: string; value: string }>;
	export let onNextCharacter: () => void;
	export let onCloseDialog: () => void;

	// Internal reward
	let internalReward: any = 0;
	let rewardStatus: 'loading' | 'success' | 'error' = 'loading';
	let x = 0;
	let y = 0;

	function setRewardWeights(learningType: string) {
		const weights: Record<string, [number, number]> = {
			training: [0.4, 0.6],
			practice: [0.1, 0.3],
			challenge: [0.7, 0.9]
		};

		[x, y] = weights[learningType] || [0, 0];
	}

	function getRandomReward(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	async function claimRewardOnServer(amount: string) {
		try {
			const response = await fetch('/api/get-wdc', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount })
			});

			const data = await response.json();
			console.log(data);
			if (response.ok) {
				console.log('Reward berhasil diklaim:', data);
			} else {
				console.error('Gagal klaim reward:', data.error);
			}
		} catch (error) {
			console.error('Error saat klaim reward:', error);
		}
	}

	// Ambil reward saat status success
	onMount(async () => {
		setRewardWeights(learning);
		if (status) {
			try {
				internalReward = getRandomReward(x, y);
				rewardStatus = 'loading';

				const reward = await safeClaimReward({ rewardItem: internalReward }, wagmiConfig, {
					contractAddress: '0x663F3ad617193148711d28f5334eE4Ed07016602',
					abi: abi
				});

				if (reward.success) {
					console.log('✅ Berhasil claim!', reward.hash);
					rewardStatus = 'success';
					// alert(`✅ Berhasil claim! TX: ${reward.hash}`);
				} else {
					console.log('❌ Gagal claim:', reward.error);
					alert(`❌ Gagal claim: ${reward.error}`);
				}
			} catch (err) {
				console.error('Failed to fetch reward:', err);
			}
		}
	});

	// Image dan teks dinamis
	$: imagePath = status ? '/success.gif' : '/failed.gif';
	$: heading = status ? 'Great!' : 'Oops!';
	$: isWide = window.innerWidth > 768;

	// Reward Display
	$: rewardDisplay = status
		? rewardStatus === 'loading'
			? `<div class="rounded-full bg-[#E2FAB1] text-[#588301] px-2 py-1 text-sm w-[107px] flex justify-center items-center">
					<img src="/coin.png" class="animate-spin w-4 h-4 mr-1" />
					<span>Loading...</span>
				</div>`
			: `<div class="rounded-full bg-[#E2FAB1] text-[#588301] px-2 py-1 text-sm w-[127px] flex justify-center items-center">
					<img src="/coin.png" class="w-4 h-4 mr-1" />
					<span>+${internalReward.toFixed(3)} WDC</span>
				</div>`
		: '';

	// Description
	$: description = status
		? `${rewardDisplay}<br>You’ve completed the character <b>${text}</b>${isWide ? '' : ''} Ready to continue?`
		: `It looks like your character writing${isWide ? '<br>' : ''} needs improvement!`;

	// Button Text
	$: rightButton = status
		? isWide
			? 'Next Character'
			: 'Continue'
		: isWide
			? 'Try Again'
			: 'Retry';
</script>

<Notification
	{show}
	title={heading}
	subtitle={description}
	leftButtonText="Kembali"
	rightButtonText={rightButton}
	onLeftClick={onCloseDialog}
	onRightClick={onNextCharacter}
	imageArea={`
		<img class="h-50" src="${imagePath}" alt="" />
	`}
/>
