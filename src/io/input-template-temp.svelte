<!-- version a -->
<!-- this may come from the original project I got inspo from -->
<!-- as it uses validateTemplate which I only found on a that project's main.js file -->
<!-- which I'm completely sure is the right file after i found a specific config commment only in that project -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";

  import type { ISettings } from "./index";
  import { FileSuggest } from "../ui/file-suggest";
  import { capitalize } from "../utils";
  import { validateTemplate } from "./validation";

  export let settings: Writable<ISettings>;
  export let periodicity: string;

  let value: string;
  let error: string;
  let inputEl: HTMLInputElement;

  $: value = $settings[periodicity].template || "";

  function validateOnBlur() {
    error = validateTemplate(inputEl.value);
  }

  function clearError() {
    error = "";
  }

  onMount(() => {
    error = validateTemplate(inputEl.value);
    new FileSuggest(window.app, inputEl);
  });
</script>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">{capitalize(periodicity)} Note Template</div>
    <div class="setting-item-description">
      Choose the file to use as a template
    </div>
    {#if error}
      <div class="has-error">{error}</div>
    {/if}
  </div>
  <div class="setting-item-control">
    <input
      bind:this={inputEl}
      bind:value={$settings[periodicity].template}
      class:has-error={!!error}
      type="text"
      spellcheck={false}
      placeholder="Example: folder/note"
      on:change={validateOnBlur}
      on:input={clearError}
    />
  </div>
</div>

<!-- version b (dont know wchich one is the correct) -->
<!-- this might come from a the original project I got inspo from -->
<!-- since it uses displayConfigs from commands whcih I dont remember as part of my project -->
<!-- will have to see if thgere is any recovered commands file though. -->
<script lang="ts">
  import type { App } from "obsidian";
  import { onMount } from "svelte";
  import type { Readable } from "svelte/store";
  import capitalize from "lodash/capitalize";

  import type { Granularity, PeriodicConfig } from "src/types";
  import { FileSuggest } from "src/ui/file-suggest";

  import { validateTemplate } from "../validation";
  import { displayConfigs } from "src/commands";

  export let app: App;
  export let granularity: Granularity;
  export let config: Readable<PeriodicConfig>;

  let error: string;
  let inputEl: HTMLInputElement;

  function validateOnBlur() {
    error = validateTemplate(app, inputEl.value);
  }

  function clearError() {
    error = "";
  }

  onMount(() => {
    error = validateTemplate(app, inputEl.value);
    new FileSuggest(app, inputEl);
  });
</script>

<div class="setting-item">
  <div class="setting-item-info">
    <div class="setting-item-name">
      {capitalize(displayConfigs[granularity].periodicity)} Note Template
    </div>
    <div class="setting-item-description">
      Choose the file to use as a template
    </div>
    {#if error}
      <div class="has-error">{error}</div>
    {/if}
  </div>
  <div class="setting-item-control">
    <input
      class:has-error={!!error}
      type="text"
      spellcheck={false}
      placeholder="e.g. templates/template-file"
      bind:value={$config.templatePath}
      bind:this={inputEl}
      on:change={validateOnBlur}
      on:input={clearError}
    />
  </div>
</div>

<style>
  .setting-item-control input {
    flex-grow: 1;
  }
</style>
