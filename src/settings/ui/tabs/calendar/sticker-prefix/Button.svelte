<script lang="ts">
  import { cn, useIcon } from "@/ui/utils";
  import { Snippet } from "svelte";

  interface Props {
    onClick: (e?: MouseEvent | KeyboardEvent) => void;
    icon: string;
    ariaLabel: string;
    children: Snippet<[]>;
    className?: string;
  }

  let { onClick, icon, ariaLabel, children, className = "" }: Props = $props();
</script>

<a
  href={null}
  class={cn(
    "relative menu-item clickable-icon flex items-center no-underline hover:no-underline",
    "hover:bg-[var(--background-modifier-hover)] cursor-[var(--cursor)]",
    "py-[var(--size-2-2)] px-[var(--size-2-3)]",
    className,
  )}
  aria-label={ariaLabel}
  onclick={(e) => {
    e.stopPropagation();
    onClick(e);
  }}
>
  <div class="menu-item-icon" use:useIcon={icon}></div>
  {@render children?.()}
</a>
