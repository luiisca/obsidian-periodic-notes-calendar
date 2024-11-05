<script lang="ts">
	import { run } from 'svelte/legacy';

	interface Props {
		isEnabled: boolean;
		onChange: (value: boolean) => void;
	}

	let { isEnabled, onChange }: Props = $props();

	let labelEl: HTMLLabelElement = $state();
	run(() => {
		if (labelEl) {
			labelEl.tabIndex = 0;
			labelEl.onkeydown = (event) => {
				if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
					onChange(!isEnabled);
				}
			};
		}
	});
</script>

<label
	bind:this={labelEl}
	class="checkbox-container cursor-pointer focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)] outline-none"
	class:is-enabled={isEnabled}
>
	<input type="checkbox" tabindex="-1" onchange={() => onChange(!isEnabled)} class="hidden" />
</label>
