import { escapeRegex } from "@/utils";
import { MarkdownView, WorkspaceLeaf } from "obsidian";

export function goToNoteHeading({ leaf, heading, extra }: { leaf: WorkspaceLeaf, heading?: string | null, extra?: () => void }) {
    console.log("🤯 goToNoteHeading", leaf, heading, extra)
    const markdownView = leaf.view as MarkdownView | undefined;
    const editor = markdownView?.editor as unknown as CodeMirror.Editor | undefined;
    const headingLine = (editor && heading) ? findHeadingLine(editor, heading) : 0;
    extra?.()

    leaf?.setViewState({
        type: "markdown",
        active: true
    })

    if (headingLine === -1) return;
    editor?.setCursor(headingLine, 0, { scroll: true });
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
