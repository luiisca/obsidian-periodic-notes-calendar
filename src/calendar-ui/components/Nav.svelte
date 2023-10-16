<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import type { Moment } from "moment";

  import Arrow from "./Arrow.svelte";
  import { DISPLAYED_DATE } from "../context";
	import Dot from "./Dot.svelte";
	import Month from "./Month.svelte";

  export let today: Moment;

  let displayedDate = getContext<Writable<Moment>>(DISPLAYED_DATE);

  function incrementdisplayedDate() {
    displayedDate.update((month) => month.clone().add(1, "month"));
  }

  function decrementdisplayedDate() {
    displayedDate.update((month) => month.clone().subtract(1, "month"));
  }

  function resetdisplayedDate() {
    displayedDate.set(today.clone());
  }

  let showingCurrentMonth: boolean;
  $: showingCurrentMonth = $displayedDate.isSame(today, "month");
</script>

<div class="nav">
  <!-- <Month
    fileCache="{fileCache}"
    getSourceSettings="{getSourceSettings}"
    resetdisplayedDate="{resetdisplayedDate}"
    {...eventHandlers}
    on:hoverDay
    on:endHoverDay
  /> -->
  <Month />
  <div class="right-nav">
    <!-- TODO: add tab support -->
    <Arrow
      direction="left"
      onClick="{decrementdisplayedDate}"
      tooltip="Previous Month"
    />
    <button
      aria-label="{!showingCurrentMonth ? 'Reset to current month' : null}"
      class="reset-button"
      class:active="{showingCurrentMonth}"
      on:click="{resetdisplayedDate}"
    >
      <Dot class='h-3 w-3' isFilled={showingCurrentMonth} />
    </button>
    <Arrow
      direction="right"
      onClick="{incrementdisplayedDate}"
      tooltip="Next Month"
    />
  </div>
</div>

<style>
	@tailwind components;
	@tailwind utilities;

  .nav {
    align-items: baseline;
    display: flex;
    margin: 0.6em 0 1em;
    padding: 0 8px;
    width: 100%;
  }

  .right-nav {
    align-items: center;
    display: flex;
    justify-content: center;
    margin-left: auto;
  }

  .reset-button {
    all: inherit;
    cursor: pointer;
    align-items: center;
    color: var(--color-arrow);
    display: flex;
    opacity: 0.4;
    padding: 0.5em;
  }

  .reset-button.active {
    cursor: pointer;
    opacity: 1;
  }
</style>
