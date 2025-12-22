import 'obsidian';

export type IGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type IPeriodicity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface IPeriodicNoteSettings {
  folder: string;
  format: string;
  template: string;
}

interface IFold {
  from: number;
  to: number;
}
export interface IFoldInfo {
  folds: IFold[];
}

declare module 'obsidian' {
  interface App {
    internalPlugins: {
      getPluginById<T = unknown>(id: string): T | undefined;
    }
    foldManager: {
      load(file: TFile | null): IFoldInfo | null
    }
    plugins: {
      enabledPlugins: Set<string>;
      enablePluginAndSave(id: string): Promise<void>;
      getPlugin(id: string): Plugin | undefined;
    }
  }
  interface Vault {
    getAvailablePath: (path: string, extension: string) => string;
  }

  interface WorkspaceLeaf {
    id: string;
  }
}
