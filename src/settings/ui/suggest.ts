import { PluginService } from "@/app-service";
import { type TWindowEvents, type WindowEventHandler } from "@/ui/types";
import { autoUpdate, computePosition, flip } from "@floating-ui/dom";
import { debounce, PopoverSuggest, Scope, TAbstractFile, TFile, TFolder } from "obsidian";

interface Suggestion<T> {
    value: T,
    el: HTMLElement,
}

/**
    * Get suggestion values based on `inputEl.value` and render them inside `suggestionContainerEl`,
    * they will only be visible to the user after opening the popover on `this.render()`.
    *
    * Everything is controlled by event handlers added to both `inputEl` and `suggestionContainerEl`, all located in `this.setupEventListeners`
*/
abstract class BaseSuggest<T> extends PopoverSuggest<T> {
    suggestionContainerEl: HTMLDivElement;
    suggestionItemsContainerEl: HTMLDivElement;
    suggestionsContainerCreated: boolean;
    inputEl: HTMLInputElement;
    suggestions: Suggestion<T>[] = [];
    selectedSuggestionIdx: number;
    suggestionSelected = false;

    private inputEvHandlers: TWindowEvents | null = null;
    private autoUpdateCleanup: (() => void) | null = null;

    constructor(inputEl: HTMLInputElement) {
        const app = PluginService.getPlugin()?.app
        if (!app) return;

        super(app);
        this.inputEl = inputEl;
        this.selectedSuggestionIdx = 0
        this.scope = new Scope();

        // create divs and add event handlers. Divs and event handlers removed in `this.destroy()`
        this.suggestionContainerEl = createDiv({
            cls: 'suggestion-container',
        });
        this.suggestionItemsContainerEl = this.suggestionContainerEl.createDiv({
            cls: "suggestion",
        })
        this.suggestionsContainerCreated = true;

        this.setupEventListeners();
    }


    render(...props: any[]) {
        const suggestionValues = this.getSuggestions(this.inputEl.value, ...props)

        if (suggestionValues.length > 0) {
            this.clear()
            // add global event handlers, cleaned in `this.close()`
            PluginService.getPlugin()?.app.keymap.pushScope(this.scope);
            // attached to the DOM, detached in `this.close()`
            PluginService.getPlugin()?.app.workspace.containerEl.appendChild(this.suggestionContainerEl);

            const position = () => computePosition(this.inputEl, this.suggestionContainerEl, {
                placement: "bottom-start",
                middleware: [flip()]
            }).then(({ x, y }) => {
                Object.assign(this.suggestionContainerEl.style, {
                    left: `${x}px`,
                    top: `${y + 5}px`
                });
            });
            this.autoUpdateCleanup = autoUpdate(this.inputEl, this.suggestionContainerEl, () => {
                position();
            })

            this.renderSuggestions(suggestionValues)
        }
    }
    close() {
        // remove global event handlers, added in `this.render()`
        PluginService.getPlugin()?.app.keymap.popScope(this.scope);

        this.clear()
        this.suggestionContainerEl.detach();
        this.autoUpdateCleanup?.();
        this.autoUpdateCleanup = null;
    }
    destroy() {
        this.suggestionContainerEl.remove();
        this.inputEvHandlers && (Object.entries(this.inputEvHandlers) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(([event, handler]) =>
            this.inputEl.removeEventListener(event, handler)
        );
        this.inputEvHandlers = null;
    }
    private clear() {
        this.suggestionItemsContainerEl.empty();
        this.suggestions = [];
    }

    private setupEventListeners() {
        // register input event handlers
        this.inputEvHandlers = {
            click: () => this.render(),
            input: debounce(() => {
                // need to make sure it doesnt reopen popover now that is called 500ms after 
                // input triggered in this.selectSuggestion and after this.close()
                if (!this.suggestionSelected) {
                    this.render()
                } else {
                    this.suggestionSelected = false
                }
            }, 200, true),
            focus: () => this.render(),
            blur: () => this.close(),
        };

        (Object.entries(this.inputEvHandlers) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(([event, handler]) =>
            this.inputEl.addEventListener(event, handler)
        );

        // register global event handlers, loaded in this.setup, cleaned in this.close
        this.scope.register([], "ArrowUp", (ev) => {
            ev.preventDefault()
            this.highlightSuggestion(this.selectedSuggestionIdx - 1, true)
        });
        this.scope.register([], "ArrowDown", (ev) => {
            ev.preventDefault()
            this.highlightSuggestion(this.selectedSuggestionIdx + 1, true)
        })
        this.scope.register([], "Enter", (ev) => {
            ev.preventDefault()
            const suggestion = this.suggestions[this.selectedSuggestionIdx];
            this.selectSuggestion(suggestion.value, ev)
        })
        this.scope.register([], "Escape", () => this.close())

        // register suggestion items container event handlers
        this.suggestionItemsContainerEl.on("click", ".suggestion-item", (ev) => {
            ev.preventDefault()

            const suggestion = this.suggestions[this.selectedSuggestionIdx];
            if (this.selectedSuggestionIdx !== -1 && suggestion) {
                this.highlightSuggestion(this.selectedSuggestionIdx, false);
                this.selectSuggestion(suggestion.value, ev);
            }
        })
        this.suggestionItemsContainerEl.on("mousemove", ".suggestion-item", (ev, target) => {
            ev.preventDefault()

            const suggestionIdx = this.suggestions.findIndex(s => s.el === target)
            if (suggestionIdx !== -1) {
                this.highlightSuggestion(suggestionIdx, false);
            }
        })
        this.suggestionItemsContainerEl.on("mousedown", ".suggestion-item", (ev) => ev.preventDefault())
    }

    /**
        * Get suggestions based on input string and add them inside suggestionContainerEl,
        * they will only be visible to the user after opening the popover on this.render()
        */
    private renderSuggestions(values: T[]) {
        values.forEach(value => {
            const el = this.suggestionItemsContainerEl.createDiv({ cls: 'suggestion-item pnc-suggestion-item' });
            if (el) {
                this.renderSuggestion(value, el);
                this.suggestions.push({ value, el })
            }
        });

        this.selectedSuggestionIdx = 0;
        this.highlightSuggestion(0, false);
    }

    /**
        * update a suggestion element's classes to make it look selected
    */
    private highlightSuggestion(selectedIndex: number, scrollIntoView: boolean) {
        const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);

        const oldSelectedSuggestion = this.suggestions[this.selectedSuggestionIdx];
        const newSelectedSuggestion = this.suggestions[normalizedIndex];

        oldSelectedSuggestion.el.removeClass("is-selected");
        newSelectedSuggestion.el.addClass("is-selected");

        this.selectedSuggestionIdx = normalizedIndex;

        if (scrollIntoView) {
            newSelectedSuggestion.el.scrollIntoView(false);
        }
    }

    abstract getSuggestions(inputVal: string, ...props: any[]): T[];
}

export class FolderSuggest extends BaseSuggest<TFolder> {
    getSuggestions(inputVal: string): TFolder[] {
        const allVaultFiles = PluginService.getPlugin()?.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];

        allVaultFiles?.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFolder &&
                file.path.toLowerCase().contains(inputVal.toLowerCase())
            ) {
                folders.push(file);
            }
        });

        return folders;
    }

    /**
        * Set content of each individual suggestion div element
        *
        * called for each suggestion item from getSuggestions() in renderSuggestions()
    */
    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(value: TFolder, _: KeyboardEvent | MouseEvent): void {
        this.inputEl.value = value.path;
        this.inputEl.trigger("input");
        this.suggestionSelected = true;
        this.close();
    }
}

export class FileSuggest extends BaseSuggest<TFile> {
    getSuggestions(inputVal: string): TFile[] {
        const allVaultFiles = PluginService.getPlugin()?.app.vault.getAllLoadedFiles();
        const files: TFile[] = [];

        allVaultFiles?.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "md" &&
                file.path.toLowerCase().contains(inputVal.toLowerCase())
            ) {
                files.push(file);
            }
        });

        return files;
    }

    /**
        * Set content of each individual suggestion div element
        *
        * called for each suggestion item from getSuggestions() in renderSuggestions()
    */
    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(value: TFile, _: KeyboardEvent | MouseEvent): void {
        this.inputEl.value = value.path;
        this.inputEl.trigger("input");
        this.suggestionSelected = true;
        this.close();
    }
}

export class HeadingsSuggest extends BaseSuggest<string> {
    public headings: string[];
    public noHeadingsFound: boolean;
    public newHeadingVal: string | null = null;
    public templatePath: string;

    update(headings: string[], templatePath: string) {
        if (headings) {
            this.headings = headings;
        }
        if (templatePath) {
            this.templatePath = templatePath;
        }
    }

    getSuggestions(inputVal: string) {
        let filteredHeadings: string[] = [];

        this.headings.forEach((heading) => {
            if (
                heading.toLowerCase().contains(inputVal.toLowerCase())
            ) {
                filteredHeadings.push(heading);
            }
        });
        if (filteredHeadings.length === 0 && inputVal.trim() !== "") {
            this.noHeadingsFound = true;
            this.newHeadingVal = /^#{1,6} /.test(inputVal.trim()) ? inputVal : `# ${inputVal}`;
            filteredHeadings = [`+ Add "${inputVal}" to template headings`];
        } else {
            this.noHeadingsFound = false;
            this.newHeadingVal = null;
        }

        return filteredHeadings;
    }

    /**
        * Set content of each individual suggestion div element
        *
        * called for each suggestion item from getSuggestions() in renderSuggestions()
    */
    renderSuggestion(heading: string, el: HTMLElement): void {
        el.setText(heading);
    }

    async selectSuggestion(heading: string, _: KeyboardEvent | MouseEvent): Promise<void> {
        if (this.noHeadingsFound && heading.startsWith("+ Add")) {
            const file = this.templatePath ? (PluginService.getPlugin()?.app.vault.getAbstractFileByPath(this.templatePath) as TFile) : null;
            if (file) {
                const content = await PluginService.getPlugin()?.app.vault.read(file) ?? ""
                if (this.newHeadingVal) {
                    await PluginService.getPlugin()?.app.vault.modify(file, `${content.trim() === "" ? this.newHeadingVal : `${content.trim()}\n\n${this.newHeadingVal}`}`)

                    const metadataChangeCb = () => {
                        if (this.newHeadingVal) {
                            this.inputEl.value = this.newHeadingVal;
                            this.inputEl.trigger("input");
                            this.suggestionSelected = true;

                            PluginService.getPlugin()?.app.metadataCache.off("changed", metadataChangeCb);
                        }
                    }
                    PluginService.getPlugin()?.app.metadataCache.on("changed", metadataChangeCb);
                }
            }
        } else {
            this.inputEl.value = heading;
            this.inputEl.trigger("input");
            this.suggestionSelected = true;
        }
        this.close();
    }
}

function wrapAround(value: number, size: number): number {
    if (value < 0) {
        return size - 1;
    }
    if (value >= size) {
        return 0
    }
    return value
};

