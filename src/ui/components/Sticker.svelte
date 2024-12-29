<script lang="ts">
    interface Props {
        sticker: string | null | undefined;
    }

    let { sticker }: Props = $props();
</script>

{#if sticker}
    <div
        class="[transform:rotate(12deg)_translate(-33%,-50%)] absolute top-0 left-full z-10"
        id="sticker"
    >
        {sticker}
    </div>
{/if}
