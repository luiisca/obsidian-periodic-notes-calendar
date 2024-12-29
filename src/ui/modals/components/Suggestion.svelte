<script lang="ts">
    import { Writable } from "svelte/store";
    import DeleteBttn from "./DeleteBttn.svelte";

    interface Props {
        filepath?: string;
        onDelete: () => Promise<void>;
        deletingAllStore: Writable<boolean>;
    }

    let { filepath = "", onDelete, deletingAllStore }: Props = $props();

    const basename = filepath.split("/").pop() || "";
    const path = filepath.substring(0, filepath.lastIndexOf("/"));
    let deleting = $state(false);
</script>

<div class="py-1 px-0 flex justify-between items-center">
    <div class="flex items-baseline">
        <span class="font-medium">{basename}</span>
        {#if path}
            <span class="opacity-70 [font-size:var(--font-ui-smaller)] h-4 ml-2"
                >in {path}</span
            >
        {/if}
    </div>
    <DeleteBttn
        loading={$deletingAllStore || deleting}
        onClick={async () => {
            deleting = true;
            await onDelete();
            deleting = false;
        }}
    />
</div>
