<script lang="ts">
    import {
        ConfirmationModal,
        IConfirmationDialogParams,
    } from "@/ui/modals/confirmation";

    interface Props {
        config: IConfirmationDialogParams;
        modalClass: ConfirmationModal;
    }

    let { config, modalClass }: Props = $props();

    const { title, text, note, cta, onAccept } = config;

    let dontAskAgain = $state(false);

    const handleCancel = async () => {
        modalClass.close();
    };

    const handleAccept = async () => {
        modalClass.close();

        await onAccept(dontAskAgain);
    };
</script>

<div class="confirmation-modal flex flex-col">
    <div class="modal-header -mt-[0.75em]">
        <div class="modal-title">
            {#if typeof title === "string"}
                {title}
            {:else if title}
                <title.Component {...title.props} />
            {/if}
        </div>
    </div>
    <p class="!mb-1.5">
        {#if typeof text === "string"}
            {text}
        {:else if text}
            <text.Component {...text.props} />
        {/if}
    </p>
    {#if note}
        <p class="!mt-1.5 [font-size:var(--font-ui-small)] text-[--text-muted]">
            {#if typeof note === "string"}
                {note}
            {:else if note}
                <note.Component {...note.props} />
            {/if}
        </p>
    {/if}
    <div class="modal-button-container">
        <label class="mod-checkbox hover:cursor-[var(--cursor)]">
            <input
                type="checkbox"
                class="hover:cursor-[var(--cursor)] text-[14px]"
                bind:checked={dontAskAgain}
            /> Don't ask again
        </label>
        <button onclick={handleCancel}>Never mind</button>
        <button class="mod-cta" onclick={handleAccept}>{cta}</button>
    </div>
</div>
