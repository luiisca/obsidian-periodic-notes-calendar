<script lang="ts">
	export let filepathsLength: number;
</script>

<p>
	Are you sure you want to delete {filepathsLength > 1 ? 'all' : ''}
	<span class="u-pop">{filepathsLength} {filepathsLength > 1 ? 'files' : 'file'}</span>?
</p>
