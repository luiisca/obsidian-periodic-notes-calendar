<script lang="ts">
    import { LoadingCircle } from "@/settings";
    import { cn } from "@/ui/utils";
    import { setIcon } from "obsidian";
    import { onMount } from "svelte";

    interface Props {
        onClick: () => void;
        ariaLabel?: string;
        text?: string;
        loading?: boolean;
    }

    let {
        onClick,
        ariaLabel = "Delete note",
        text = "",
        loading = false,
    }: Props = $props();

    let deleteBttnEl: HTMLElement;
    onMount(() => {
        setIcon(deleteBttnEl, "lucide-trash-2");
    });
</script>

<a
    href={null}
    class={cn(
        "relative menu-item tappable is-warning text-xs flex items-center no-underline hover:no-underline",
        loading
            ? "opacity-60 hover:bg-transparent cursor-not-allowed "
            : "hover:bg-[var(--background-modifier-hover)] cursor-pointer",
    )}
    aria-label={ariaLabel}
    onclick={(e) => {
        e.stopPropagation();
        !loading && onClick();
    }}
>
    <LoadingCircle {loading} />
    <div class="menu-item-icon" bind:this={deleteBttnEl}></div>
    {#if text}
        <span>{text}</span>
    {/if}
</a>
