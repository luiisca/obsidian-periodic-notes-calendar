import type { IGranularity } from '@/calendar-io';
import type { Moment } from 'moment';

export type TOnClick = ({
	date,
	isNewSplit,
	granularity
}: {
	date: Moment;
	isNewSplit: boolean;
	granularity: IGranularity;
}) => Promise<void>;
export type TOnHover = ({
	date,
	targetEl,
	isMetaPressed,
	granularity
}: {
	date: Moment;
	targetEl: EventTarget | null;
	isMetaPressed: boolean;
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
