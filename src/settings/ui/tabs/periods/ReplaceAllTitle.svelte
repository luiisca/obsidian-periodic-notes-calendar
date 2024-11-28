<script lang="ts">
    interface Props {
        replacingFormat: string;
    }

    let { replacingFormat }: Props = $props();
</script>

Replace all formats with <span class="u-pop">{replacingFormat}</span>?
