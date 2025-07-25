<script lang="ts">
	// Semua teks menjadi prop dinamis
	export let welcomeTitle: string = 'Selamat datang di';
	export let brandName: string = 'Arutala Aksara';
	export let googleText: string = 'Masuk dengan Google';
	export let orText: string = 'Atau';
	export let emailLabel: string = 'Email';
	export let emailPlaceholder: string = 'nama@email.com';
	export let passwordLabel: string = 'Kata Sandi';
	export let passwordPlaceholder: string = '••••••••••••••••••••••••••';
	export let forgotText: string = 'Lupa Kata Sandi?';
	export let loginText: string = 'Masuk';
	export let noAccountText: string = 'Belum punya akun arutala?';
	export let registerText: string = 'Buat';

	// State
	export let email: string = '';
	export let password: string = '';
	export let showPassword: boolean = false;
	export let loading: boolean = false;
	export let errorMessage: string = '';

	// Event handler props
	export let onLogin: (email: string, password: string) => void = () => {};
	export let onGoogle: () => void = () => {};
	export let onForgot: () => void = () => {};
	export let onRegister: () => void = () => {};

	function handleLogin(e: Event) {
		e.preventDefault();
		onLogin(email, password);
	}
</script>

<div class="font-poppins relative min-h-screen overflow-hidden">
	<!-- Dekorasi background dari Figma asset -->
	<img
		src="/bg-decor-1.png"
		alt="bg-decor-1"
		class="pointer-events-none absolute top-0 left-0 h-60 w-60 opacity-10 select-none"
	/>
	<img
		src="/bg-decor-2.png"
		alt="bg-decor-2"
		class="pointer-events-none absolute top-0 right-0 h-40 w-40 opacity-10 select-none"
	/>
	<img
		src="/bg-decor-3.png"
		alt="bg-decor-3"
		class="pointer-events-none absolute bottom-0 left-0 h-60 w-60 opacity-10 select-none"
	/>
	<img
		src="/bg-circles-1.png"
		alt="bg-circles-1"
		class="pointer-events-none absolute right-0 bottom-0 h-52 w-52 opacity-5 select-none"
	/>
	<img
		src="/bg-circles-2.png"
		alt="bg-circles-2"
		class="pointer-events-none absolute bottom-0 left-1/2 h-52 w-52 opacity-5 select-none"
	/>
	<img
		src="/bg-lines.png"
		alt="bg-lines"
		class="pointer-events-none absolute top-0 left-0 h-80 w-20 opacity-10 select-none"
	/>

	<div class="relative z-10 flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-md">
			<!-- Logo -->
			<!-- <div class="mb-8 flex items-center justify-center">
				<img
					src="/logo-login.png"
					alt="Logo Arutala"
					class="h-16 w-16 rounded-xl bg-white shadow-lg"
				/>
			</div> -->
			<!-- Login card -->
			<div class="rounded-3xl bg-white p-8 shadow-2xl backdrop-blur-sm">
				<!-- Header -->
				<div class="mb-8 text-center">
					<h1 class="mb-2 text-2xl font-bold text-balance text-gray-900">
						{welcomeTitle} <span class="text-[#b3f135]">{brandName}</span>
					</h1>
				</div>
				<!-- Google Sign In -->
				<button
					type="button"
					onclick={onGoogle}
					disabled={loading}
					class="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:cursor-pointer hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<img src="/google-icon.png" alt="Google" class="h-5 w-5" />
					{googleText}
				</button>
				<!-- Divider -->
				<div class="relative mb-6">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-4 text-gray-500">{orText}</span>
					</div>
				</div>
				<!-- Error Message -->
				{#if errorMessage}
					<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
						{errorMessage}
					</div>
				{/if}

				<!-- Login form -->
				<form onsubmit={handleLogin} class="space-y-4">
					<!-- Email field -->
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700"
							>{emailLabel}</label
						>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder={emailPlaceholder}
							required
						/>
					</div>
					<!-- Password field -->
					<div class="relative">
						<label for="password" class="mb-2 block text-sm font-medium text-gray-700"
							>{passwordLabel}</label
						>
						<div class="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
								placeholder={passwordPlaceholder}
								required
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-gray-600"
								tabindex="-1"
							>
								<img src="/eye-off.png" alt="Show/Hide Password" class="h-5 w-5" />
							</button>
						</div>
					</div>
					<!-- Forgot password link -->
					<div class="text-right">
						<button
							type="button"
							onclick={onForgot}
							class="text-sm font-medium text-[#b3f135] transition-colors duration-200 hover:cursor-pointer hover:text-[#96f135eb]"
						>
							{forgotText}
						</button>
					</div>
					<!-- Login button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full cursor-pointer rounded-xl bg-[#b3f135] px-4 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-[#b2f135d8] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? 'Memproses...' : loginText}
					</button>
				</form>
				<!-- Create account link -->
				<div class="mt-6 text-center">
					<span class="text-sm text-gray-600">{noAccountText}</span>
					<button
						type="button"
						onclick={onRegister}
						class="ml-1 cursor-pointer text-sm font-medium text-[#b3f135] transition-colors duration-200 hover:text-[#90f135]"
					>
						{registerText}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
