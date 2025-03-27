import type { App } from 'obsidian';

declare global {
    interface Window {
        app: App;
        moment: moment.Moment;
    }
}

export * from './create-or-open-note'
export * from './parse';
export * from './types';
export * from './vault';
export * from './utils';
