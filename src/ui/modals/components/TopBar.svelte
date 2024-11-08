<script lang="ts">
    import { Writable } from "svelte/store";
    import DeleteBttn from "./DeleteBttn.svelte";
    import { cn } from "@/ui/utils";

    interface Props {
        onDelete: () => void;
        deletingAllStore: Writable<boolean>;
    }

    let { onDelete, deletingAllStore }: Props = $props();
</script>

<div class="flex justify-between items-center p-[24px] pb-0">
    <span class={cn("font-medium", $deletingAllStore && "opacity-60")}
        >Notes</span
    >
    <DeleteBttn
        loading={$deletingAllStore}
        onClick={onDelete}
        ariaLabel="Delete all notes"
        text="Delete all"
    />
</div>
