<script lang="ts">
	import LoginCard from '$lib/components/LoginCard.svelte';
	import { goto } from '$app/navigation';
	import { signInWithEmail, signInWithGoogle } from '$lib/supabase/auth';

	let email = '';
	let password = '';
	let showPassword = false;
	let loading = false;
	let errorMessage = '';

	async function handleLogin(emailVal: string, passwordVal: string) {
		loading = true;
		errorMessage = '';
		email = emailVal;
		password = passwordVal;

		try {
			const result = await signInWithEmail(email, password);

			if (result.success) {
				// Redirect through sync page to ensure cookies are set
				goto('/auth/sync');
			} else {
				errorMessage = result.error || 'Email atau kata sandi salah';
			}
		} catch (error) {
			errorMessage = 'Terjadi kesalahan sistem';
		}

		loading = false;
	}

	async function handleGoogle() {
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

	function handleForgot() {
		goto('/auth/forgot-password');
	}

	function handleRegister() {
		goto('/auth/register');
	}
</script>

<svelte:head>
	<title>Login</title>
	<meta name="description" content="Login Page" />
	<meta
		name="keywords"
		content="login arutala, masuk arutala, akun arutala, pembelajaran aksara, aksara nusantara, platform edukasi"
	/>
</svelte:head>

<LoginCard
	bind:email
	bind:password
	bind:showPassword
	bind:loading
	bind:errorMessage
	welcomeTitle="Welcome to"
	brandName="Sabdarana"
	googleText="Login with Google"
	orText="or"
	emailLabel="Email"
	emailPlaceholder="name@email.com"
	passwordLabel="password"
	passwordPlaceholder="••••••••••••••••••••••••••"
	forgotText="Forgot Password?"
	loginText="Login"
	noAccountText="Don't have account?"
	registerText="Signup"
	onLogin={handleLogin}
	onGoogle={handleGoogle}
	onForgot={handleForgot}
	onRegister={handleRegister}
/>
