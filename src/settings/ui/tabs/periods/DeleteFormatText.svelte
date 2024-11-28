<script lang="ts">
    import { type PeriodSettings } from "@/settings";
    import FilepathsCount from "./FilepathsCount.svelte";

    interface Props {
        format: PeriodSettings["formats"][number];
    }

    let { format }: Props = $props();
</script>

Are you sure you want to delete this format? There are <FilepathsCount
    {format}
    separator=""
/> using it.
