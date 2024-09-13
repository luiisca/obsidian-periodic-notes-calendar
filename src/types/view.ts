import type { IGranularity } from '@/io';
import type { Moment } from 'moment';

export type TOnClick = ({
    date,
    createNewSplitLeaf,
    granularity
}: {
    date: Moment;
    createNewSplitLeaf: boolean;
    granularity: IGranularity;
}) => Promise<void>;
export type TOnHover = ({
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
export type TOnContextMenu = ({
    date,
    event,
    granularity
}: {
    date: Moment;
    event: MouseEvent;
    granularity: IGranularity;
}) => void;

export interface ICalendarViewCtx {
    eventHandlers: {
        onClick: TOnClick;
        onHover: TOnHover;
        onContextMenu: TOnContextMenu;
    };
}
