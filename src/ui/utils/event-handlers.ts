import { FILE_MENU_POPOVER_ID } from '@/constants';
import type { IGranularity } from '@/io';
import { createOrOpenNote, getNoteFromStore, getPeriodicityFromGranularity } from "@/io";
import { getNoteSettings } from '@/io/settings';
import { settingsStore } from '@/settings';
import type { Moment } from 'moment';
import { get } from 'svelte/store';
import { Popover } from '../popovers';

type TOnClick = ({
    date,
    createNewSplitLeaf,
    granularity
}: {
    date: Moment;
    createNewSplitLeaf: boolean;
    granularity: IGranularity;
}) => Promise<void>;
type TOnHover = ({
    date,
    targetEl,
    isControlPressed,
    granularity
}: {
    date: Moment;
    targetEl: EventTarget | null;
    isControlPressed: boolean;
    granularity: IGranularity;
}) => void;
type TOnContextMenu = ({
    date,
    event,
    granularity
}: {
    date: Moment;
    event: MouseEvent;
    granularity: IGranularity;
}) => void;

// Component event handlers
const onClick = async ({
    date,
    createNewSplitLeaf,
    granularity
}: Parameters<TOnClick>[0]): Promise<void> => {
    const leaf = window.app.workspace.getLeaf(createNewSplitLeaf);

    createOrOpenNote({ leaf, date, granularity });
};

const onHover = ({
    date,
    targetEl,
    isControlPressed,
    granularity
}: Parameters<TOnHover>[0]): void => {
    const { format } = getNoteSettings()[granularity];
    const note = getNoteFromStore({ date, granularity });

    if (isControlPressed || get(settingsStore).autoHoverPreview) {
        window.app.workspace.trigger('link-hover', targetEl, date.format(format), note?.path);
    }
};

const onContextMenu = ({ date, event, granularity }: Parameters<TOnContextMenu>[0]): void => {
    console.log("🌿 about to show context menu for granularity and date", granularity, date);
    const note = getNoteFromStore({ date, granularity });
    console.log("🌿 note from store: ", note);

    Popover.create({
        id: FILE_MENU_POPOVER_ID
    }).open({ event, note, date, granularity });
};

export const eventHandlers = {
    onClick,
    onHover,
    onContextMenu
}
