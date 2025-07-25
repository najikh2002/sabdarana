<!-- RegisterPage.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signUpWithEmail, signInWithGoogle } from '$lib/supabase/auth';

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);
	let errorMessage = $state('');
	let formData = $state({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		agreeToTerms: false
	});

	// @ts-ignore
	function togglePasswordVisibility(field) {
		if (field === 'password') {
			showPassword = !showPassword;
		} else if (field === 'confirm') {
			showConfirmPassword = !showConfirmPassword;
		}
	}

	// @ts-ignore
	async function handleSubmit(event) {
		event.preventDefault();
		errorMessage = '';

		// Validate passwords match
		if (formData.password !== formData.confirmPassword) {
			errorMessage = 'Kata sandi tidak cocok';
			return;
		}

		// Validate password length
		if (formData.password.length < 6) {
			errorMessage = 'Kata sandi minimal 6 karakter';
			return;
		}

		loading = true;

		try {
			const result = await signUpWithEmail(formData.email, formData.password, formData.username);

			if (result.success) {
				// Show success message before redirect
				errorMessage = '';
				alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.');
				// Redirect to activation page or dashboard
				setTimeout(() => {
					goto('/auth/login');
				}, 5000);
			} else {
				errorMessage = result.error || 'Terjadi kesalahan saat mendaftar';
			}
		} catch (error) {
			errorMessage = 'Terjadi kesalahan sistem';
		}

		loading = false;
	}

	async function handleGoogleLogin() {
		loading = true;
		errorMessage = '';

		try {
			const result = await signInWithGoogle();

			if (!result.success) {
				errorMessage = result.error || 'Terjadi kesalahan saat masuk dengan Google';
			}
			// Google OAuth will redirect automatically
		} catch (error) {
			errorMessage = 'Terjadi kesalahan saat menghubungi Google';
		}

		loading = false;
	}
</script>

<svelte:head>
	<title>Register</title>
	<meta name="description" content="Register" />
	<meta
		name="keywords"
		content="daftar arutala Aksara, registrasi arutala Aksara, buat akun arutala Aksara, belajar aksara nusantara, platform pembelajaran aksara, kursus aksara online, aksara tradisional indonesia"
	/>
	<meta name="author" content="Sabdanara" />
	<meta property="og:title" content="Daftar Mulai Belajar Aksara Nusantara" />
	<meta
		property="og:description"
		content="Bergabung dengan ribuan pelajar aksara Nusantara. Daftar gratis dan mulai perjalanan belajar aksara tradisional Indonesia."
	/>
	<meta property="og:type" content="website" />
	<meta name="robots" content="index, follow" />
</svelte:head>

<main class="flex min-h-screen">
	<!-- Right Side - Registration Form -->
	<section class="flex w-full items-center justify-center bg-gray-50 p-6">
		<div class="w-full max-w-md">
			<!-- Mobile Logo (visible only on small screens) -->
			<div class="mb-8 text-center lg:hidden">
				<h2 class="text-2xl font-bold text-gray-800">Register Now</h2>
			</div>

			<!-- Form Header -->
			<div class="mb-8 hidden lg:block">
				<h2 class="mb-2 text-3xl font-bold text-gray-800">Register Now</h2>
			</div>

			<!-- Google Login Button -->
			<button
				type="button"
				onclick={handleGoogleLogin}
				disabled={loading}
				class="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 shadow-sm transition-colors duration-200 hover:cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="#4285f4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34a853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#fbbc05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#ea4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Login with Google
			</button>

			<!-- Divider -->
			<div class="relative mb-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-gray-50 px-4 text-gray-500">or</span>
				</div>
			</div>

			<!-- Error Message -->
			{#if errorMessage}
				<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
					{errorMessage}
				</div>
			{/if}

			<!-- Registration Form -->
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Username Field -->
				<div>
					<label for="username" class="mb-2 block text-sm font-medium text-gray-700">
						Username
					</label>
					<input
						type="text"
						id="username"
						bind:value={formData.username}
						placeholder="budi siregar"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<!-- Email Field -->
				<div>
					<label for="email" class="mb-2 block text-sm font-medium text-gray-700"> Email </label>
					<input
						type="email"
						id="email"
						bind:value={formData.email}
						placeholder="BudiSiregar23@gmail.com"
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							bind:value={formData.password}
							placeholder="************************"
							class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
							required
						/>
						<button
							type="button"
							onclick={() => togglePasswordVisibility('password')}
							class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if showPassword}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									></path>
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									></path>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									></path>
								{/if}
							</svg>
						</button>
					</div>
				</div>

				<!-- Confirm Password Field -->
				<div>
					<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
						Password
					</label>
					<div class="relative">
						<input
							type={showConfirmPassword ? 'text' : 'password'}
							id="confirmPassword"
							bind:value={formData.confirmPassword}
							placeholder="************************"
							class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
							required
						/>
						<button
							type="button"
							onclick={() => togglePasswordVisibility('confirm')}
							class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if showConfirmPassword}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
									></path>
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									></path>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									></path>
								{/if}
							</svg>
						</button>
					</div>
				</div>

				<!-- Terms and Conditions -->
				<div class="flex items-start gap-3">
					<input
						type="checkbox"
						id="agreeToTerms"
						bind:checked={formData.agreeToTerms}
						class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						required
					/>
					<label for="agreeToTerms" class="text-sm leading-relaxed text-gray-600">
						I aggree
						<a href="/" class="font-medium text-[#b3f135] hover:text-[#b3f135]">Requirement</a>
						and
						<a href="/" class="font-medium text-[#b3f135] hover:text-[#b3f135]">Privacy</a>
					</label>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={!formData.agreeToTerms || loading}
					class="w-full rounded-xl bg-[#b3f135] px-4 py-3 font-medium text-white transition-all duration-200 hover:cursor-pointer hover:bg-[#b2f135e9] focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Register'}
				</button>
			</form>

			<!-- Login Link -->
			<div class="mt-8 text-center">
				<p class="text-gray-600">
					Have account?
					<a href="/auth/login" class="font-medium text-[#b3f135] hover:text-[#b3f135]">Login</a>
				</p>
			</div>
		</div>
	</section>
</main>
