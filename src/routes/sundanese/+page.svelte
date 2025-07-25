<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		// Dynamically import GSAP & ScrollTrigger ONLY in browser
		const gsapModule = await import('gsap');
		const scrollTriggerModule = await import('gsap/ScrollTrigger');

		const gsap = gsapModule.default;
		gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);

		// Animasi parallax
		gsap.to('.parallax-1', {
			yPercent: -20,
			ease: 'none',
			scrollTrigger: {
				trigger: '.parallax-section',
				start: 'top bottom',
				end: 'bottom top',
				scrub: true
			}
		});

		gsap.to('.parallax-2', {
			yPercent: -80,
			ease: 'none',
			scrollTrigger: {
				trigger: '.parallax-section',
				start: 'top bottom',
				end: 'bottom top',
				scrub: true
			}
		});

		gsap.to('.parallax-3', {
			yPercent: -90,
			ease: 'none',
			scrollTrigger: {
				trigger: '.parallax-section',
				start: 'top bottom',
				end: 'bottom top',
				scrub: true
			}
		});
	});
</script>

<svelte:head>
	<title>Sundanese Script</title>
	<meta
		name="description"
		content="Platform pembelajaran aksara Jawa interaktif dengan bantuan AI. Latihan menulis, tantangan, dan praktik aksara Jawa untuk pelestarian budaya Nusantara."
	/>
	<meta
		name="keywords"
		content="aksara jawa, belajar aksara jawa, menulis aksara jawa, huruf jawa, carakan, hanacaraka, arutala aksara, pembelajaran aksara nusantara, AI aksara jawa"
	/>
</svelte:head>

<section class="relative z-10 min-h-screen w-full px-6 py-20">
	<div class="parallax-section flex flex-col items-center justify-center gap-[25px] text-center">
		<h2
			class="font-stardock justify-start self-stretch text-center text-3xl font-normal text-lime-100 md:text-5xl lg:text-8xl"
		>
			SABDARANA
		</h2>
		<p class="text-[13px] font-extralight text-white md:text-[22px] md:tracking-[5px]">
			Web3 & NFT Base Cultural Learning-to-Earn Applications
		</p>
	</div>

	<img class="absolute left-1/2 -translate-x-1/2" src="/hero.png" alt="Hero" />
	<!-- Kiri Belakang -->
	<img class="parallax-1 hidden lg:block" src="/hero-1.png" alt="Hero 1" />
	<!-- Depan Kiri ke Tengah -->
	<img class="parallax-2 hidden lg:block" src="/hero-2.png" alt="Hero 2" />
	<!-- Kanan Depan -->
	<img
		class="parallax-3 absolute top-1/2 right-5 hidden -translate-y-1/2 lg:block"
		src="/hero-3.png"
		alt="Hero 3"
	/>
</section>
<section></section>

<style>
	@font-face {
		font-family: 'Stardock';
		src: url('/fonts/Stardock.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
	}

	.font-stardock {
		font-family: 'Stardock';
	}
</style>
