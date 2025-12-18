import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import { InvalidFormat, View, ViewManager } from '@/ui';
import { MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf, WorkspaceRoot, Platform } from 'obsidian';
import { mount, type SvelteComponent } from 'svelte';
import { get, Subscriber } from 'svelte/store';
import { PluginService } from './app-service';
import { CALENDAR_LUCIDE_ICON, CALENDAR_POPOVER_ID, CALENDAR_RIBBON_ID, granularities, LEAF_TYPE, STICKER_POPOVER_ID } from './constants';
import { basename, createOrOpenNote, extractAndReplaceTODOItems, getFileData, getStartupNoteGranularity, storeAllVaultPeriodicFilepaths } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IGranularity, IPeriodicity } from './io/types';
import { isValidPeriodicNote } from './io/validation';
import {
  activeFileStore,
  displayedDateStore,
  internalFileModStore,
  mainLeafStore,
  pluginClassStore,
  previewLeafStore,
  processingPreviewChangeStore,
  setupLocale,
  spFileDataStore,
  themeStore,
  timelineParentFileStore
} from './stores';
import StickerPopoverComponent from './ui/components/StickerPopover.svelte';
import TimelineManager from './ui/components/timeline/manager';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getBehaviorInstance, getPopoverInstance, Popover } from './ui/popovers';
import { getDailyNotesPlugin } from './utils';
import { CalendarView } from './view';

export default class PeriodicNotesCalendarPlugin extends Plugin {
  popovers: Record<string, SvelteComponent | null> = {};
  popoverAutoUpdateCleanup: (() => void) | null = null;

  onunload() { }

  async onload() {
    PluginService.init(this);

    await this.loadSettings();
    this.registerEvents()

    pluginClassStore.set(this);

    // theme
    themeStore.set(this.getTheme());

    // plugins
    await getDailyNotesPlugin()

    // sub settings
    const unsubSettingsStore = settingsStore.subscribe(this.saveSettings.bind(this))
    this.register(unsubSettingsStore);

    this.addSettingTab(new SettingsTab());

    setupLocale()
    this.handleRibbon();

    // register view and preview
    // register a view under a specific leaf type so obsidian knows to render it when calling `setViewState` with LEAF_TYPE
    this.registerView(LEAF_TYPE, (leaf) => new CalendarView(leaf));

    // Commands
    this.addCommand({
      id: 'toggle-calendar-view',
      name: 'Toggle calendar interface',
      callback: () => {
        this.toggleView().catch(console.error);
        throw new Error('testing error')
      }
    });

    granularities.forEach((granularity) => {
      (['previous', 'next'] as const).forEach((pos) => {
        const periodicity = getPeriodicityFromGranularity(granularity) as Exclude<
          IPeriodicity,
          'daily'
        >;

        let posText:
          | `${typeof pos}-${Exclude<typeof periodicity, 'daily'>}`
          | 'tomorrow'
          | 'yesterday';

        if (granularity === 'day') {
          posText = pos === 'next' ? 'tomorrow' : 'yesterday';
        } else {
          posText = `${pos}-${periodicity}`;
        }

        this.addCommand({
          id: `create-${posText}-note`,
          name: `Open ${granularity === 'day'
            ? `${posText}'s`
            : `${pos} ${getPeriodicityFromGranularity(granularity)}`
            } note`,
          callback: () => {
            const leaf = this.app.workspace.getLeaf(false);
            const newDate = window
              .moment()
              .clone()[pos === 'next' ? 'add' : 'subtract'](1, granularity)
              .startOf(granularity);

            createOrOpenNote({ leaf, date: newDate, granularity, confirmBeforeCreateOverride: false }).catch(console.error);
          }
        });
      });
    });

    this.addCommand({
      id: 'open-nldate-note',
      name: 'Open periodic note from natural language date',
      callback: createNldatePickerDialog,
    });

    this.app.workspace.onLayoutReady(async () => {
      ViewManager.initView({ active: false });
      ViewManager.handleLayoutChange().catch(console.error);
      TimelineManager.initAll();

      if (get(settingsStore).openPopoverOnRibbonHover) {
        Popover.create({
          id: CALENDAR_POPOVER_ID,
          view: {
            Component: View,
            props: {
              popover: true
            }
          }
        });
      }

      // open note at startup
      const startupNoteGranularity = getStartupNoteGranularity();
      if (startupNoteGranularity) {
        await createOrOpenNote({
          leaf: this.app.workspace.getLeaf(),
          date: window.moment(),
          granularity: startupNoteGranularity,
          confirmBeforeCreateOverride: false,
          openInPreview: get(settingsStore).preview.enabled && get(settingsStore).preview.openNotesInPreview
        });
      }

      // index existing notes
      storeAllVaultPeriodicFilepaths(true)
    });
  }

  async loadSettings() {
    const loadedSettings = (await this.loadData()) as ISettings;
    if (!loadedSettings) {
      await this.saveData(DEFAULT_SETTINGS)
    }

    settingsStore.update((old) => {
      const newSettings = { ...old, ...(loadedSettings || {}) };
      const periods = newSettings.periods
      Object.entries(periods).forEach(([granularity, periodSettings]) => {
        Object.values(periodSettings.formats).forEach((format) => {
          periods[granularity as IGranularity].formats[format.id].loading = false
        })
      })
      return {
        ...newSettings,
        preview: {
          ...newSettings.preview,
          splitMode: Platform.isPhone ? false : newSettings.preview.splitMode
        },
        // reset formats loading state
        periods
      }
    });
  }

  /**
    * Persist settings to data.json file
  * @param newSettings new user settings
  */
  saveSettings(newSettings: ISettings) {
    this.saveData(newSettings).catch(console.error);
  }

  handleRibbon() {
    const ribbonEl = this.addRibbonIcon(CALENDAR_LUCIDE_ICON, 'Open calendar', (ev) => {
      const calendarPopover = getPopoverInstance(CALENDAR_POPOVER_ID);
      const calendarBehavior = getBehaviorInstance(CALENDAR_POPOVER_ID);

      if (!get(settingsStore).floatingMode) {
        this.toggleView().catch(console.error);

        if (get(settingsStore).openPopoverOnRibbonHover && calendarBehavior?.opened) {
          calendarBehavior.close();
        }

        return;
      } else {
        const calendarEl = document.querySelector(`#${CALENDAR_POPOVER_ID}[data-popover="true"]`) as HTMLElement | undefined;
        const target = ev.target as Element

        if (
          !calendarEl &&
          !calendarPopover &&
          target
        ) {
          Popover.create({
            id: CALENDAR_POPOVER_ID,
            view: {
              Component: View,
              props: {
                popover: true,
              }
            }
          }).open(target);
        } else {
          calendarPopover?.toggle(target)
        }
      }
    });

    ribbonEl.id = CALENDAR_RIBBON_ID
  }

  async toggleView() {
    /**
     * HTMLElement where View is rendered at
     */
    let leaf = ViewManager.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement };
    const crrSplitPos = ViewManager.getLeafSplitPosition(leaf);
    /**
     * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
     */
    const crrSplit = crrSplitPos && this.app.workspace[`${crrSplitPos}Split`];

    if (!leaf) {
      leaf = ViewManager.initView() as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement };
      const leafActive = leaf.tabHeaderEl.className.includes('is-active');
      if ((crrSplit && 'collapsed' in crrSplit && crrSplit.collapsed) || !leafActive) {
        ViewManager.revealView().catch(console.error);
      }

      return;
    }

    const leafActive = leaf.tabHeaderEl.className.includes('is-active');

    // Scnearios
    // eval root split
    if (crrSplit instanceof WorkspaceRoot) {
      if (leafActive) {
        // a. root split && leaf active
        leaf.view.unload();
        ViewManager.initView({ active: false });
      } else {
        // b. root split && leaf NOT active
        ViewManager.revealView().catch(console.error);
      }

      return;
    }

    // eval left or right split
    // only leftSplit and rightSplit can be collapsed
    if (!crrSplit?.collapsed) {
      if (leafActive) {
        // c. crr split open and leaf active
        crrSplit?.collapse();
      } else {
        // d. crr split open and leaf NOT active
        ViewManager.revealView().catch(console.error);
      }
    } else {
      // e. crr split collapsed
      ViewManager.revealView().catch(console.error);
    }
  }

  public getTheme() {
    return document.body.hasClass('theme-dark') ? 'dark' : 'light'
  }

  registerEvents() {
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => this.onFileMenu(menu, file)))

    this.registerEvent(
      this.app.workspace.on('css-change', () => {
        themeStore.set(this.getTheme())
      })
    )
    this.registerEvent(
      this.app.vault.on('create', (file) => this.onFileCreated(file))
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => this.onFileDeleted(file))
    );
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) =>
        this.onFileRenamed(file, oldPath)
      )
    );
    this.registerEvent(
      this.app.metadataCache.on('changed', () => this.onMetadataChanged())
    )
  }

  private async onFileMenu(_menu: Menu, file: TAbstractFile) {
    if (!(file instanceof TFile)) return;

    const menu = _menu as Menu & { dom: Element; bgEl: Element }

    const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
    const activeCalendarView = PluginService.getPlugin()?.app.workspace.getActiveViewOfType(CalendarView)
    if (typeof isValid === 'boolean' && date && granularity) {
      // Reveal on calendar
      if (!activeCalendarView) {
        menu.addItem((item) =>
          item.setSection("open")
            .setTitle("Reveal on calendar")
            .setIcon("lucide-calendar")
            .onClick(() => {
              ViewManager.revealView().catch(console.error);
              activeFileStore.update((d) => {
                if (d) {
                  d.file = file;
                }
                return d
              })
              displayedDateStore.set(window.moment())
            })
        )
      }
      // Add custom "Add sticker" option
      menu.addItem((item) =>
        item.setSection("action")
          .setTitle("Add sticker")
          .setIcon("lucide-smile-plus")
          .onClick((evt) => {
            evt.preventDefault()
            evt.stopPropagation()

            const fileData = getFileData(granularity, date);
            spFileDataStore.set(fileData);

            if (menu.dom || menu.bgEl) {
              Popover.create({
                id: STICKER_POPOVER_ID,
                view: {
                  Component: StickerPopoverComponent,
                },
              }).open(menu.dom || menu.bgEl)
            }
          })
      );
    }

    // preview

    // Open on preview
    const crrActiveLeaf = PluginService.getPlugin()?.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
    const crrActiveLeafId = crrActiveLeaf?.id;
    const previewLeafId = get(previewLeafStore)?.leaf?.id;
    const crrActiveLeafIsPreview = crrActiveLeafId && previewLeafId && (crrActiveLeafId === previewLeafId)
    if (get(settingsStore).preview.enabled && !crrActiveLeafIsPreview) {
      menu.addItem((item) =>
        item.setSection("open")
          .setTitle("Open in preview panel")
          .setIcon("lucide-eye")
          .onClick(async () => {
            if (!get(mainLeafStore)?.visible) {
              await ViewManager.revealView();
            }
            ViewManager.restartPreview(file, true)
          })
      );
      menu.addItem((item) =>
        item.setSection("open")
          .setTitle("Open in preview panel (right)")
          .setIcon("lucide-eye")
          .onClick(async () => {
            if (!get(mainLeafStore)?.visible) {
              await ViewManager.revealView();
            }
            // TODO: avoid rebuilding the preview leaf, try to `reveal` an exisitng one when possible
            ViewManager.restartPreview(file, true, 'vertical')
          })
      );
      menu.addItem((item) =>
        item.setSection("open")
          .setTitle("Open in preview panel (down)")
          .setIcon("lucide-eye")
          .onClick(async () => {
            if (!get(mainLeafStore)?.visible) {
              await ViewManager.revealView();
            }
            // TODO: avoid rebuilding the preview leaf, try to `reveal` an exisitng one when possible
            ViewManager.restartPreview(file, true, 'horizontal')
          })
      );
    }
  }

  private onFileCreated(file: TAbstractFile) {
    if (!(file instanceof TFile)) return;

    if (get(internalFileModStore) === 'created') return;


    if (this.app.workspace.layoutReady) {
      if (file.extension !== 'md') return;

      const { isValid, date, granularity, format } = isValidPeriodicNote(file.basename);

      if (isValid === false) {
        const fragment = document.createDocumentFragment();
        mount(InvalidFormat, {
          // @ts-ignore
          target: fragment,
          props: {
            granularity,
            filepath: file.path,
            formatValue: format.value,
            error: format.error
          }
        })
        new Notice(fragment, 10000)
      }
      if (typeof isValid === "boolean") {
        settingsStore.addFilepath(file.path, format.value)
        extractAndReplaceTODOItems(date, granularity, file).catch(console.error)
      }
    }
  }

  private async onFileDeleted(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile)) return;

    if (get(internalFileModStore) === 'deleted') return;

    if (this.app.workspace.layoutReady) {
      if (file.extension !== 'md') return;

      const { granularity, format } = isValidPeriodicNote(file.basename);

      if (granularity && format) {
        settingsStore.deleteFilepath(file.path, format.value)
      }
      this.closePreviewOnFileDeleted(file)

      // reset file state
      // this will add some cognitive load for sure
      activeFileStore.set({ file: null, date: null, granularity: null })
      timelineParentFileStore.set(null)
    }
  }

  private async onFileRenamed(renamedFile: TAbstractFile, oldPath: string): Promise<void> {
    if (!(renamedFile instanceof TFile)) return;

    if (get(internalFileModStore) === 'renamed') return;

    const _oldData = isValidPeriodicNote(basename(oldPath));
    const _newData = isValidPeriodicNote(renamedFile.basename);

    if (_newData.isValid === false) {
      const fragment = document.createDocumentFragment();
      mount(InvalidFormat, {
        // @ts-ignore
        target: fragment,
        props: {
          granularity: _newData.granularity,
          filepath: renamedFile.path,
          formatValue: _newData.format.value,
          error: _newData.format.error
        }
      })
      new Notice(fragment, 10000)
    }
    settingsStore.renameFilepath({
      oldData: {
        path: oldPath,
        formatValue: _oldData.format?.value,
        toBeDeleted: typeof _oldData.isValid === "boolean"
      },
      newData: {
        path: renamedFile.path,
        formatValue: _newData.format?.value,
        toBeAdded: typeof _newData.isValid === 'boolean' && renamedFile.extension === 'md'
      }
    })
  }

  private onMetadataChanged() {
    internalFileModStore.set({ modified: Math.random() })
  }

  private closePreviewOnFileDeleted(file: TFile) {
    const previewLeaf = ViewManager.searchPreviewLeaf(file)

    if (previewLeaf) {
      ViewManager.cleanupPreview({ leaf: previewLeaf });
    }
    processingPreviewChangeStore.set(true)
    settingsStore.update((s) => {
      s.preview.open = false;
      return s;
    });
  }
}
