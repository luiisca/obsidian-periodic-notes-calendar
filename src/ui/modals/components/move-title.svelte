<script lang="ts">
    interface Props {
        filepath: string;
        targetFolderpath: string;
    }

    let { filepath, targetFolderpath }: Props = $props();
</script>

Are you sure you want to move
<span class="u-pop">{filepath}</span> to
<span class="u-pop">{targetFolderpath}</span>?
