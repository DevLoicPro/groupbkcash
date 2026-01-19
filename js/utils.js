// Système de Notification Premium
const UI = {
    showModal: function (title, text, type = 'success', callback = null) {
        // Création de l'overlay s'il n'existe pas
        let overlay = document.querySelector('.custom-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            document.body.appendChild(overlay);
        }

        const icons = {
            success: 'check',
            error: 'x-circle',
            info: 'info'
        };

        const iconName = icons[type] || 'info';

        overlay.innerHTML = `
            <div class="custom-modal">
                <div class="modal-icon ${type}">
                    <i data-lucide="${iconName}"></i>
                </div>
                <h3 class="modal-title">${title}</h3>
                <p class="modal-text text-justify">${text}</p>
                <button class="modal-btn">D'accord</button>
            </div>
        `;

        if (window.lucide) lucide.createIcons();

        // Affichage
        setTimeout(() => overlay.classList.add('active'), 10);

        // Fermeture
        const closeBtn = overlay.querySelector('.modal-btn');
        closeBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                if (callback) callback();
            }, 300);
        };
    }
};
