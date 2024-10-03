<script lang="ts">
	interface IOption {
		label: string;
		value: string;
	}

	export let onChange: (value: string | undefined) => void | Promise<void>;
	export let options: IOption[] = [];
	export let value: string;
</script>

<select
	class="dropdown"
	on:change={(event) => {
		// @ts-ignore
		onChange(event.target?.value);
	}}
	{value}
>
	{#each options as { label, value }}
		<option {value}>{label}</option>
	{/each}
</select>
