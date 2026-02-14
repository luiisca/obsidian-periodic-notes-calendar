<script lang="ts">
    import { LoadingCircle } from "@/settings";
    import { cn } from "@/ui/utils";
    import { setIcon } from "obsidian";
    import { onMount, Snippet } from "svelte";

    interface Props {
        onClick: (e?: MouseEvent | KeyboardEvent) => void;
        ariaLabel?: string;
        loading?: boolean;
        className?: string;
        icon?: string;
        children?: Snippet<[]>;
    }

    let {
        onClick,
        ariaLabel = "Delete note",
        loading = false,
        className = "",
        icon,
        children,
    }: Props = $props();

    let el: HTMLElement | null = null;
    onMount(() => {
        el && icon && setIcon(el, icon);
    });
</script>

<a
    href={null}
    class={cn(
        "relative menu-item clickable-icon flex items-center no-underline hover:no-underline",
        loading
            ? "opacity-60 hover:bg-transparent cursor-not-allowed"
            : "hover:bg-[var(--background-modifier-hover)] cursor-[var(--cursor)]",
        "py-[var(--size-2-2)] px-[var(--size-2-3)]",
        className,
    )}
    aria-label={ariaLabel}
    onclick={(e) => {
        e.stopPropagation();
        !loading && onClick(e);
    }}
>
    <LoadingCircle {loading} />
    <div class="menu-item-icon" bind:this={el}></div>
    {@render children?.()}
</a>
