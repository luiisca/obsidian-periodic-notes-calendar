<script lang="ts">
	export let isEnabled: boolean;
	export let onChange: (value: boolean) => void;

	let labelEl: HTMLLabelElement;
	$: if (labelEl) {
		labelEl.tabIndex = 0;
		labelEl.onkeydown = (event) => {
			if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
				onChange(!isEnabled);
			}
		};
	}
</script>

<label
	bind:this={labelEl}
	class="checkbox-container cursor-pointer focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)] outline-none"
	class:is-enabled={isEnabled}
>
	<input type="checkbox" tabindex="-1" on:change={() => onChange(!isEnabled)} class="hidden" />
</label>
