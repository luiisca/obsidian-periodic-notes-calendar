<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";
    import { type PeriodSettings } from "@/settings";
    import { capitalize } from "@/utils";
    import FilepathsCount from "./FilepathsCount.svelte";

    interface Props {
        granularity: IGranularity;
        format: PeriodSettings["formats"][number];
    }

    let { granularity, format }: Props = $props();
    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<p>
    Are you sure you want to delete this format? There are <FilepathsCount
        {format}
        separator=""
    />
    using it.
</p>
<!-- // TODO: improve wording -->
<p class="u-pop">
    ⚠️ {periodicity} notes matching this format will no longer be recognized by the
    calendar UI
</p>

<style lang="postcss">
    @tailwind utilities;
</style>
