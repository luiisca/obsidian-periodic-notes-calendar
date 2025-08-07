# 📅 Periodic Notes Calendar Plugin for Obsidian

Obsidian calendar plugin for writing and organizing periodic notes (daily to
yearly). Navigate via command palette or calendar UI. Summarize entries with
stickers in calendar view. Streamline planning, reviewing, and reflection.

https://github.com/user-attachments/assets/25b380df-3f15-4492-8119-3d95a7604c9e

## Features

- [**Dual Access Methods**](#dual-access-methods): Use the command palette for quick actions or a visual
  calendar UI.
- [**Floating Mode**](#floating-mode): Toggle between a floating overlay view or a standard fixed panel.
- [**Emoji Summaries**](#emoji-summaries): Quickly visualize your day, week, month, or year with
  customizable emoji indicators.
- **Multiple Periodicities**: Support for daily, weekly, monthly, quarterly, and
  yearly notes.
- [**Natural Language Commands**](#create-notes-with-natural-language-dates): Create notes for specific dates using intuitive
  language.
- [**Template Support**](#template-support): Create dynamic notes using `{{}}` placeholders for dates and times with support for natural language inputs (e.g., "next friday"), time adjustments, and custom formatting.
- [**Bulk Management by Format**](#bulk-management-by-format): Perform bulk actions (move, delete, switch formats) for notes organized by user-defined formats.
- **Timeline Quickview**: A mini-calendar displayed at the top of periodic notes, with the option to enable it for all notes.
  It supports unique timelines for each type of periodic note.
- [**Note Preview Panel**](#note-preview-panel): Offers a configurable preview leaf for your notes, periodic and non periodic, supporting vertical or horizontal splits, zen mode for minimal distractions, optional tab headers and more.
  Easily integrates with the calendar view or works in a separate tab.
- **Open notes at startup**: Automatically open or create a periodic note (daily, weekly, monthly, quarterly, or yearly) when launching your vault..
- **Switch Language**: Pick your preferred calendar language in the plugin settings.
- [**Customizable Appearance**](#customization): Modify the plugin's UI to match your style using CSS snippets, with full control over colors, layouts, and elements.

## Usage

### Dual Access Methods 

**Command Palette**

Access the Command Palette (Cmd/Ctrl + P) and type `Periodic notes calendar:`

**Calendar UI**

1. Click the calendar icon in the ribbon or use the command
   `Periodic notes calendar: Toggle calendar interface`
2. Select a date to create or open a note for that day

### Floating Mode

https://github.com/user-attachments/assets/240df1bf-776e-45e5-a247-6bf5ae0bba9c


### Emoji Summaries

Add emoji stickers to your calendar entries to quickly visualize note content or mood. There are two ways to add stickers:

**From the editor**:

Type "#emoji" anywhere in your note (e.g., #🎉). The emoji will automatically appear as a sticker in the calendar view.

**From the calendar**:

1. Right-click on a date
2. Select "Add sticker"
3. Choose an emoji from the picker

Stickers appear above note icons in the calendar, providing a quick visual overview without opening the notes.

### Create notes with Natural Language Dates

Create notes for specific dates using natural language expressions:

1. Open the Command Palette (Cmd/Ctrl + P)
2. Type `Periodic notes calendar: Open periodic note from natural language date`
3. Enter expressions like `next tuesday` or `two months from now`
4. Optionally customize the format (default: YYYY-MM-DD) and periodicity (default: daily)
5. Press Enter to create or open the note

Examples of natural language inputs:

- tomorrow
- in 3 weeks
- last friday

### Template Support

https://github.com/user-attachments/assets/f6072da9-71ba-4a60-a74f-b88ad3316e2f

Templates use `{{}}` placeholders to dynamically insert dates and times. Each placeholder can include an identifier, optional adjustment, and optional format: `{{identifier[±adjustment][:format]}}`.

#### Core Placeholders

- `{{title}}` or `{{date}}`: Note's date
- `{{time}}`: Current time
- `{{currentdate}}`: Current date and time
- `{{monday}}` through `{{sunday}}`: Days of week

#### Natural Language Dates

Supports any date expression [Chrono](https://github.com/wanasit/chrono) can parse:

```
{{tomorrow}}
{{next friday}}
{{2 weeks from now}}
{{end of this month}}
{{5 days ago}}
{{last monday}}
etc
```

#### Date Adjustments

Add/subtract time using `±n[unit]`:

```
{{date+1d}}    // Add one day
{{monday-1w}}  // Subtract one week
```

Units: y(ears), Q(uarters), M(onths), w(eeks), W(eeks ISO), d(ays), h(ours), m(inutes), s(econds)

#### Custom Formatting

Add Moment.js format after colon:

```
{{date:YYYY-MM-DD}}
{{time:HH:mm}}
{{next friday:dddd, MMMM Do}}
```

#### Example Template

```markdown
# {{title:dddd, MMMM Do YYYY}}

Created: {{currentdate:HH:mm}}
Week: {{date:w}}

## Planning

Previous: [[{{5 days ago}}]]
Next: [[{{in 2 weeks}}]]
```

Invalid placeholders remain unchanged for easy debugging. All date expressions respect your locale settings and default formats.


### Bulk Management by Format

https://github.com/user-attachments/assets/cd209f3c-6b54-4ecd-86fb-a9026081d055

1. Go to Settings → Periodic notes calendar → Periods and add your desired formats to the list of recognized formats.
2. Bulk operations are immediately available for all formats in the list. Select a format to access its tools:
   - Left Button: Opens a file management menu that lets you:
        - View and open a list of all files
        - Move, or delete files individually
        - Move or delete all files at once
   - First Right Button: Rename all files from other formats to match this format
   - Last Right Button: Remove this format from the list (existing files remain unchanged).

These features ensure effortless organization and allow you to experiment with new formats without losing control, making it simple to manage and update your periodic notes.
> _**Note**: Bulk operations are limited to files detected under your provided valid formats._

### Note Preview Panel

1. Go to Settings → Periodic notes calendar → Calendar and enable the Preview feature.
2. Configure default settings like split mode, zen mode, and tab header visibility.
3. Navigate to the calendar view, where you'll find an `Open Preview` button. Click it to open a preview panel displaying notes for the currently enabled periods (e.g., day, week, month, quarter, year, or multiple).

### Customization

The plugin's appearance can be extensively customized through CSS variables and selectors. Here's how to get started:

#### Setting Up [CSS Snippets](https://help.obsidian.md/Extending+Obsidian/CSS+snippets)

1. Open Settings.
2. Under Appearance → CSS snippets, select Open snippets folder (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-plus"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>).
3. In the snippets folder, create a CSS file that contains your snippet.
4. In Obsidian, under Appearance → CSS snippets, select Reload snippets (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>) to see the snippet in the list.

> **Tip**: Use a code editor like Visual Studio Code or Sublime Text to ensure your CSS is valid and properly formatted.

#### Available Variables

The plugin uses CSS variables to control colors and styling. All customizations should be wrapped in the #pnc-container selector:

```css
#pnc-container {
    /* Background Colors */
    --color-background-table-header: transparent;

    /* Period Button Background Colors */
    --color-background-day-bttn: transparent;
    --color-background-week-bttn: transparent;
    --color-background-month-bttn: transparent;
    --color-background-quarter-bttn: transparent;
    --color-background-year-bttn: transparent;
    --color-background-weekend: transparent; /* weekend column */

    /* UI Element Colors */
    --color-dot: var(--text-muted);
    --color-arrow: var(--text-muted);

    /* Text Colors */
    --color-text-header-title: var(--text-normal);
    --color-text-table-header: var(--text-muted);
    --color-text-today: var(--interactive-accent);

    /* Period Button Text Colors */
    --color-text-day-bttn: var(--text-normal);
    --color-text-week-bttn: var(--text-muted);
    --color-text-month-bttn: var(--text-normal);
    --color-text-quarter-bttn: var(--text-normal);
    --color-text-year-bttn: var(--text-normal);
}

#pnc-container #timeline-container {
    border: 1px solid green;
}
```
#### Targeting Specific Elements

You can also style specific components using nested selectors:

```css
#pnc-container #timeline-container {
    border: 1px solid green;
}
```

> **Important**: Always prefix your selectors with #pnc-container to prevent style conflicts with other plugins or Obsidian's core styles.

The plugin automatically adapts to your chosen Obsidian theme, but these variables give you fine-grained control over its appearance.
Changes are applied immediately when you save your CSS file—no need to restart Obsidian.

## Installation

<!-- TODO: complete -->
<!-- **From Community Plugins** -->
<!---->
<!-- 1. Open Obsidian and go to Settings → Community Plugins -->
<!-- 2. Disable Safe Mode -->
<!-- 3. Click "Browse" and search for "Periodic notes calendar" -->
<!-- 4. Click "Install", then "Enable" to activate the plugin -->

**BRAT**

1. Install BRAT from Obsidian Community Plugins
2. Open Command Palette and run `BRAT: Add a beta plugin for testing`
3. Enter repository URL: `https://github.com/luiisca/obsidian-periodic-notes-calendar`
4. Wait for installation to complete
5. Enable `Periodic notes calendar` in Settings → Community Plugins

For detailed setup instructions, see [BRAT's quick guide](https://tfthacker.com/brat-quick-guide).

**Manually**

1. Download the [latest release](https://github.com/luiisca/obsidian-periodic-notes-calendar/releases) from Github
2. Extract to `path-to-your-vault/.obsidian/plugins`
3. Enable `Periodic notes calendar` in Settings > community plugins


## Tips and Tricks

### Customizable Emoji Summaries

You can use emojis to provide a quick visual summary of your notes. The plugin
allows you to choose any emoji from the emoji picker dialog. Here are some
examples of how you might use them:

- 😊: A positive day 
- 📝: Significant writing done 
- 🏆: Achieved a goal 
- 🌟: Important day 
- 🎉: Celebration or special event

Feel free to create your own emoji system that works best for your needs!

### Natural Language Date Navigation

In addition to creating notes, you can also use natural language to navigate to
specific dates. Try commands like:

- "Last Friday"
- "Jump to three weeks ago"
- "Next month"

This feature makes it easy to quickly access notes without needing to know the
exact date.

### Rename All Periodic Notes in One Click

If your notes use different formats, like `YYYY-MM-DD` and `YYYY/MM/DD`, and you want to standardize them, follow these steps:

1. Open Settings → Periodic notes calendar → Periods.
2. Add all the formats you’ve used to the list of recognized formats so the plugin can detect them.
3. Click the first button on the right under the format you want to use.

This process works for all periodicities, allowing you to quickly standardize your notes regardless of their original format.

### Open notes in a new pane

`Ctrl/Cmd + Click` on a date to open that note in a new pane.

### Pin commands

Pin frequently used plugin commands for quick access:

1. Go to Settings → Command palette
2. Click the "Select a command ..." input box
3. Type `Periodic notes calendar`
4. Select and pin desired command

For more details, visit [obsidian help](https://help.obsidian.md/Plugins/Command+palette#Pinned+commands).

### Auto-migrate TODO Items

Have your uncompleted tasks automatically move to the next period:

1. Enable preview mode in settings
2. Create a template for your chosen period (daily, weekly, etc.)
3. Define a "TODO" section in your template
4. Add tasks to this section - incomplete items will auto-migrate when the next periodic note is created


## FAQ

### How do I customize the calendar's appearance?
The calendar follows your Obsidian theme.
For custom styling, create a [CSS Snippet](https://help.obsidian.md/Extending+Obsidian/CSS+snippets)
using the variables in the [Customization](#customization) section.

### How do I reopen the calendar if I close it?

Use the Command Palette and search for `Periodic notes calendar: Toggle calendar interface`.

### How do I change the calendar's start day?

Go to Settings → Periodic notes calendar → Calendar → Localization and choose your preferred start day.

### Is this plugin compatible with mobile?

Yes, it works fully on Obsidian Mobile.

## Support

If you encounter any issues or have feature requests, please file them in the
[GitHub Issues](https://github.com/luiisca/obsidian-periodic-notes-calendar/issues)
section.

## Say Thanks 🙏

If you find this plugin helpful, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](ko-fi.com/luiscadillo)
