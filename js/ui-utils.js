
// UI Utilities for GroupBKCash
const UI = {
    /**
     * Show a premium notification toast
     * @param {string} message 
     * @param {'success' | 'error' | 'warning' | 'info'} type 
     */
    notify: function (message, type = 'info') {
        const container = document.getElementById('notification-container') || this._createNotificationContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        }[type];

        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    _createNotificationContainer: function () {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Premium Confirm Modal
     */
    confirm: function (title, message, onConfirm) {
        const modalId = 'ui-confirm-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <div class="modal-header">
                        <h2 id="confirm-title"></h2>
                    </div>
                    <div class="modal-body">
                        <p id="confirm-message" style="margin-bottom: 2rem;"></p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <button class="btn btn-secondary" id="confirm-cancel">Annuler</button>
                            <button class="btn btn-primary" id="confirm-ok">Confirmer</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;

        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        const close = () => modal.classList.remove('active');

        okBtn.onclick = () => {
            close();
            onConfirm();
        };

        cancelBtn.onclick = close;

        modal.classList.add('active');
    },

    /**
     * Premium Prompt Modal
     */
    prompt: function (title, message, placeholder, onConfirm) {
        const modalId = 'ui-prompt-modal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2 id="prompt-title"></h2>
                    </div>
                    <div class="modal-body">
                        <p id="prompt-message" style="margin-bottom: 1rem;"></p>
                        <input type="text" class="form-input" id="prompt-input" style="margin-bottom: 2rem;">
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button class="btn btn-secondary" id="prompt-cancel">Annuler</button>
                            <button class="btn btn-primary" id="prompt-ok">Valider</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('prompt-title').textContent = title;
        document.getElementById('prompt-message').textContent = message;
        const input = document.getElementById('prompt-input');
        input.value = '';
        input.placeholder = placeholder || '';

        const okBtn = document.getElementById('prompt-ok');
        const cancelBtn = document.getElementById('prompt-cancel');

        const close = () => modal.classList.remove('active');

        okBtn.onclick = () => {
            const val = input.value;
            if (val !== null && val !== "") {
                close();
                onConfirm(val);
            }
        };

        cancelBtn.onclick = close;

        modal.classList.add('active');
        input.focus();
    }
};
