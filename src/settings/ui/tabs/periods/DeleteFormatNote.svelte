<script lang="ts">
    import { getPeriodicityFromGranularity, IGranularity } from "@/io";
    import { capitalize } from "@/utils";

    interface Props {
        granularity: IGranularity;
    }

    let { granularity }: Props = $props();
    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<!-- // TODO: improve wording -->
<span class="u-pop">
    ⚠️ {periodicity} notes matching this format will no longer be recognized by the
    calendar UI
</span>
