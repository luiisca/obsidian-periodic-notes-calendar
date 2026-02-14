<script lang="ts">
  import { cn } from "@/ui/utils";
  import { Snippet } from "svelte";

  interface Props {
    name?: string | Snippet;
    className?: string;
    description?: string | Snippet;
    isHeading?: boolean;
    type?: "dropdown" | "toggle" | undefined;
    control?: Snippet;
  }

  let {
    name,
    className = "",
    description,
    isHeading = false,
    type = undefined,
    control,
  }: Props = $props();
</script>

<!-- doubles as section title thanks to `setting-item-heading` -->
<div
  class={cn("setting-item flex-nowrap", className)}
  class:setting-item-heading={isHeading}
  class:mod-dropdown={type === "dropdown"}
  class:mod-toggle={type === "toggle"}
>
  <div class="setting-item-info">
    {#if name}
      <div class="setting-item-name">
        {#if typeof name === "string"}
          {name}
        {:else}
          {@render name()}
        {/if}
      </div>
    {/if}
    {#if description}
      {#if typeof description === "string"}
        <div class="setting-item-description">
          {description}
        </div>
      {:else}
        <div class="setting-item-description">
          {@render description()}
        </div>
      {/if}
    {/if}
  </div>
  <div class="setting-item-control">
    {@render control?.()}
  </div>
</div>
