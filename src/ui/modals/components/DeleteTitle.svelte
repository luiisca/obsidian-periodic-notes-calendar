<script lang="ts">
    interface Props {
        filepath: string;
    }

    let { filepath }: Props = $props();
</script>

Are you sure you want to delete
<span class="u-pop">{filepath}</span>?
