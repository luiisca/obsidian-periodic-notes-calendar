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

<div class="confirmation-modal">
    <h2>
        {#if typeof title === "string"}
            {title}
        {:else if title}
            <title.Component {...title.props} />
        {/if}
    </h2>
    <p class="!mb-1.5">
        {#if typeof text === "string"}
            {text}
        {:else if text}
            <text.Component {...text.props} />
        {/if}
    </p>
    {#if note}
        <p
            class="m-0 !mt-1.5 [font-size:var(--font-ui-small)] text-[--text-muted]"
        >
            {#if typeof note === "string"}
                {note}
            {:else if note}
                <note.Component {...note.props} />
            {/if}
        </p>
    {/if}
    <label class="flex items-center hover:cursor-pointer mt-3.5">
        <input
            type="checkbox"
            class="hover:cursor-pointer text-[14px]"
            bind:checked={dontAskAgain}
        /> Don't ask again
    </label>
    <div class="modal-button-container mt-3">
        <button onclick={handleCancel}>Never mind</button>
        <button class="mod-cta" onclick={handleAccept}>{cta}</button>
    </div>
</div>
