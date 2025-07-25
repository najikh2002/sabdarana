<script lang="ts">
	export let visible: boolean;
	export let message: string;
	export let onConfirm: () => void;
	export let onCancel: () => Promise<void>;
</script>

{#if visible}
	<div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-[90%] max-w-md rounded-lg bg-white p-6 shadow-xl">
			<p class="mb-4 text-sm text-gray-700">{message}</p>
			<div class="flex justify-end gap-2">
				<button onclick={onCancel} class="px-4 py-1 text-sm text-gray-600 hover:underline">
					Batal
				</button>
				<button
					onclick={onConfirm}
					class="rounded bg-blue-500 px-4 py-1 text-sm text-white hover:bg-blue-600"
				>
					Konfirmasi
				</button>
			</div>
		</div>
	</div>
{/if}
