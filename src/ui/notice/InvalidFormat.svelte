<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";
    import { capitalize } from "@/utils";

    interface Props {
        granularity: IGranularity;
        filepath: string;
        formatValue: string;
        error: string;
    }

    let { granularity, filepath, formatValue, error }: Props = $props();

    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<p class="text-[--text-warning]">Warning: {error}</p>
<p>
    This file <span class="u-pop">{filepath}</span> will not be recognized as a<span
        class="u-pop"
    >
        {" " + periodicity + " "}
    </span>note. Please use a different format.
</p>
<p class="flex justify-between">
    <span class="u-pop">File path: {filepath}</span>
    <span class="u-pop">Format value: {formatValue}</span>
</p>

<style lang="postcss">
    p {
        @apply m-0;
    }
</style>
