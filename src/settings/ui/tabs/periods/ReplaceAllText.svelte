<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";
    import { capitalize } from "@/utils";

    interface Props {
        replacingFormat: string;
        granularity: IGranularity;
    }

    let { replacingFormat, granularity }: Props = $props();

    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

All existing {periodicity} notes (if any) will be renamed to match this format:
<span class="u-pop">{replacingFormat}</span>.
