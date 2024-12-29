import * as chrono from 'chrono-node';
import moment, { type Moment } from "moment";
import type { IGranularity, IPeriodicity } from './types';


export function getPeriodicityFromGranularity(granularity: IGranularity): IPeriodicity {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}

const REGEX = (function generateRegex(): RegExp {
    const staticParts = ['title', 'date', 'time', 'currentdate', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const allParts = [...staticParts];

    return new RegExp(`{{\\s*(${allParts.join("|")}|[^-+:}]+)(([+-])\\s*(\\d+)\\s*([yQMwWdhms])\\s*)?:?([^}]+)?}}`, "gi")
})()

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
 * - {{weekday}}: Any day of the week (e.g., {{monday}}, {{tuesday}}, etc.)
 * - {{natural language date}}: 5 days ago, 2 weeks from now, etc
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
 * - Prev Monday: {{monday-1w:LLLL}}
 * 
 * @param granularity The granularity of the note (day, week, month, quarter, year)
 * @param date The main date to use for replacements
 * @param defaultFormat The default format to use when no custom format is specified
 * @param template The template string containing placeholders to be replaced
 * @returns The template string with all placeholders replaced by formatted date strings
 */
export function replaceTemplateContents(
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
        (match, type) => {
            let momentDate: Moment;
            let modifiedDefaultFormat = defaultFormat;

            const minusIndex = match.indexOf('-');
            const plusIndex = match.indexOf('-');
            const colonIndex = match.indexOf(':');
            let delta = "";
            let unit = "";
            let format = "";

            if ((match.includes('+') && (colonIndex === -1 || plusIndex < colonIndex)) || (match.includes('-') && (colonIndex === -1 || minusIndex < colonIndex))) {
                const pattern = `([+-])\\s*(\\d+)\\s*([yQMwWdhms])\\s*`
                const [, _symbol, _amount, _unit] = match.match(new RegExp(pattern, 'i')) || []
                delta = `${_symbol}${_amount}`
                unit = _unit
            }
            if (match.includes(':')) {
                const pattern = `:([^}]+)`
                const [, _format] = match.match(new RegExp(pattern, 'i')) || []
                format = _format?.trim() || ""
            }

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

                default:
                    if (localeWeekdays.includes(type.toLowerCase())) {
                        // handle weekdays
                        momentDate = date.clone().weekday(localeWeekdays.indexOf(type.toLowerCase()));
                    } else {
                        const parsedUnadjustedDate = parseNlDate(type, date)
                        const parsedDate = parseNlDate(
                            match,
                            date
                        );
                        if (parsedDate?.isValid()) {
                            if (!parsedDate.isSame(parsedUnadjustedDate)) {
                                // avoid adjustment if done by chrono already
                                delta = '';
                            }
                            momentDate = parsedDate;
                        } else {
                            return match; // Return unchanged if not recognized
                        }
                    }
                    break;
            }

            if (delta && unit) {
                momentDate.add(parseInt(delta, 10), unit as moment.DurationInputArg2);
            }

            return momentDate.format(
                format || modifiedDefaultFormat
            );
        }
    );
}

export function parseNlDate(text: string, refMomentDate: Moment = moment()) {
    const refJsDate = refMomentDate.toDate();
    const parsedDate = chrono.parseDate(text, refJsDate);
    if (parsedDate) {
        return moment(parsedDate);
    }
}

// Example usage
// const exampleTemplate = `
//     Title: {{title}}
//     Date: {{date}}
//     Current time: {{time}}
//     Current date: {{currentDAte:LLLL}}
//     Sunday: {{sunday}}
//     Tomorrow: {{tomorrow:dddd, MMMM Do YYYY}}
//     Crr Week: {{date:w}}
//     Next Week: {{next week:[locale week]-w, [ISO Week]-W}}
//     Prev Monday: {{monday-1w:LLLL}}
//     Next Quarter: {{next quarter:}}
//     In 3 days: {{in 3 days}}
//     1 week ago: {{1 week ago}}
//     1 week ago + 1d: {{1 week ago+1d}}
//     2 years from now - 1y: {{2 years from now-1y}}
//     2 years from now - 1y: {{2 years from now +- 1y}}
//     2 years from now - 1y: {{  2 years from now   +  - 1y  : YYYY}}
//
//     Wrong: {{wrong:W}}
// `;

// console.log(replaceTemplateContents(moment(), 'YYYY-MM-DD', exampleTemplate));
