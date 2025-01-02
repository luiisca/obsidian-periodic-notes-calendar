import { settingsStore } from "@/settings";
import { previewLeafStore, processingPreviewChangeStore } from "@/stores";
import { ViewManager } from "@/ui";
import { escapeRegex } from "@/utils";
import { MarkdownView, Menu } from "obsidian";
import { get } from "svelte/store";

export function goToNoteHeading({ heading, extra }: { heading?: string | null, extra?: () => void }) {
    const leaf = get(previewLeafStore)?.leaf;
    if (leaf) {
        const markdownView = leaf.view as MarkdownView | undefined;
        const editor = markdownView?.editor as unknown as CodeMirror.Editor | undefined;
        const headingLine = (editor && heading) ? findHeadingLine(editor, heading) : 0;
        extra?.()

        leaf?.setViewState({
            type: "markdown",
            active: true
        })

        if (headingLine === -1) return;

        // Scroll to heading and adjust its position
        editor?.setCursor(headingLine, 0);
        editor?.scrollIntoView({
            from: { line: headingLine, ch: 0 },
            to: { line: headingLine + 1, ch: 0 },
        }, (leaf as any).height / 2);

    }
}

const findHeadingLine = (editor: CodeMirror.Editor, heading: string): number => {
    const lines = editor.lineCount();
    for (let i = 0; i < lines; i++) {
        const regex = new RegExp(`${escapeRegex(heading)}$`);
        if (regex.test(editor.getLine(i).trim())) {
            return i;
        }
    }
    return 0;
}

export const addExtraItems = (menu: Menu) => {
    // close preview
    menu.addItem((item) =>
        item
            .setSection("preview")
            .setTitle("Close preview")
            .setIcon("lucide-x-circle")
            .onClick((ev) => {
                ev.stopPropagation();

                menu.close();

                const leaf = get(previewLeafStore)?.leaf;
                leaf && ViewManager.cleanupPreview({ leaf });
                processingPreviewChangeStore.set(true);
                settingsStore.update((s) => {
                    s.preview.open = false;
                    return s;
                });
            }),
    );

    // Go to main section
    menu.addItem((item) =>
        item
            .setSection("preview")
            .setTitle("Go to main section")
            .setIcon("lucide-compass")
            .onClick((ev) => {
                ev.stopPropagation();

                const crrPreviewGran = get(settingsStore).preview.crrGranularity
                const crrPeriodSettings = crrPreviewGran ? get(settingsStore).periods[crrPreviewGran] : null

                if (crrPreviewGran && crrPeriodSettings) {
                    const mainSection = crrPeriodSettings.preview.mainSection;
                    goToNoteHeading({
                        heading: mainSection,
                        extra: () => menu.close(),
                    });
                }
            }),
    );

    // Go to todo section
    menu.addItem((item) =>
        item
            .setSection("preview")
            .setTitle("Go to todo section")
            .setIcon("lucide-list-todo")
            .onClick((ev) => {
                ev.stopPropagation();

                const crrPreviewGran = get(settingsStore).preview.crrGranularity
                const crrPeriodSettings = crrPreviewGran ? get(settingsStore).periods[crrPreviewGran] : null

                if (crrPreviewGran && crrPeriodSettings) {
                    const todoSection = crrPeriodSettings?.preview.todoSection;
                    goToNoteHeading({
                        heading: todoSection,
                        extra: () => menu.close(),
                    });
                }
            }),
    );

    // Toggle tab header visibility
    if (
        !get(previewLeafStore)?.maximized &&
        get(previewLeafStore)?.splitPos !== "root"
    ) {
        menu.addItem((item) => {
            return item
                .setSection("preview")
                .setTitle("Display tab header")
                .setChecked(get(settingsStore).preview.tabHeaderVisible)
                .setIcon("lucide-layout-panel-top")
                .onClick(() => {
                    settingsStore.update((s) => {
                        s.preview.tabHeaderVisible =
                            !s.preview.tabHeaderVisible;
                        return s;
                    });
                    ViewManager.togglePreviewTabHeader();
                });
        });
    }

    // Toggle Zen mode
    menu.addItem((item) => {
        return item
            .setSection("preview")
            .setTitle("Zen mode")
            .setChecked(get(settingsStore).preview.zenMode)
            .setIcon("lucide-flower")
            .onClick(() => {
                settingsStore.update((s) => {
                    s.preview.zenMode = !s.preview.zenMode;
                    return s;
                });
            });
    });
};

