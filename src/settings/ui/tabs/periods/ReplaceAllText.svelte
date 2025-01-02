<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";

    interface Props {
        replacingFormat: string;
        granularity: IGranularity;
    }

    let { replacingFormat, granularity }: Props = $props();

    const periodicity = getPeriodicityFromGranularity(granularity);
</script>

All existing {periodicity} notes (if any) will be renamed to match this format:
<span class="u-pop">{replacingFormat}</span>.
