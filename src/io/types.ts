import 'obsidian';

export type IGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type IPeriodicity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface IPeriodicNoteSettings {
  folder: string;
  format: string;
  template: string;
}

declare module 'obsidian' {
  interface App {
    internalPlugins: {
      getPluginById<T = unknown>(id: string): T | undefined;
    };
  }
}
