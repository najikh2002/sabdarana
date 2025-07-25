<script lang="ts">
	export let img: string;
	export let title: string;
	export let subtitle: string;
	export let style: string = '';
	export let styleClass: string = '';
	export let position: number = 0;
	export let disableStyle: boolean = false;
	export let onClick: () => void = () => {};
</script>

<button
	class={`flex h-64 w-60 ${styleClass} ${!disableStyle ? 'cursor-pointer transition-all duration-300 hover:scale-105' : ''} flex-col items-center justify-center rounded-[40px]
         bg-[radial-gradient(ellipse_137.51%_278.82%_at_1.95%_3.59%,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_100%)]
         text-3xl font-bold text-white shadow-lg backdrop-blur-xl`}
	style={`${!disableStyle ? style : ''}`}
	role={position === 0 ? 'button' : undefined}
	tabindex={position === 0 ? 0 : undefined}
	on:click={() => position === 0 && onClick()}
	on:keydown={(e) => position === 0 && e.key === 'Enter' && onClick()}
>
	<img src={img} alt="" height="106" width="106" />
	<div class="flex flex-col gap-[9px] px-5">
		<h3
			class="font-poppins justify-center self-stretch text-center text-3xl leading-9 font-semibold text-white capitalize"
		>
			{title}
		</h3>
		<p
			class="font-poppins justify-center self-stretch text-center text-xs leading-tight font-normal text-neutral-200"
		>
			{subtitle}
		</p>
	</div>
</button>
