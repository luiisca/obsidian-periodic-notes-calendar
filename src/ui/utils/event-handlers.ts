import { FILE_MENU_POPOVER_ID } from '@/constants';
import type { IGranularity } from '@/io';
import { createOrOpenNote } from "@/io";
import { settingsStore } from '@/settings';
import type { Moment } from 'moment';
import { TFile } from 'obsidian';
import { get } from 'svelte/store';
import { Popover } from '../popovers';
import { TFileMenuOpenParams } from '../popovers/file-menu';

type TOnClickParams = {
    date: Moment;
    createNewSplitLeaf: boolean;
    granularity: IGranularity;
};
type TOnHoverParams = {
    targetEl: EventTarget | null;
    isControlPressed: boolean;
    file: TFile | null;
};

// Component event handlers
const onClick = async ({
    date,
    createNewSplitLeaf,
    granularity
}: TOnClickParams): Promise<void> => {
    const leaf = window.app.workspace.getLeaf(createNewSplitLeaf);

    createOrOpenNote({ leaf, date, granularity });
};

const onHover = ({
    targetEl,
    isControlPressed,
    file,
}: TOnHoverParams): void => {
    if (isControlPressed || get(settingsStore).autoHoverPreview) {
        file && window.app.workspace.trigger('link-hover', targetEl, file.basename, file.path);
    }
};

const onContextMenu = ({ event, fileData, date, granularity }: TFileMenuOpenParams): void => {
    console.log("🤝 about to OPEN FILE MENU", fileData)

    Popover.create({
        id: FILE_MENU_POPOVER_ID
    }).open({ event, fileData, date, granularity });
};

export const eventHandlers = {
    onClick,
    onHover,
    onContextMenu
}
