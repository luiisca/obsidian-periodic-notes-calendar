<script lang="ts">
    import { movedFilesCountStore } from "../stores";

    interface Props {
        filepathsLength: number;
        targetFolderpath: string;
    }
    let { filepathsLength, targetFolderpath }: Props = $props();
</script>

<p>
    <span class="u-pop">{$movedFilesCountStore}/{filepathsLength}</span>
    files moved to <span class="u-pop">{targetFolderpath}</span>
</p>

<style lang="postcss">
    p {
        @apply m-0;
    }
</style>
