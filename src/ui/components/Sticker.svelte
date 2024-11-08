<script lang="ts">
    interface Props {
        sticker: string | null | undefined;
    }

    let { sticker }: Props = $props();
</script>

{#if sticker}
    <div
        class="rotate-12 absolute top-0 left-full -translate-x-1/3 -translate-y-1/2"
        id="sticker"
    >
        {sticker}
    </div>
{/if}

<style lang="postcss">
    @tailwind base;
    @tailwind utilities;
</style>
