import { writable } from "svelte/store";
import { DEFAULT_SETTINGS, type ISettings } from "./constants";

function createEnhancedStore(initialValue: ISettings) {
  const { update, set, subscribe } = writable<ISettings>(initialValue);

  const _deleteFilePath = (s: ISettings, filepath: string, formatValue: string) => {
    delete s.filepaths[filepath];
    delete s.filepathsByFormatValue[formatValue]?.[filepath]

    return s
  }
  const _addFilepath = (s: ISettings, filepath: string, formatValue: string) => {
    s.filepaths[filepath] = formatValue;
    if (!(formatValue in s.filepathsByFormatValue)) {
      s.filepathsByFormatValue[formatValue] = {}
    }
    s.filepathsByFormatValue[formatValue]![filepath] = filepath;

    return s
  }

  return {
    update,
    set,
    subscribe,

    addFilepath(filepath: string, formatValue: string) {
      update(s => {
        return _addFilepath(s, filepath, formatValue)
      });
    },

    // getFilepathByPath(filepath: string): string | undefined {
    //   const settings = get(this);
    //   return settings.filepaths[filepath];
    // },
    //
    // getFilepathsByFormat(formatValue: string): Record<string, string> | undefined {
    //   const settings = get(this);
    //   return settings.filepathsByFormatValue[formatValue];
    // },

    renameFilepath({ oldData, newData }: {
      oldData: { path: string; formatValue: string | undefined; toBeDeleted: boolean | null };
      newData: { path: string; formatValue: string | undefined; toBeAdded: boolean | null };
    }) {
      update(s => {
        // Remove old path
        if (oldData.toBeDeleted) {
          s = _deleteFilePath(s, oldData.path, oldData.formatValue!);
        }

        // Add new path
        if (newData.toBeAdded) {
          s = _addFilepath(s, newData.path, newData.formatValue!);
        }

        return s;
      });
    },

    deleteFilepath(filepath: string, formatValue: string) {
      update(s => {
        return _deleteFilePath(s, filepath, formatValue)
      });
    },

    // Bulk operations
    reset() {
      set(DEFAULT_SETTINGS);
    },
  };
}

export const settingsStore = createEnhancedStore(DEFAULT_SETTINGS);
