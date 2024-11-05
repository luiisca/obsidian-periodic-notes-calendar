<script lang="ts">
	interface Props {
		filename: string;
	}

	let { filename }: Props = $props();
</script>

<p>
	Are you sure you want to delete
	<span class="u-pop">{filename}</span>?
</p>
