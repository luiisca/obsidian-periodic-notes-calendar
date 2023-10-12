import { Notice } from "obsidian";

export async function fetchWithRetry<T>(
	url: string,
	retries = 0
): Promise<T | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error('Network response was not OK');

		const localesArr = (await response.json()) as T;
		return localesArr;
	} catch (error) {
		if (retries < 3) {
            new Notice(`Something went wrong. Retry ${retries + 1}`)
			return fetchWithRetry(url, retries + 1);
		} else {
            new Notice(`Fetch failed after ${retries} attempts. Using local, possibly outdated locales. Check internet and restart plugin.`)

            return null;
		}
	}
}

export function capitalize(string: string) {
	return string[0].toUpperCase() + string.slice(1).toLowerCase()
}