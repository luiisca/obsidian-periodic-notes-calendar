import { FILE_MENU_POPOVER_ID } from '@/constants';
import type { IGranularity } from '@/io';
import { createOrOpenNote } from "@/io";
import { settingsStore } from '@/settings';
import type { Moment } from 'moment';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { get } from 'svelte/store';
import { Popover } from '../popovers';
import { TFileMenuOpenParams } from '../popovers/file-menu';

type TOnClickParams = {
    date: Moment;
    createNewSplitLeaf: boolean;
    granularity: IGranularity;
    openState?: Record<string, any>;
};
type TOnHoverParams = {
    event: PointerEvent | null;
    isControlPressed: boolean;
    file: TFile | null;
};

// Component event handlers
const onClick = async ({
    date,
    createNewSplitLeaf,
    granularity,
    openState,
}: TOnClickParams): Promise<void> => {
    let leaf: WorkspaceLeaf | null;
    if (get(settingsStore).preview.openNotesInPreview && !createNewSplitLeaf) {
        leaf = null;
    } else {
        leaf = window.app.workspace.getLeaf(createNewSplitLeaf);
    }
    createOrOpenNote({
        leaf,
        date,
        openState,
        granularity,
    });
};

const onHover = ({
    event,
    isControlPressed,
    file,
}: TOnHoverParams): void => {
    if (event && file && (isControlPressed || get(settingsStore).autoHoverPreview)) {
        // https://forum.obsidian.md/t/internal-links-dont-work-in-custom-view/90169/2
        window.app.workspace.trigger("hover-link", {
            event,
            source: "preview",
            hoverParent: { hoverPopover: null },
            targetEl: event.target,
            linktext: file.path,
            sourcePath: file.path,
        });
    }
};

const onContextMenu = ({ event, fileData, date, granularity }: TFileMenuOpenParams): void => {
    Popover.create({
        id: FILE_MENU_POPOVER_ID
    }).open({ event, fileData, date, granularity });
};

export const eventHandlers = {
    onClick,
    onHover,
    onContextMenu
}
