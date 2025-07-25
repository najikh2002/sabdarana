<script lang="ts">
	import Notification from './Notification.svelte';
	import { onMount } from 'svelte';
	import { rewardUser } from '$lib/supabase/reward';

	// Props
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
	let internalReward = 0;

	// Ambil reward saat status success
	onMount(async () => {
		if (status) {
			try {
				internalReward = await rewardUser(1, 4);
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
		? internalReward === 0
			? `<div class="rounded-full bg-[#E2FAB1] text-[#588301] px-2 py-1 text-sm w-[107px] flex justify-center items-center">
					<img src="/coin.png" class="animate-spin w-4 h-4 mr-1" />
					<span>Loading...</span>
				</div>`
			: `<div class="rounded-full bg-[#E2FAB1] text-[#588301] px-2 py-1 text-sm w-[107px] flex justify-center items-center">
					<img src="/coin.png" class="w-4 h-4 mr-1" />
					<span>+${internalReward} WDC</span>
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
