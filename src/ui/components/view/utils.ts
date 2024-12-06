import { previewLeafStore } from "@/stores";
import { escapeRegex } from "@/utils";
import { MarkdownView } from "obsidian";
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
