<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";

    interface Props {
        granularity: IGranularity;
    }

    let { granularity }: Props = $props();
    const periodicity = getPeriodicityFromGranularity(granularity);
</script>

<span class="u-pop">
    ⚠️ Removing this format will prevent {periodicity} notes that match it from being
    recognized as periodic notes and displaying in the calendar interface.
</span>
