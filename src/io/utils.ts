import { granularities } from "@/constants";
import { settingsStore, TFormat } from "@/settings";
import { normalizePath, Notice, TFile, TFolder, Vault } from "obsidian";
import { get } from "svelte/store";
import { getPeriodicityFromGranularity } from "./parse";
import { getNormalizedPeriodSettings } from "./settings";
import { type IGranularity } from "./types";
import { isValidPeriodicNote } from "./validation";
import { getFileData, modifyFile } from "./vault";
import { PluginService } from "@/app-service";
import { genNoticeFragment } from "@/ui/utils";

export function storeAllVaultPeriodicFilepaths(
  firstRun = false,
  customGranularities = granularities as unknown as IGranularity[],
  customFormats?: Record<string, TFormat>,
) {
  const uniqueFolders: Record<string, IGranularity[]> = {};

  customGranularities.forEach((g) => {
    const { settings: periodSettings } = getNormalizedPeriodSettings(g)
    const periodFolder = periodSettings.folder;

    if (!uniqueFolders[periodFolder]) {
      uniqueFolders[periodFolder] = []
    }
    uniqueFolders[periodFolder].push(g)
  })

  settingsStore.update((s) => {
    if (firstRun) {
      s.filepaths = {};
      s.filepathsByFormatValue = {};
    }

    Object.entries(uniqueFolders).forEach(([uniqueFolder, customGranularities]) => {
      try {
        const notesFolder = PluginService.getPlugin()?.app.vault.getAbstractFileByPath(normalizePath(uniqueFolder));

        if (!notesFolder || !(notesFolder instanceof TFolder)) {
          return new Notice(genNoticeFragment([
            ['Warning: Missing or invalid folders for these periods: '],
            [customGranularities.map((g) => getPeriodicityFromGranularity(g)).join(', '), 'u-pop'],
            ['. \n'],
            ['1. Check your folder paths in plugin settings. \n'],
            ['2. Ensure they exist as actual folders. \n'],
            ['3. Restart Obsidian to apply changes.']
          ]), 10000);
        }

        Vault.recurseChildren(notesFolder, (file) => {
          if (file instanceof TFile) {
            if (file.extension !== 'md') return;

            const { isValid, format } = isValidPeriodicNote(file.basename, customGranularities, customFormats);

            if (typeof isValid === "boolean") {
              s.filepaths[file.path] = format.value;
              if (!(format.value in s.filepathsByFormatValue)) {
                s.filepathsByFormatValue[format.value] = {}
              }
              s.filepathsByFormatValue[format.value]![file.path] = file.path;
            }
          }
        });

      } catch (error) {
        if (typeof error === 'string') {
          new Notice(error)
        };
      }
    })

    return s
  })
}

export function getStartupNoteGranularity() {
  for (const granularity of granularities) {
    const settings = get(settingsStore).periods[granularity]
    if (settings.enabled && settings.openAtStartup) {
      return granularity
    }
  }
}

export async function extractAndReplaceTODOItems(date: moment.Moment, granularity: IGranularity, file: TFile, c = 0) {
  const previewSettings = get(settingsStore).periods[granularity].preview
  if (previewSettings.todoSection.trim() !== "") {
    const app = PluginService.getPlugin()?.app
    const prevPeriodDate = date.clone().subtract(1, granularity);
    const { file: prevPeriodFile } = getFileData(granularity, prevPeriodDate);
    if (prevPeriodFile) {
      const content = await app?.vault.read(prevPeriodFile) ?? ""
      const todos = extractTODOs(content, granularity);

      if (todos.length > 0) {
        const currentFileContent = await app?.vault.read(file) ?? "";
        const updatedContent = appendTODOs(currentFileContent, todos, granularity);

        await modifyFile(file, updatedContent)
      }
    } else {
      if (c < 3) {
        await extractAndReplaceTODOItems(prevPeriodDate, granularity, file, c + 1)
      }
    }
  }
}

function extractTODOs(content: string, granularity: IGranularity): string[] {
  const todoSection = get(settingsStore).periods[granularity].preview.todoSection;
  const lines = content.trim().split('\n');
  const todos: string[] = [];
  let inTODOSection = false;

  for (const line of lines) {
    if (line.trim().startsWith(todoSection)) {
      inTODOSection = true;
      continue;
    }

    // Stop collecting items when hitting the next heading
    if (inTODOSection && /^#{1,6} /.test(line.trim())) {
      break;
    }

    // Collect TODO items that match a checklist pattern
    if (inTODOSection && /^\s*- \[ \]/.test(line.trim())) {
      todos.push(line.trim());
    }
  }

  return todos;
}

function appendTODOs(content: string, todos: string[], granularity: IGranularity): string {
  const todoSection = get(settingsStore).periods[granularity].preview.todoSection;
  const lines = content.trim().split('\n');
  const updatedLines: string[] = [];
  let inTODOSection = false;
  let appended = false;

  if (content.trim() !== "") {
    lines.forEach((line, index) => {
      const nextLine = lines[index + 1] || "";
      updatedLines.push(line);

      if (line.trim().startsWith(todoSection)) {
        inTODOSection = true;
      }

      if (inTODOSection && /^#{1,6} /.test(nextLine.trim())) {
        // ensures todo items are added inmediately before next heading
        if (!appended) {
          updatedLines.push(...todos)
        }
        appended = true;

        return;
      }

      if (index === lines.length - 1) {
        if (!inTODOSection) {
          updatedLines.push(todoSection);
        }
        if (!appended) {
          updatedLines.push(...todos)
        }
        appended = true;

        return;
      }
    })
  } else {
    // If the TODO section doesn't exist, add it at the end
    updatedLines.push(todoSection);
    updatedLines.push(...todos);
  }

  return updatedLines.join('\n');
}
