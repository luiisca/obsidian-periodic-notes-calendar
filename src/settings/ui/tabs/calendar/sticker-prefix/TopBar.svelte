<script lang="ts">
  import { handlePNBackup, handlePNMigrate } from "./utils";
  import Button from "./Button.svelte";
</script>

<div class="flex justify-between items-center p-[24px] pb-0">
  <span class="font-medium">Notes</span>
  <div class="flex items-center">
    <Button
      onClick={handlePNBackup}
      ariaLabel="Move all notes"
      className="py-[var(--size-4-1)] px-[var(--size-4-2)]"
      icon="folder-archive">Backup</Button
    >
    <Button
      onClick={handlePNMigrate}
      ariaLabel="Delete all notes"
      className="py-[var(--size-4-1)] px-[var(--size-4-2)] is-warning"
      icon="replace-all">Migrate</Button
    >
  </div>
</div>
