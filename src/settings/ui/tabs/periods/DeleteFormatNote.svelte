<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";
    import { capitalize } from "@/utils";

    interface Props {
        granularity: IGranularity;
    }

    let { granularity }: Props = $props();
    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<span class="u-pop">
    ⚠️ Removing this format will prevent {periodicity} notes that match it from being recognized as periodic notes and displaying in the calendar interface.
</span>
