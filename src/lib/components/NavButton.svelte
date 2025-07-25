<script lang="ts">
	export let icon = 'X';
	export let scrollOffset = 100;
	export let scrollElement: HTMLElement;

	function scroll() {
		if (scrollElement) {
			const maxScroll = scrollElement.scrollWidth - scrollElement.clientWidth;
			const newScroll = Math.min(Math.max(scrollElement.scrollLeft + scrollOffset, 0), maxScroll);
			scrollElement.scrollTo({ left: newScroll, behavior: 'smooth' });
		}
	}
</script>

<button
	on:click={scroll}
	class="mx-2 rounded-full bg-white/80 p-2 shadow-md transition hover:scale-105"
>
	<i class={`text-xl ${icon}`}></i>
	<!-- gunakan lucide-icon atau fontawesome -->
</button>
