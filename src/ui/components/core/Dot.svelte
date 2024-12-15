<script lang="ts">
    import { cn } from "@/ui/utils";

    interface Props {
        className?: string;
        isVisible?: boolean;
        isFilled?: boolean;
        isActive?: boolean;
    }

    let {
        className = "",
        isVisible = true,
        isFilled = false,
        isActive = false,
    }: Props = $props();
</script>

{#if isVisible}
    <svg
        class={cn(
            "inline-block h-[6px] w-[6px] mx-0 my-[1px] fill-transparent",
            "stroke-[--color-dot]",
            isActive && "stroke-[--text-on-accent]",
            isFilled && "fill-[--color-dot]",
            isActive && isFilled && "fill-[--text-on-accent]",
            className,
        )}
        viewBox="0 0 6 6"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="3" cy="3" r="2" />
    </svg>
{/if}
