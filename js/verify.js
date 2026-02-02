// La configuration est maintenant dans js/supabase-config.js
// On l'utilise via le client global _supabase

document.addEventListener('DOMContentLoaded', function () {
    if (!sessionStorage.getItem('fromRegister')) {
        window.location.href = 'register.html';
        return;
    }

    if (window.lucide) lucide.createIcons();

    const verifyForm = document.getElementById('verifyForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const codeInput = document.getElementById('code');

    // Récupération de l'email directement depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') ? decodeURIComponent(urlParams.get('email')).trim() : "";

    if (verifyForm) {
        verifyForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const code = codeInput.value.trim();

            if (!email || !code) {
                UI.showModal("Champs manquants", "Le lien est invalide ou le code est manquant.", "info");
                return;
            }

            const originalBtnContent = verifyBtn.innerHTML;
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<span class="loader"></span> Confirmation...';

            try {
                const { data, error } = await _supabase
                    .from('bank_accounts')
                    .select('id, confirmation_code')
                    .eq('email', email)
                    .single();

                if (error || !data) {
                    throw new Error('Utilisateur non trouvé.');
                }

                if (data.confirmation_code !== code) {
                    throw new Error('Le code de confirmation est incorrect.');
                }

                const { error: updateError } = await _supabase
                    .from('bank_accounts')
                    .update({ account_status: 'actif' })
                    .eq('id', data.id);

                if (updateError) throw updateError;

                sessionStorage.removeItem('fromRegister');
                sessionStorage.setItem('fromVerify', 'true');
                window.location.href = 'success.html';

            } catch (error) {
                UI.showModal("Échec de vérification", error.message, "error");
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = originalBtnContent;
            }
        });
    }
});
