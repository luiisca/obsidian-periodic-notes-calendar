<script lang="ts">
	interface Props {
		name: string;
		description?: string;
		isHeading?: boolean;
		type?: 'dropdown' | 'toggle' | undefined;
		control?: import('svelte').Snippet;
	}

	let {
		name,
		description = '',
		isHeading = false,
		type = undefined,
		control
	}: Props = $props();
</script>

<!-- doubles as section title thanks to `setting-item-heading` -->
<div
	class="setting-item"
	class:setting-item-heading={isHeading}
	class:mod-dropdown={type === 'dropdown'}
>
	<div class="setting-item-info">
		<div class="setting-item-name">
			<div>
				{name}
			</div>
		</div>
		{#if description}
			<div class="setting-item-description">
				{description}
			</div>
		{/if}
	</div>
	<div class="setting-item-control">
		{@render control?.()}
	</div>
</div>
