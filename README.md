# 📅 Obsidian Periodic Notes Calendar Plugin

Obsidian calendar plugin for writing and organizing periodic notes (daily to
yearly). Navigate via command palette or calendar UI. Summarize entries with
stickers in calendar view. Streamline planning, reviewing, and reflection.

![screenshot-full](path_to_your_screenshot.png)

## Features

- **Dual Access Methods**: Use the command palette for quick actions or a visual
  calendar UI.
- **Flexible UI**: Configure the calendar as a floating window or a dedicated
  view.
- **Emoji Summaries**: Quickly visualize your day, week, month, or year with
  customizable emoji indicators.
- **Multiple Periodicities**: Support for daily, weekly, monthly, quarterly, and
  yearly notes.
- **Natural Language Commands**: Create notes for specific dates using intuitive
  language.
- **Template Support**: Create dynamic notes using `{{}}` placeholders for dates and times with support for natural language inputs (e.g., "next friday"), time adjustments, and custom formatting.
- **Customizable**: Tailor the plugin to your workflow with various
  configuration options.
  <!-- TODO: expand -->
- **Bulk Management by Format**: Organize periodic notes by user-defined formats and perform bulk actions like renaming, deleting, or switching formats.
  This feature allows for quick updates and ensures flexibility when experimenting with new formats while maintaining a sense of control.
  _Note: The plugin recognizes files formatted according to the list you provide in settings._

## Usage

### Command Palette

Access the Command Palette (Cmd/Ctrl + P) and type `Periodic Notes Calendar:`

![Command Palette Demo](path_to_command_palette.gif)

### Calendar UI

1. Click the calendar icon in the ribbon or use the command
   `Periodic Notes Calendar: Open Calendar`
2. Select a date to create or open a note for that day

![Calendar UI Demo](path_to_calendar_ui.gif)

### Create notes with Natural Language Dates

You can create notes for specific dates using natural language:

1. Open the Command Palette
2. Type `Periodic Notes Calendar: NLDates`
3. Enter a phrase like "two months from now" or "next Tuesday"
4. The plugin will create a note for the specified date

![NL date creation demo](path_to_calendar_ui.gif)

### Template Support

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

Previous: {{5 days ago}}
Next: {{in 2 weeks}}
```

Invalid placeholders remain unchanged for easy debugging. All date expressions respect your locale settings and default formats.

### Emoji Summaries

Emoji summaries allow you to add visual "stickers" to your notes on the
calendar, providing a quick overview of your entries. There are two ways to add
emoji summaries:

1. From the editor:

   - Type `#emoji-<your-emoji>` anywhere in your note (e.g., `#emoji-🎉`)
   - The plugin will automatically extract the emoji and display it as a sticker
     on the corresponding date in the calendar view

![demo](path_to_calendar_ui.gif)

2. From the calendar:

   - Right-click on any date in the calendar view
   - Select "Add emoji"
   - Choose an emoji from the picker
   - The selected emoji will be added as a sticker for that date on the calendar

![demo](path_to_calendar_ui.gif)

These emoji stickers appear on top of the note icon in the calendar, allowing
you to quickly visualize the content or mood of your entries without opening
them.

### Customization

Override these CSS variables in your `obsidian.css` file for further
customization:

<!-- TODO: ensure they're still relevant -->

```css
body {
  --calendar-bg: var(--background-secondary);
  --calendar-border: var(--background-modifier-border);
  --calendar-color: var(--text-normal);
  --calendar-heading-color: var(--text-muted);
  --calendar-selected-bg: var(--interactive-accent);
  --calendar-selected-color: var(--text-on-accent);
  --calendar-today-bg: var(--interactive-accent-hover);
  --calendar-hover-bg: var(--background-modifier-hover);
}
```

### Bulk Management by Format

1. Go to Settings > Periodic Notes Calendar > Periods and add your desired formats to the list of recognized formats.
2. Bulk operations are immediately available for all formats in the list. Select a format to access its tools:
   - Left Button: Open a list of files using this format, where you can open, delete individually, or delete all files.
   - First Right Button: Rename files in other formats to this one.
   - Last Right Button: Remove this format from the list (existing files remain unchanged).

These features ensure effortless organization and allow you to experiment with new formats without losing control, making it simple to manage and update your periodic notes.

## Installation

1. Open Obsidian and go to Settings > Community Plugins
2. Disable Safe Mode
3. Click "Browse" and search for "Periodic Notes Calendar"
4. Click "Install", then "Enable" to activate the plugin

## Configuration

Go to Settings > Community Plugins > Periodic Notes Calendar to customize:

<!-- TODO: add configuration options -->

- Calendar UI display (floating or view)
- Default note locations for different periodicities
- Date formats
- Emoji summary settings

![Settings Demo](path_to_settings.gif)

## Tips and Tricks

### Customizable Emoji Summaries

You can use emojis to provide a quick visual summary of your notes. The plugin
allows you to choose any emoji from the emoji picker dialog. Here are some
examples of how you might use them:

😊 : A positive day 📝 : Significant writing done 🏆 : Achieved a goal 🌟 :
Important day 🎉 : Celebration or special event

Feel free to create your own emoji system that works best for your needs!

### Natural Language Date Navigation

In addition to creating notes, you can also use natural language to navigate to
specific dates. Try commands like:

<!-- TODO: I dont remember if this command works in that way-->

- "Show me last Friday"
- "Jump to three weeks ago"
- "Open note for next month"

This feature makes it easy to quickly access notes without needing to know the
exact date.

### Rename All Periodic Notes in One Click

If your notes use different formats, like `YYYY-MM-DD` and `YYYY/MM/DD`, and you want to standardize them, follow these steps:

1. Open Settings > Periodic Notes Calendar > Periods.
2. Add all the formats you’ve used to the list of recognized formats so the plugin can detect them.
3. Click the first button on the right under the format you want to use.

This process works for all periodicities, allowing you to quickly standardize your notes regardless of their original format.

### Open notes in a new pane

Ctrl/Cmd + Click on a date to open that note in a new pane.

### Reveal open note on calendar

<!-- TODO: not implemented yet-->

If you open a note from a different month, you might want to see it on the
calendar view. To do so, you can run the command
`Periodic Notes Calendar: Reveal open note on calendar` from the command palette.

### Pin commands

<!-- TODO: reword -->
For easy access to common commands you can pin them, just do ([docs](https://help.obsidian.md/Plugins/Command+palette)):
1. Open Settings.
2. In the sidebar, click Command palette under Plugin options.
3. Next to New pinned command, click Select a command.
4. Type `Periodic Notes Calendar` to see all available commands.
5. Select the command you want to pin from the list.
6. Press Enter.

## FAQ

### How do I change the styling of the Calendar?

By default, the calendar should seamlessly match your theme, but if you'd like
to further customize it, you can! In your `obsidian.css` file (inside your
vault) you can configure the styling to your heart's content.

### I accidentally closed the calendar. How do I reopen it?

If you close the calendar widget (right-clicking on the panel nav and clicking
close), you can always reopen the view from the Command Palette. Just search for
`Calendar: Open view`.

### How do I change the calendar start day?

You can set the start day of the week in the plugin settings.

### Can I use this plugin on mobile?

Yes! The Periodic Notes Calendar plugin is fully compatible with Obsidian
Mobile.

## Support

If you encounter any issues or have feature requests, please file them in the
[GitHub Issues](https://github.com/yourusername/obsidian-periodic-notes-calendar/issues)
section.

## Say Thanks 🙏

If you find this plugin helpful, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](ko-fi.com/luiscadillo)
