<script lang="ts">
    import { type PeriodSettings } from "@/settings";
    import FilepathsCount from "./FilepathsCount.svelte";
    import { Writable } from "svelte/store";

    interface Props {
        settings: Writable<PeriodSettings>;
        format: PeriodSettings["formats"][number];
    }

    let { settings, format }: Props = $props();
</script>

Are you sure you want to delete this format? <FilepathsCount
    {settings}
    {format}
    separator=""
/> using it.
