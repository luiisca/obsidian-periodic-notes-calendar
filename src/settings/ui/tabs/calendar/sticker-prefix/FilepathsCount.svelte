<script lang="ts">
  import { settingsStore } from "@/settings";
  import { FilepathModal } from "./filepath-select";
  import { cn } from "@/ui/utils";

  let filepaths = $derived(Object.keys($settingsStore.filepaths || {}));
  let filesCount = $derived(filepaths.length);

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    new FilepathModal(filepaths).open();
  }
</script>

{#if filesCount}
  <div class="relative inline-flex">
    <a
      class={cn(
        "[font-size:calc(var(--font-ui-small)+1px)] focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)]",
      )}
      href={null}
      onclick={handleClick}
    >
      {filesCount || "-"}
      {filesCount === 1 ? "File" : "Files"}
    </a>
  </div>
{/if}
