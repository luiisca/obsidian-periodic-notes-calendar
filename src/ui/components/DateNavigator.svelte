<script lang="ts">
    import { capitalize, isMobile } from "@/utils";
    import { getContext } from "svelte";
    import { cn } from "../utils";
    import { Arrow, Dot } from "./core";

    interface Props {
        showingCrrDate: boolean;
        type: string;
        decrementdisplayedDate: () => void;
        resetdisplayedDate: () => void;
        incrementdisplayedDate: () => void;
    }

    let {
        showingCrrDate,
        type,
        decrementdisplayedDate,
        resetdisplayedDate,
        incrementdisplayedDate,
    }: Props = $props();

    let minimalMode = getContext("minimalMode") as
        | { value: boolean }
        | undefined;
</script>

<div
    class={cn(
        "flex items-center",
        minimalMode?.value || isMobile() ? "-ml-2" : "-ml-1",
    )}
    id="bottom-nav"
>
    <Arrow
        direction="left"
        onClick={decrementdisplayedDate}
        tooltip={`Previous ${capitalize(type)}`}
        className={cn((minimalMode?.value || isMobile()) && "[&>svg]:w-1.5")}
    />
    <button
        class={cn(
            "flex items-center p-2",
            showingCrrDate ? "opacity-100" : "opacity-60",
        )}
        id="reset-button"
        onclick={resetdisplayedDate}
        aria-label={!showingCrrDate
            ? `Go to current ${capitalize(type)}`
            : null}
    >
        <Dot
            className={cn(
                "h-[8px] w-[8px]",
                (minimalMode?.value || isMobile()) && "w-[0.3rem]",
            )}
            isFilled={showingCrrDate}
        />
    </button>
    <Arrow
        direction="right"
        onClick={incrementdisplayedDate}
        tooltip={`Next ${capitalize(type)}`}
        className={cn((minimalMode?.value || isMobile()) && "[&>svg]:w-1.5")}
    />
</div>
