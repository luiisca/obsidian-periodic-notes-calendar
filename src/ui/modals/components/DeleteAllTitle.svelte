<script lang="ts">
    interface Props {
        filepathsLength: number;
    }

    let { filepathsLength }: Props = $props();
</script>

Are you sure you want to delete {filepathsLength > 1 ? "all" : ""}
<span class="u-pop"
    >{filepathsLength} {filepathsLength > 1 ? "files" : "file"}</span
>?
