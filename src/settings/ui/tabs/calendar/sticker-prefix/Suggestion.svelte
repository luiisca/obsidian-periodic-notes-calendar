<script lang="ts">
  interface Props {
    filepath?: string;
  }

  let { filepath = "" }: Props = $props();

  const basename = filepath.split("/").pop() || "";
  const path = filepath.substring(0, filepath.lastIndexOf("/"));
</script>

<div class="px-0 flex justify-between items-center">
  <div class="flex items-baseline">
    <span class="font-medium">{basename}</span>
    {#if path}
      <span class="opacity-70 [font-size:var(--font-ui-smaller)] h-4 ml-2"
        >in {path}</span
      >
    {/if}
  </div>
</div>
