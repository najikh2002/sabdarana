<script lang="ts">
	import { scriptStore } from '$lib/stores/scriptStore';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { user } from '$lib/supabase/authStore';
	import { signOut } from '$lib/supabase/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let isDropdown = $state(false);
	let isMobileMenu = $state(false);
	let scriptCurrent = $state(get(scriptStore));
	let isChoose = $state(false);
	let isProfileDropdown = $state(false);
	let currentUser = $state<any>(null);

	// Subscribe to user changes
	$effect(() => {
		currentUser = $user;
	});

	// Watch for URL changes and update script dropdown
	$effect(() => {
		const segments = page.url.pathname.split('/');
		const scriptCandidate = segments[1];
		const supportedScripts = ['javanese', 'sundanese'];
		if (supportedScripts.includes(scriptCandidate) && scriptCandidate !== scriptCurrent) {
			scriptCurrent = scriptCandidate;
			reorder(scriptCandidate);
		}
	});

	// Update scriptCurrent when store changes
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		unsubscribe = scriptStore.subscribe((value) => {
			scriptCurrent = value;
			// Reorder scripts when store value changes
			reorder(value);
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	function handleDropdown(event?: MouseEvent) {
		if (event) {
			event.stopPropagation();
		}
		isDropdown = !isDropdown;
		// Close profile dropdown when opening script dropdown
		if (isDropdown) {
			isProfileDropdown = false;
		}
	}

	function handleProfileDropdown(event?: MouseEvent) {
		if (event) {
			event.stopPropagation();
		}
		isProfileDropdown = !isProfileDropdown;
		// Close script dropdown when opening profile dropdown
		if (isProfileDropdown) {
			isDropdown = false;
		}
	}

	function closeDropdowns(event: MouseEvent) {
		const target = event.target as HTMLElement;

		// Don't close if clicking inside dropdowns
		if (!target.closest('.profile-dropdown')) {
			isProfileDropdown = false;
		}
		if (!target.closest('.script-dropdown')) {
			isDropdown = false;
		}
	}

	async function handleLogout() {
		await signOut();
		goto('/auth/login');
	}

	function handleMobileMenu() {
		if (isMobileMenu) {
			isMobileMenu = false;
			// Enable body scroll
			if (typeof document !== 'undefined') {
				document.body.style.overflow = 'auto';
			}
		} else {
			isMobileMenu = true;
			// Disable body scroll
			if (typeof document !== 'undefined') {
				document.body.style.overflow = 'hidden';
			}
		}
	}

	let navLinks = $derived([
		{
			id: 0,
			title: 'Excercise',
			href: `/${scriptCurrent}/training`
		},
		{
			id: 1,
			title: 'Practice',
			href: `/${scriptCurrent}/practice`
		},
		{
			id: 2,
			title: 'Challenge',
			href: `/${scriptCurrent}/challenge`
		}
	]);

	const allScripts = [
		{ id: 'javanese', name: 'Javanese' },
		{ id: 'sundanese', name: 'Sundanese' }
	];

	let orderedScripts = $state([...allScripts]);

	onMount(() => {
		reorder(scriptCurrent);

		// Add click listener for closing dropdowns
		if (typeof window !== 'undefined') {
			document.addEventListener('click', closeDropdowns);
		}

		return () => {
			if (typeof window !== 'undefined') {
				document.removeEventListener('click', closeDropdowns);
				// Reset body scroll on unmount
				document.body.style.overflow = 'auto';
			}
		};
	});

	function select(id: string) {
		scriptStore.set(id);
		reorder(id);
		window.location.href = `/${id}`;
	}

	function reorder(topId: string) {
		const top = allScripts.find((s) => s.id === topId);
		const others = allScripts.filter((s) => s.id !== topId);
		orderedScripts = top ? [top, ...others] : [...allScripts];
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleDropdown();
		}
	}
</script>

<nav
	class="relative flex h-[80px] w-full items-center justify-between md:h-[120px] lg:mx-auto lg:w-[90%]"
>
	<a href="/" class="absolute top-5 left-6">
		<img src="/logo.png" width="40" alt="" />
	</a>
	<ul class="absolute left-1/2 z-100 hidden -translate-x-1/2 gap-20 md:top-5 md:flex">
		{#each navLinks as { title, href }}
			<li>
				<a class="text-gray-400 transition-all hover:text-white" {href}>{title}</a>
			</li>
		{/each}
	</ul>

	<!-- Script Dropdown -->
	<div
		tabindex="0"
		role="button"
		aria-expanded={isDropdown}
		aria-label="Pilih Aksara"
		onclick={handleDropdown}
		onkeydown={handleKeyDown}
		class="script-dropdown {isDropdown
			? 'h-[84px]'
			: 'h-[32px]'} absolute top-7 left-1/2 z-[100] w-[138px] -translate-x-1/2 cursor-pointer overflow-hidden rounded-md bg-[#b3f135] text-center text-black shadow-md transition-all duration-300 md:top-5 md:right-[80px] md:left-auto md:translate-x-0"
	>
		<div class="relative h-full">
			<div class="flex h-[32px] items-center justify-between px-3">
				<span class="font-medium">{orderedScripts[0]?.name || 'Pilih Aksara'}</span>
				<svg
					class="ml-2 h-4 w-4 transition-transform duration-300 {isDropdown ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
					></path>
				</svg>
			</div>
			<ul class="pt-1">
				{#each orderedScripts.slice(1) as script}
					<li>
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								select(script.id);
							}}
							class="w-full cursor-pointer px-3 py-1.5 text-left transition-all hover:bg-sky-600 focus:outline-none"
						>
							{script.name}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<!-- Auth Section -->
	<div class="absolute top-4 right-6 z-[110] hidden md:block">
		{#if currentUser}
			<!-- Profile Dropdown -->
			<div class="profile-dropdown relative">
				<button
					type="button"
					onclick={handleProfileDropdown}
					class="profile-button flex items-center space-x-2 rounded-full bg-gray-700 p-1.5 transition-colors hover:bg-gray-600"
				>
					{#if currentUser.user_metadata?.avatar_url}
						<img
							src={currentUser.user_metadata.avatar_url}
							alt="Profile"
							class="h-8 w-8 rounded-full"
						/>
					{:else}
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-[#b3f135] font-semibold text-white"
						>
							{currentUser.email?.charAt(0).toUpperCase()}
						</div>
					{/if}
				</button>

				{#if isProfileDropdown}
					<div class="absolute right-0 z-[120] mt-2 w-48 rounded-md bg-white py-1 shadow-lg">
						<div class="border-b border-gray-200 px-4 py-2">
							<p class="text-sm font-medium text-gray-900">
								{currentUser.user_metadata?.display_name ||
									currentUser.user_metadata?.full_name ||
									'User'}
							</p>
							<p class="truncate text-xs text-gray-500">{currentUser.email}</p>
						</div>
						<a
							href="/profile"
							class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							onclick={() => (isProfileDropdown = false)}
						>
							My Profile
						</a>
						<button
							type="button"
							onclick={handleLogout}
							class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
						>
							Logout
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<a
				href="/auth/login"
				class="inline-flex items-center rounded-md border border-transparent py-2 text-sm font-medium text-white transition-colors hover:text-[#b3f135]"
			>
				Login
			</a>
		{/if}
	</div>

	<button onclick={handleMobileMenu} class="absolute top-8 right-6 text-white md:hidden">
		<span>MENU</span>
	</button>
</nav>

<div
	class="{isMobileMenu
		? 'right-0'
		: '-right-[100%]'} fixed top-0 z-[200] flex h-full w-full flex-col overflow-hidden bg-black transition-all duration-300"
>
	<!-- Close Button -->
	<button
		onclick={handleMobileMenu}
		class="absolute top-6 right-6 z-110 flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 text-white transition-all hover:border-white"
		aria-label="Close menu"
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
			></path>
		</svg>
	</button>

	<div class="flex h-full flex-col overflow-y-auto overscroll-contain">
		<!-- User Profile Section -->
		{#if currentUser}
			<div class="border-b border-gray-800 px-6 py-8">
				<div class="flex items-center gap-4">
					{#if currentUser.user_metadata?.avatar_url}
						<img
							src={currentUser.user_metadata.avatar_url}
							alt="Profile"
							class="h-16 w-16 rounded-full"
						/>
					{:else}
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full bg-[#b3f135] text-2xl font-semibold text-white"
						>
							{currentUser.email?.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div>
						<p class="text-lg font-medium text-white">
							{currentUser.user_metadata?.display_name ||
								currentUser.user_metadata?.full_name ||
								'User'}
						</p>
						<p class="text-sm text-gray-400">{currentUser.email}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Navigation Links -->
		<nav class="flex-1 px-6 py-8">
			<ul class="space-y-6">
				{#each navLinks as { title, href }}
					<li>
						<a
							class="block text-2xl text-gray-300 transition-all hover:translate-x-2 hover:text-white"
							{href}
							onclick={handleMobileMenu}
						>
							{title}
						</a>
					</li>
				{/each}

				<!-- Script Selection -->
				<li class="border-t border-gray-800 pt-4">
					<p class="mb-3 text-sm text-gray-500">Choose Script</p>
					<div class="space-y-2">
						{#each allScripts as script}
							<button
								type="button"
								onclick={() => {
									select(script.id);
									handleMobileMenu();
								}}
								class="block w-full text-left text-xl transition-all hover:translate-x-2 {script.id ===
								scriptCurrent
									? 'text-[#b3f135]'
									: 'text-gray-400 hover:text-white'}"
							>
								{script.name}
							</button>
						{/each}
					</div>
				</li>
			</ul>
		</nav>

		<!-- Auth Actions -->
		<div class="border-t border-gray-800 px-6 py-6">
			{#if currentUser}
				<ul class="space-y-4">
					<li>
						<a
							href="/profile"
							class="flex items-center gap-3 text-lg text-gray-300 transition-all hover:text-white"
							onclick={handleMobileMenu}
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								></path>
							</svg>
							Profil Saya
						</a>
					</li>
					<li>
						<button
							type="button"
							onclick={async () => {
								await handleLogout();
								handleMobileMenu();
							}}
							class="flex items-center gap-3 text-lg text-gray-300 transition-all hover:text-white"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								></path>
							</svg>
							Logout
						</button>
					</li>
				</ul>
			{:else}
				<a
					href="/auth/login"
					class="block w-full rounded-md bg-[#b3f135] px-4 py-3 text-center text-lg font-medium text-white transition-all hover:bg-sky-600"
					onclick={handleMobileMenu}
				>
					Login
				</a>
			{/if}
		</div>
	</div>
</div>
