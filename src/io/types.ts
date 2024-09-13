export type IGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type IPeriodicity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface IPeriodicNoteSettings {
	folder: string;
	format: string;
	template: string;
}
