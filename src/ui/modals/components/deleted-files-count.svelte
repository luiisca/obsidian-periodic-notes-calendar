<script lang="ts">
    import { deletedFilesCountStore } from "../stores";

    interface Props {
        filepathsLength: number;
    }
    let { filepathsLength }: Props = $props();
</script>

<p>
    <span class="u-pop">{$deletedFilesCountStore}/{filepathsLength}</span>
    files deleted
</p>

<style lang="postcss">
    p {
        @apply m-0;
    }
</style>
