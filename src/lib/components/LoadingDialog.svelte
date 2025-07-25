<script lang="ts">
	export let text: string = 'Memeriksa tulisan Anda...';
</script>

<div
	class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 bg-clip-padding px-8 py-6 shadow-xl backdrop-blur-sm backdrop-filter"
>
	<div class="bg-opacity-30 flex flex-col items-center space-y-4 rounded-2xl">
		<!-- Ganti spinner dengan gambar GIF -->
		<img src="/loading.gif" alt="Loading..." class="h-24 w-24" />
		<p class="text-center text-lg font-semibold text-[#b3f135]">{text}</p>
	</div>
</div>
