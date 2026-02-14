<script lang="ts">
  import locales from "@/locales";
  import { defaultWeekdays, sysLocaleKey } from "@/localization";
  import { ISettings, TimelineViewMode } from "@/settings/constants";
  import { settingsStore } from "@/settings/store";
  import { Dropdown, SettingItem, Toggle } from "@/settings/ui";
  import {
    previewLeafStore,
    switchLocale,
    updateWeekStartSetting,
  } from "@/stores";
  import { View, ViewManager } from "@/ui";
  import TimelineManager from "@/ui/components/timeline/manager";
  import { Popover } from "@/ui/popovers";
  import { derived as derivedStore } from "svelte/store";
  import { Platform } from "obsidian";
  import { createCalendarPopover } from "@/ui/popovers/base";
  import { trim } from "@/io";
  import {
    FilepathsCount,
    handlePNMigrate,
    handlePNBackup,
  } from "./sticker-prefix/";

  // Essential
  const handleFloatingModeToggle = (floatingMode: boolean) => {
    Popover.cleanup();

    if (floatingMode) {
      createCalendarPopover({
        view: {
          Component: View,
          props: {
            popover: true,
          },
        },
      });
    }

    settingsStore.update((settings) => ({
      ...settings,
      floatingMode,
    }));
  };
  const handleMinimalModeToggle = (minimalMode: boolean) => {
    settingsStore.update((settings) => ({
      ...settings,
      minimalMode,
    }));
  };

  const handleFloatingAlwaysMinimalToggle = (alwaysMinimal: boolean) => {
    Popover.cleanup();
    createCalendarPopover({
      view: {
        Component: View,
        props: {
          popover: true,
        },
      },
    });

    settingsStore.update((settings) => ({
      ...settings,
      floatingViewAlwaysMinimal: alwaysMinimal,
    }));
  };

  const handleToggleSyncCalendar = (syncCalendar: boolean) => {
    settingsStore.update((s) => {
      s.syncCalendar = syncCalendar;
      return s;
    });
  };

  // Sticker
  let stickerPrefix: string = $state($settingsStore.stickerPrefix);
  const handleStickerPrefixInput = () => {
    settingsStore.update((s) => {
      const newStickerPrefix = trim(stickerPrefix);
      s.lastUsedStickerPrefixes = [
        ...s.lastUsedStickerPrefixes,
        s.stickerPrefix,
      ];
      s.stickerPrefix = newStickerPrefix;
      return s;
    });
  };

  // Preview
  const handleTogglePreview = (enabled: boolean) => {
    settingsStore.update((s) => {
      s.preview.enabled = enabled;
      return s;
    });
    if (!enabled) {
      ViewManager.cleanupPreview();
      ViewManager.cleaunupPreviewEvHandlers();
      previewLeafStore.update((s) => ({
        ...s,
        isOpenBttnVisible: false,
      }));
    } else {
      ViewManager.setupPreviewEvHandlers();
      previewLeafStore.update((s) => ({
        ...s,
        isOpenBttnVisible: true,
      }));
    }
  };
  const handleToggleOpenNotesInPreview = (openNotesInPreview: boolean) => {
    settingsStore.update((s) => {
      s.preview.openNotesInPreview = openNotesInPreview;
      return s;
    });
  };
  const handlePreviewTabHeaderToggle = (tabHeaderVisible: boolean) => {
    settingsStore.update((s) => {
      s.preview.tabHeaderVisible = tabHeaderVisible;
      return s;
    });
    if ($previewLeafStore?.visible) {
      ViewManager.restartPreview();
    }
  };
  const handleSelectDefaultSplitDirection = (
    splitMode: ISettings["preview"]["sideSplitDirection"],
    panel: "side" | "root",
  ) => {
    settingsStore.update((s) => {
      if (panel === "root") {
        s.preview.centerSplitDirection = splitMode;
      } else {
        s.preview.sideSplitDirection = splitMode;
      }
      return s;
    });
    if ($previewLeafStore?.visible) {
      ViewManager.restartPreview();
    }
  };
  const handleSelectDefaultExpansionMode = (
    splitMode: ISettings["preview"]["splitMode"],
  ) => {
    settingsStore.update((s) => {
      s.preview.splitMode = splitMode;
      return s;
    });
    ViewManager.cleanupPreview();
  };
  const handleToggleZenmode = (zenMode: boolean) => {
    settingsStore.update((s) => {
      s.preview.zenMode = zenMode;
      return s;
    });
  };

  // Interactive Behavior
  const handleOpenPopoverOnRibbonHover = (
    openPopoverOnRibbonHover: boolean,
  ) => {
    Popover.cleanup();

    settingsStore.update((settings) => ({
      ...settings,
      openPopoverOnRibbonHover,
    }));

    if (openPopoverOnRibbonHover) {
      createCalendarPopover({
        view: {
          Component: View,
          props: {
            popover: true,
          },
        },
      });
    }
  };

  const handleShouldConfirmBeforeCreate = (
    shouldConfirmBeforeCreate: boolean,
  ) => {
    settingsStore.update((settings) => ({
      ...settings,
      shouldConfirmBeforeCreate,
    }));
  };

  const handleConfirmAutoHoverPreview = (autoHoverPreview: boolean) => {
    settingsStore.update((settings) => ({
      ...settings,
      autoHoverPreview,
    }));
  };

  const handleSequentialDismissalOnClickOut = (
    closePopoversOneByOneOnClickOut: boolean,
  ) => {
    settingsStore.update((settings) => ({
      ...settings,
      popoversClosing: {
        ...settings.popoversClosing,
        closePopoversOneByOneOnClickOut,
      },
    }));
  };
  const handleSequentialDismissalOnEsc = (
    closePopoversOneByOneOnEscKeydown: boolean,
  ) => {
    settingsStore.update((settings) => ({
      ...settings,
      popoversClosing: {
        ...settings.popoversClosing,
        closePopoversOneByOneOnEscKeydown,
      },
    }));
  };

  // Timeline
  const handleToggleTimeline = (enabled: boolean) => {
    settingsStore.update((s) => {
      s.timeline.enabled = enabled;
      return s;
    });
    if (enabled) {
      TimelineManager.create()?.mountAll();
    } else {
      TimelineManager.destroy();
    }
  };

  const handleToggleGranularityBased = (granularityBased: boolean) => {
    settingsStore.update((s) => {
      s.timeline.granularityBased = granularityBased;
      return s;
    });
    TimelineManager.instance?.restartAll();
  };
  const handleSetViewMode = (viewMode: TimelineViewMode) => {
    settingsStore.update((s) => {
      s.timeline.viewMode = viewMode;
      return s;
    });
    TimelineManager.instance?.restartAll();
  };
  const handleToggleDisplayOnRestNotes = (displayOnRestNotes: boolean) => {
    settingsStore.update((s) => {
      s.timeline.displayOnRestNotes = displayOnRestNotes;
      return s;
    });
    TimelineManager.instance?.restartAll();
  };
  const handleToggleDisplayStickers = (displayStickers: boolean) => {
    settingsStore.update((s) => {
      s.timeline.displayStickers = displayStickers;
      return s;
    });
    TimelineManager.instance?.restartAll();
  };
  const handleSetRestViewMode = (restViewMode: TimelineViewMode) => {
    settingsStore.update((s) => {
      s.timeline.restViewMode = restViewMode;
      return s;
    });
    TimelineManager.instance?.restartAll();
  };

  // Localization
  const handleSetLanguage = (localeKey: string) => {
    switchLocale(localeKey);
  };
  const getLanguageOptions = () => {
    let options = [
      {
        label: `Same as system - ${locales.get(sysLocaleKey) || sysLocaleKey}`,
        value: sysLocaleKey,
      },
    ];
    window.moment.locales().forEach((momentLocale) => {
      // use a name like "English" when available in static locales file otherwise use localeKey
      options.push({
        label: locales.get(momentLocale) || momentLocale,
        value: momentLocale,
      });
    });

    return options;
  };

  let firstWeekday = $derived(
    defaultWeekdays[$settingsStore.localeSettings.weekStartId],
  );
  const handleFirstWeekdayChange = (weekday: string) => {
    const newWeekStartId = defaultWeekdays.indexOf(weekday);

    updateWeekStartSetting(newWeekStartId);
  };
  const weekdayOptionsStore = derivedStore(settingsStore, () => {
    let options = [
      {
        label: `Locale default - ${
          window.moment.localeData().weekdays()[
            window.moment.localeData().firstDayOfWeek()
          ]
        }`,
        value: defaultWeekdays[window.moment.localeData().firstDayOfWeek()],
      },
    ];
    window.moment
      .localeData()
      .weekdays()
      .forEach((localizedDay, i) => {
        options.push({
          label: localizedDay,
          value: defaultWeekdays[i],
        });
      });

    return options;
  });
</script>

<!-- ------------------------ -->
<!-- --- Main section ---- -->
<!-- ------------------------ -->
<div class="setting-group">
  <div class="setting-items">
    {#if !Platform.isPhone}
      <SettingItem
        name="Minimal mode"
        description="Use compact layout with simplified visuals."
      >
        {#snippet control()}
          <Toggle
            onChange={handleMinimalModeToggle}
            isEnabled={$settingsStore.minimalMode}
          />
        {/snippet}
      </SettingItem>

      <SettingItem
        name="Floating mode"
        description="Show calendar on ribbon click or hover (always available in panel or through command palette)."
      >
        {#snippet control()}
          <Toggle
            onChange={handleFloatingModeToggle}
            isEnabled={$settingsStore.floatingMode}
          />
        {/snippet}
      </SettingItem>

      {#if $settingsStore.floatingMode}
        <SettingItem
          name="Quick access"
          description="Enable opening the calendar on ribbon hover instead of click."
        >
          {#snippet control()}
            <Toggle
              onChange={handleOpenPopoverOnRibbonHover}
              isEnabled={$settingsStore.openPopoverOnRibbonHover}
            />
          {/snippet}
        </SettingItem>
        <SettingItem
          name="Always minimal"
          description="Keep floating view compact for quick reference."
        >
          {#snippet control()}
            <Toggle
              onChange={handleFloatingAlwaysMinimalToggle}
              isEnabled={$settingsStore.floatingViewAlwaysMinimal}
            />
          {/snippet}
        </SettingItem>
      {/if}
    {/if}

    <SettingItem
      name="Auto-sync calendar date"
      description="Automatically update calendar to display date of current periodic note."
    >
      {#snippet control()}
        <Toggle
          onChange={handleToggleSyncCalendar}
          isEnabled={$settingsStore.syncCalendar}
        />
      {/snippet}
    </SettingItem>
  </div>
</div>

<!-- ------------------------------- -->
<!-- --- Sticker prefix section ---- -->
<!-- ------------------------------- -->
<div class="setting-group">
  <SettingItem isHeading={true} name="Stickers" />
  <div class="setting-items">
    <SettingItem
      name="Sticker prefix"
      description="Prepend text to group new stickers (e.g., 'sticker/')."
    >
      {#snippet control()}
        <input
          class="flex-grow"
          bind:value={stickerPrefix}
          type="text"
          spellcheck={false}
          placeholder="sticker/"
          onblur={handleStickerPrefixInput}
        />
      {/snippet}
    </SettingItem>
    <SettingItem name="Migrate stickers">
      {#snippet description()}
        <span>
          <p>Convert old sticker tags to the new prefix format.</p>
          <FilepathsCount />
        </span>
      {/snippet}
      {#snippet control()}
        <div class="setting-item-control">
          <button
            aria-label="Archive notes before migration"
            onclick={handlePNBackup}>Backup</button
          >
          <button
            class="mod-cta"
            aria-label="Run migration"
            onclick={handlePNMigrate}>Migrate</button
          >
        </div>
      {/snippet}
    </SettingItem>
  </div>
</div>

<!-- ------------------------ -->
<!-- --- Preview section ---- -->
<!-- ------------------------ -->
<div class="setting-group">
  <SettingItem isHeading={true} name="Preview panel" type="toggle">
    {#snippet control()}
      <Toggle
        isEnabled={$settingsStore.preview.enabled}
        onChange={handleTogglePreview}
      />
    {/snippet}
  </SettingItem>

  {#if $settingsStore.preview.enabled}
    <div class="setting-items">
      <!-- FIX: it opens notes at startup in preview panel by default but brakes normal open notes in editor functionality -->
      <!-- TODO: reword to something more descriptive like: "Open notes at -->
      <!-- startup in preview panel by default" -->

      <!-- <SettingItem -->
      <!--   name="Preview calendar notes" -->
      <!--   description="Display opened periodic notes in preview mode by default." -->
      <!-- > -->
      <!--   {#snippet control()} -->
      <!--     <Toggle -->
      <!--       onChange={handleToggleOpenNotesInPreview} -->
      <!--       isEnabled={$settingsStore.preview.openNotesInPreview} -->
      <!--     /> -->
      <!--   {/snippet} -->
      <!-- </SettingItem> -->

      {#if !Platform.isPhone}
        <SettingItem name="Split mode">
          {#snippet description()}
            <span>
              <p class="m-0">
                Force preview opening actions to create a split pane.
              </p>
              <p class="m-0 text-[var(--text-warning)]">
                Note: This may change how panels behave compared to the standard
                view.
              </p>
            </span>
          {/snippet}
          {#snippet control()}
            <Toggle
              onChange={handleSelectDefaultExpansionMode}
              isEnabled={$settingsStore.preview.splitMode}
            />
          {/snippet}
        </SettingItem>

        {#if $settingsStore.preview.splitMode}
          <SettingItem
            name="Preview tab header visibility"
            description="Show/hide the preview pane's tab header when split mode is enabled. (Visible by default)."
          >
            {#snippet control()}
              <Toggle
                onChange={handlePreviewTabHeaderToggle}
                isEnabled={$settingsStore.preview.tabHeaderVisible}
              />
            {/snippet}
          </SettingItem>
          <SettingItem
            name="Editor split direction"
            description="Choose how the preview panel splits within the editor view."
          >
            {#snippet control()}
              <Dropdown
                options={[
                  { label: "Horizontal", value: "horizontal" },
                  { label: "Vertical", value: "vertical" },
                ]}
                onChange={(
                  splitMode: ISettings["preview"]["sideSplitDirection"],
                ) =>
                  splitMode
                    ? handleSelectDefaultSplitDirection(splitMode, "root")
                    : null}
                value={$settingsStore.preview.centerSplitDirection}
              />
            {/snippet}
          </SettingItem>

          <SettingItem
            name="Side view split direction"
            description="Choose how the preview panel splits within the side view."
          >
            {#snippet control()}
              <Dropdown
                options={[
                  { label: "Horizontal", value: "horizontal" },
                  { label: "Vertical", value: "vertical" },
                ]}
                onChange={(
                  splitMode: ISettings["preview"]["sideSplitDirection"],
                ) =>
                  splitMode
                    ? handleSelectDefaultSplitDirection(splitMode, "side")
                    : null}
                value={$settingsStore.preview.sideSplitDirection}
              />
            {/snippet}
          </SettingItem>
        {/if}
      {/if}

      <SettingItem
        name="Zen mode"
        description="Hide the outline and periodic notes navigation buttons for a focused view."
      >
        {#snippet control()}
          <Toggle
            onChange={handleToggleZenmode}
            isEnabled={$settingsStore.preview.zenMode}
          />
        {/snippet}
      </SettingItem>
    </div>
  {/if}
</div>

<!-- -------------------------------- -->
<!-- --- Popover windows section ---- -->
<!-- -------------------------------- -->
{#if $settingsStore.floatingMode && !Platform.isPhone}
  <div class="setting-group">
    <SettingItem isHeading={true} name="Popover windows" />
    <div class="setting-items">
      <SettingItem
        name="Sequential dismissal (click)"
        description="Close floating windows one at a time when clicking outside."
      >
        {#snippet control()}
          <Toggle
            onChange={handleSequentialDismissalOnClickOut}
            isEnabled={$settingsStore.popoversClosing
              .closePopoversOneByOneOnClickOut}
          />
        {/snippet}
      </SettingItem>

      <SettingItem
        name="Sequential dismissal (esc)"
        description="Close floating windows one at a time when pressing Escape."
      >
        {#snippet control()}
          <Toggle
            onChange={handleSequentialDismissalOnEsc}
            isEnabled={$settingsStore.popoversClosing
              .closePopoversOneByOneOnEscKeydown}
          />
        {/snippet}
      </SettingItem>
    </div>
  </div>
{/if}
<!-- ------------------------- -->
<!-- --- Timeline section ---- -->
<!-- ------------------------- -->
<div class="setting-group">
  <SettingItem
    isHeading={true}
    name="Timeline"
    type="toggle"
    description="Quickly jump between time periods from the top of your periodic notes."
  >
    {#snippet control()}
      <Toggle
        onChange={handleToggleTimeline}
        isEnabled={$settingsStore.timeline.enabled}
      />
    {/snippet}
  </SettingItem>

  {#if $settingsStore.timeline.enabled}
    <div class="setting-items">
      <SettingItem
        name="Unique timelines for periodic notes"
        description="Toggle to show a specific timeline for each type of periodic note. When off, all periodic notes share the same week-based timeline."
      >
        {#snippet control()}
          <Toggle
            onChange={handleToggleGranularityBased}
            isEnabled={$settingsStore.timeline.granularityBased}
          />
        {/snippet}
      </SettingItem>
      <SettingItem
        name="Periodic notes timeline view mode"
        description="Set the default display mode for the timeline, either expanded or collapsed."
      >
        {#snippet control()}
          <Dropdown
            options={[
              { label: "Expanded", value: "expanded" },
              { label: "Collapsed", value: "collapsed" },
            ]}
            onChange={handleSetViewMode}
            value={$settingsStore.timeline.viewMode}
          />
        {/snippet}
      </SettingItem>

      <SettingItem
        name="Show timeline everywhere"
        description="Enable the timeline for all notes, not just periodic ones."
      >
        {#snippet control()}
          <Toggle
            onChange={handleToggleDisplayOnRestNotes}
            isEnabled={$settingsStore.timeline.displayOnRestNotes}
          />
        {/snippet}
      </SettingItem>

      <SettingItem
        name="Show timeline stickers"
        description="Show emoji stickers in the timeline view."
      >
        {#snippet control()}
          <Toggle
            onChange={handleToggleDisplayStickers}
            isEnabled={$settingsStore.timeline.displayStickers}
          />
        {/snippet}
      </SettingItem>

      {#if $settingsStore.timeline.displayOnRestNotes}
        <SettingItem
          name="Non-periodic notes timeline view mode"
          description="Set the default display mode for the timeline on non-periodic notes."
        >
          {#snippet control()}
            <Dropdown
              options={[
                { label: "Expanded", value: "expanded" },
                { label: "Collapsed", value: "collapsed" },
              ]}
              onChange={handleSetRestViewMode}
              value={$settingsStore.timeline.restViewMode}
            />
          {/snippet}
        </SettingItem>
      {/if}
    </div>
  {/if}
</div>

<!-- ------------------------------------- -->
<!-- --- Interaction behavior section ---- -->
<!-- ------------------------------------- -->
<div class="setting-group">
  <SettingItem isHeading={true} name="Interaction behavior" />

  <div class="setting-items">
    <SettingItem
      name="Creation confirmation"
      description="Prompt before creating new periodic notes to prevent accidental entries."
    >
      {#snippet control()}
        <Toggle
          onChange={handleShouldConfirmBeforeCreate}
          isEnabled={$settingsStore.shouldConfirmBeforeCreate}
        />
      {/snippet}
    </SettingItem>

    {#if !Platform.isPhone}
      <SettingItem
        name="Hover preview"
        description="Instantly preview notes by hovering over dates (no modifier key needed)."
      >
        {#snippet control()}
          <Toggle
            onChange={handleConfirmAutoHoverPreview}
            isEnabled={$settingsStore.autoHoverPreview}
          />
        {/snippet}
      </SettingItem>
    {/if}
  </div>
</div>

<!-- ------------------------------------- -->
<!-- --- Localization section ---- -->
<!-- ------------------------------------- -->
<div class="setting-group">
  <SettingItem isHeading={true} name="Localization" />
  <div class="setting-items">
    <SettingItem
      name="Calendar language"
      description="Set a specific language for the calendar interface."
    >
      {#snippet control()}
        <Dropdown
          options={getLanguageOptions()}
          onChange={handleSetLanguage}
          value={$settingsStore.localeSettings.localeOverride}
        />
      {/snippet}
    </SettingItem>

    <SettingItem
      name="Week starts on"
      description="Choose which day your week begins with."
    >
      {#snippet control()}
        <Dropdown
          options={$weekdayOptionsStore}
          onChange={handleFirstWeekdayChange}
          value={firstWeekday}
        />
      {/snippet}
    </SettingItem>
  </div>
</div>
