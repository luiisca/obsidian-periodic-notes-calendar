import {
    ItemView,
    WorkspaceLeaf
} from 'obsidian';

import { View } from '@/ui';
import { mount, unmount } from "svelte";
import { CALENDAR_LUCIDE_ICON, LEAF_TYPE } from './constants';

export class CalendarView extends ItemView {
    private view: Record<string, any>;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return LEAF_TYPE;
    }

    getDisplayText() {
        return 'Calendar';
    }

    async onOpen() {
        this.view = mount(View, {
            target: this.contentEl
        });
    }

    onClose(): Promise<void> {
        unmount(this.view);

        return Promise.resolve();
    }

    // TODO: might use user defined icon, like day planner plugindoes
    getIcon() {
        return CALENDAR_LUCIDE_ICON;
    }
}
