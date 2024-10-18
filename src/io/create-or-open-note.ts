import { granularities } from "@/constants";
import { settingsStore } from "@/settings";
import { activeFileIdStore, notesStores } from "@/stores";
import { createConfirmationDialog } from "@/ui/modals/confirmation";
import { capitalize, getOnCreateNoteDialogNoteFromGranularity, logger } from "@/utils";
import moment, { type Moment } from "moment";
import { Notice, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import { getNoteDateUID, getPeriodicityFromGranularity } from "./parse";
import { getNoteSettings } from "./settings";
import { type IGranularity } from "./types";
import { getNotePath, getTemplateInfo } from "./vault";

const REGEX = (function generateRegex(): RegExp {
    const staticParts = ['title', 'date', 'time', 'currentdate', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dynamicParts = granularities.flatMap(granularity => {
        if (granularity === 'day') {
            return ['yesterday', 'tomorrow'];
        } else {
            return [`prev-${granularity}`, `next-${granularity}`]
        }
    })
    const allParts = [...staticParts, ...dynamicParts].join("|");
    const pattern = `{{\\s*(${allParts})(([+-]\\d+)([yQMwWdhms]))?:?(.*?)?\\s*}}`

    return new RegExp(pattern, "gi")
})()

export async function createOrOpenNote({
    leaf,
    date,
    granularity,
    confirmBeforeCreateOverride = get(settingsStore).shouldConfirmBeforeCreate
}: {
    leaf: WorkspaceLeaf;
    date: Moment;
    granularity: IGranularity;
    confirmBeforeCreateOverride?: boolean;
}) {
    const { selectedFormat, folder } = getNoteSettings()[granularity];
    const filename = date.format(selectedFormat.value);
    const normalizedPath = await getNotePath(folder, filename);
    console.log("[createOrOpenNote()] > normalizedPath: ", normalizedPath);
    let file = window.app.metadataCache.getFirstLinkpathDest(normalizedPath, "")
    console.log("[createOrOpenNote()] > file: ", file);

    async function openFile(file: TFile | null) {
        if (file) {
            file && (await leaf.openFile(file));
            activeFileIdStore.set(getNoteDateUID({ date, granularity }));
        }
    }

    if (file) {
        await openFile(file);
    } else {
        const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
        console.log("[io-create-or-open-note]", granularity, selectedFormat.value, date, filename);

        if (confirmBeforeCreateOverride) {
            createConfirmationDialog({
                title: `New ${periodicity} Note`,
                text: `File ${filename} does not exist. Would you like to create it?`,
                note: getOnCreateNoteDialogNoteFromGranularity(granularity),
                cta: 'Create',
                onAccept: async (dontAskAgain) => {
                    file = await createNote(granularity, date);
                    console.log('createOrOpenNote() > onAccept() > file: ', file);
                    await openFile(file);

                    if (dontAskAgain) {
                        settingsStore.update((settings) => ({
                            ...settings,
                            shouldConfirmBeforeCreate: false
                        }));
                    }
                }
            });
        } else {
            file = await createNote(granularity, date);
            console.log('🤯🔥🤯 createOrOpenNote() > file: 🤯🔥🤯', file);
            await openFile(file);
            console.log('createOrOpenNote() > notesStore: ', get(notesStores[granularity]));
        }
    }
}

async function createNote(granularity: IGranularity, date: Moment) {
    let { templatePath, selectedFormat, folder } = getNoteSettings()[granularity];

    const filename = date.format(selectedFormat.value);
    const normalizedPath = await getNotePath(folder, filename);
    const [templateContents, IFoldInfo] = await getTemplateInfo(templatePath);

    try {
        const createdFile = await window.app.vault.create(
            normalizedPath,
            replaceTemplateContents(date, selectedFormat.value, templateContents)
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.app as any).foldManager.save(createdFile, IFoldInfo);

        return createdFile;
    } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new Notice(`Failed to create file: '${normalizedPath}'`);

        return null
    }
}

/**
 * Replaces date and time placeholders in a template string with formatted date strings.
 * 
 * This function supports various date-related placeholders and allows for date adjustments
 * and custom formatting. It's designed to be flexible and handle a wide range of date and
 * time representation needs in templates.
 * 
 * Supported placeholders:
 * - {{title}}: The main date (usually the note's date)
 * - {{date}}: Same as title
 * - {{time}}: The current time
 * - {{currentDate}}: The current date and time
 * - {{yesterday}}: The day before the main date
 * - {{tomorrow}}: The day after the main date
 * - {{prev-<granularity>}}: The previous <granularity> before the main date
 * - {{next-<granularity>}}: The next <granularity> after the main date
 * - {{weekday}}: Any day of the week (e.g., {{monday}}, {{tuesday}}, etc.)
 * 
 * Each placeholder supports:
 * - Date adjustments: e.g., {{date+1d}}, {{monday-1w}}
 * - Custom formatting: e.g., {{date:YYYY-MM-DD}}, {{time:HH:mm:ss}}
 * 
 * Examples:
 * - Title: {{title}}
* - Date: {{date}}
* - Current time: {{time}}
* - Current date: {{currentDAte:LLLL}}
* - Sunday: {{sunday}}
* - Tomorrow: {{tomorrow:dddd, MMMM Do YYYY}}
* - Crr Week: {{date:w}}
* - Next Week: {{next-week:[locale week]-w, [ISO Week]-W}}
* - Prev Monday: {{monday-1w:LLLL}}
* - Next Quarter: {{next-quarter:}}
 * 
 * @param granularity The granularity of the note (day, week, month, quarter, year)
 * @param date The main date to use for replacements
 * @param defaultFormat The default format to use when no custom format is specified
 * @param template The template string containing placeholders to be replaced
 * @returns The template string with all placeholders replaced by formatted date strings
 */
function replaceTemplateContents(
    date: Moment,
    defaultFormat: string,
    template: string
): string {
    const now = moment();
    const localeWeekdays = (function getLocaleWeekdays(): string[] {
        const { moment } = window;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let weekStart = (<any>moment.localeData())._week.dow;
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        while (weekStart) {
            weekdays.push(weekdays.shift() as string);
            weekStart--;
        }

        return weekdays;
    })()

    return template.replace(REGEX,
        (match, type, adjustment, delta, unit, format) => {
            let momentDate: Moment;
            let modifiedDefaultFormat = defaultFormat;

            switch (type.toLowerCase()) {
                case 'title':
                case 'date':
                    momentDate = date.clone();
                    break;

                case 'time':
                    momentDate = now.clone();
                    modifiedDefaultFormat = 'HH:mm';
                    break;

                case 'currentdate':
                    momentDate = now.clone();
                    break;

                case 'yesterday':
                    momentDate = date.clone().subtract(1, 'day');
                    break;

                case 'tomorrow':
                    momentDate = date.clone().add(1, 'day');
                    break;

                default:
                    if (localeWeekdays.includes(type.toLowerCase())) {
                        // handle weekdays
                        momentDate = date.clone().weekday(localeWeekdays.indexOf(type.toLowerCase()));
                    } else if (type.includes("prev")) {
                        // handle previous granularities
                        const granularity = (type as string).split("-")[1] as IGranularity;
                        momentDate = date.clone().subtract(1, granularity);
                    } else if (type.includes("next")) {
                        // handle next granularities
                        const granularity = (type as string).split("-")[1] as IGranularity;
                        momentDate = date.clone().add(1, granularity);
                    } else {
                        return match; // Return unchanged if not recognized
                    }
                    break;
            }

            if (adjustment) {
                momentDate.add(parseInt(delta, 10), unit as moment.DurationInputArg2);
            }

            return momentDate.format(
                format || modifiedDefaultFormat
            );
        }
    );
}

// Example usage
const exampleTemplate = `
Title: {{title}}
Date: {{date}}
Current time: {{time}}
Current date: {{currentDAte:LLLL}}
Sunday: {{sunday}}
Tomorrow: {{tomorrow:dddd, MMMM Do YYYY}}
Crr Week: {{date:w}}
Next Week: {{next-week:[locale week]-w, [ISO Week]-W}}
Prev Monday: {{monday-1w:LLLL}}
Next Quarter: {{next-quarter:}}

Wrong: {{wrong:W}}
`;

const result = replaceTemplateContents(moment(), 'YYYY-MM-DD', exampleTemplate);
console.log(result);
