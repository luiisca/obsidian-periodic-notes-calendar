<script lang="ts">
    import type {
        ConfirmationModal,
        IConfirmationDialogParams,
    } from "../modals/confirmation";

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

<div>
    <h1>Title h1</h1>
    <h2>Title h2</h2>
    <h2 class="!mt-0">
        {#if typeof title === "string"}
            {title}
        {:else if title}
            <title.Component {...title.props} />
        {/if}
    </h2>
    <p>
        {#if typeof text === "string"}
            {text}
        {:else if text}
            <text.Component {...text.props} />
        {/if}
    </p>
    <label class="flex items-center hover:cursor-pointer mt-7">
        <input
            type="checkbox"
            class="hover:cursor-pointer"
            bind:checked={dontAskAgain}
        /> Don't ask again
    </label>
    {#if note}
        <p
            class="m-0 mt-2 [font-size:var(--font-ui-small)] text-[--text-muted]"
        >
            {#if typeof note === "string"}
                {note}
            {:else if note}
                <note.Component {...note.props} />
            {/if}
        </p>
    {/if}
    <div class="modal-button-container mt-3">
        <button onclick={handleCancel}>Never mind</button>
        <button class="mod-cta" onclick={handleAccept}>{cta}</button>
    </div>
</div>

<style lang="postcss">
    @tailwind utilities;
</style>
