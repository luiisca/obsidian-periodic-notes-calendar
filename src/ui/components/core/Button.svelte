<script lang="ts">
  import { cn } from "@/ui/utils";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    children?: Snippet;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<button
  class={cn(
    "!bg-transparent hover:!bg-[var(--interactive-hover)] cursor-[var(--cursor)] [&:not(:focus-visible)]:shadow-none",
    className,
  )}
  {...rest}
>
  {@render children?.()}
</button>
