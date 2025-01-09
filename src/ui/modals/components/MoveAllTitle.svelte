<script lang="ts">
    interface Props {
        filepathsLength: number;
        targetFolderpath: string;
    }

    let { filepathsLength, targetFolderpath }: Props = $props();
</script>

Are you sure you want to move {filepathsLength > 1 ? "all" : ""}
<span class="u-pop"
    >{filepathsLength} {filepathsLength > 1 ? "files" : "file"}</span
>
to folder <span class="u-pop">{targetFolderpath}</span>?
