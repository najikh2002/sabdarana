<script lang="ts">
	// Semua teks menjadi prop dinamis
	export let title: string = 'Cek email anda';
	export let description: string =
		'Kami telah mengirimkan kode aktivasi ke BudiSiregar23@gmail.com. Mohon masukkan kode tersebut untuk memverifikasi akun Arutala Anda.';
	export const otpLabel = '';
	export let buttonText: string = 'Verifikasi';
	export let resendText: string =
		'Tidak mendapatkan email? cek folder spam anda atau Kirim ulang kode';
	export let emailIconAlt: string = 'Email Icon';
	export let logoAlt: string = 'Logo Arutala';
	export let bgAlt: string = 'Background Ellipse';
	export let aksaraAlt: string = 'Aksara Ha';
	export let aksaraAlt2: string = 'Aksara Ha 2';
	export let sideImgAlt: string = 'Side Image';
	export let onSubmit: (otp: string) => void = () => {};
	export let onResend: () => void = () => {};
	export let onBack: () => void = () => {};
	export let loading: boolean = false;
	export let otp: string = '';

	// OTP input array
	let otpArr = Array(6).fill('');
	let otpRefs: HTMLInputElement[] = Array(6);

	$: otp = otpArr.join('');

	function handleInput(e: Event, idx: number) {
		const val = (e.target as HTMLInputElement).value;
		if (/^[0-9]$/.test(val)) {
			otpArr[idx] = val;
			if (idx < 5) otpRefs[idx + 1]?.focus();
		} else if (val === '') {
			otpArr[idx] = '';
		}
	}
	function handleKeydown(e: KeyboardEvent, idx: number) {
		if (e.key === 'Backspace' && !otpArr[idx] && idx > 0) {
			otpRefs[idx - 1]?.focus();
		}
	}
	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit(otp);
	}
</script>

<div
	class="font-poppins relative min-h-screen overflow-hidden"
	style="background: radial-gradient(ellipse 236.68% 196.58% at -78.61% -46.68%, #0B1061 0%, #087CE3 100%)"
>
	<!-- Dekorasi background dari Figma asset -->
	<img
		src="/forgot-bg-ellipse.png"
		alt={bgAlt}
		class="pointer-events-none absolute -top-32 left-1/4 h-[800px] w-[800px] opacity-60 select-none"
	/>
	<img
		src="/forgot-side-img.png"
		alt={sideImgAlt}
		class="pointer-events-none absolute top-1/2 left-0 h-48 w-48 -translate-y-1/2 opacity-80 select-none md:h-64 md:w-64"
	/>
	<img
		src="/forgot-aksara-ha.png"
		alt={aksaraAlt}
		class="pointer-events-none absolute top-1/3 right-10 h-40 w-40 opacity-70 select-none"
	/>
	<img
		src="/forgot-aksara-ha2.png"
		alt={aksaraAlt2}
		class="pointer-events-none absolute top-1/2 right-32 h-32 w-32 opacity-50 select-none"
	/>

	<!-- Logo -->
	<div class="absolute top-8 left-8 z-20">
		<img
			src="/forgot-logo.png"
			alt={logoAlt}
			class="h-14 w-14 rounded-xl bg-white shadow-lg md:h-16 md:w-16"
		/>
	</div>

	<div class="relative z-10 flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-xl">
			<div class="rounded-3xl bg-white p-8 shadow-2xl backdrop-blur-sm">
				<div class="flex flex-col items-center gap-6">
					<img src="/forgot-email-icon.png" alt={emailIconAlt} class="mb-2 h-24 w-24" />
					<h1 class="text-center text-2xl font-bold text-balance text-gray-900">{title}</h1>
					<p class="text-center text-sm leading-relaxed text-balance text-gray-600">
						{description}
					</p>
				</div>
				<form class="mt-8 flex flex-col items-center gap-6" on:submit|preventDefault={handleSubmit}>
					<div class="flex justify-center gap-3">
						{#each Array(6) as _, idx}
							<input
								class="h-12 w-12 rounded-lg border border-gray-300 text-center text-2xl font-bold transition-all duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
								maxlength="1"
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								bind:this={otpRefs[idx]}
								bind:value={otpArr[idx]}
								on:input={(e) => handleInput(e, idx)}
								on:keydown={(e) => handleKeydown(e, idx)}
								autocomplete="one-time-code"
								required
							/>
						{/each}
					</div>
					<button
						type="submit"
						class="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
						disabled={loading || otp.length < 6}
					>
						{#if loading}
							<span
								class="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle"
							></span>
							Loading...
						{:else}
							{buttonText}
						{/if}
					</button>
				</form>
				<div class="mt-6 text-center text-sm text-gray-600">
					{resendText}
					<button
						type="button"
						class="ml-1 font-medium text-blue-600 hover:underline"
						on:click={onResend}>Kirim ulang kode</button
					>
				</div>
				<div class="mt-4 text-center">
					<button
						type="button"
						class="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline"
						on:click={onBack}
					>
						Kembali ke halaman masuk
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
