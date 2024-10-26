import { Modal } from "obsidian";

export class ModalManager {
    private static activeModals: Modal[] = [];

    static register(modal: Modal) {
        this.activeModals.push(modal);

        // Remove modal from tracking when it's closed
        const originalClose = modal.close.bind(modal);
        modal.close = () => {
            this.activeModals = this.activeModals.filter(m => m !== modal);
            originalClose();
        };
    }

    static closeAll() {
        this.activeModals.forEach(modal => modal.close());
    }
}
