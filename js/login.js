// La configuration est maintenant dans js/supabase-config.js
// On s'assure qu'il est chargé avant ce script.

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const identifier = document.getElementById('identifier').value.trim();
            const password = document.getElementById('password').value;

            loginBtn.innerHTML = 'Authentification...';
            loginBtn.disabled = true;

            try {
                // 1. Recherche de l'utilisateur dans la table bank_accounts (SANS AUTH)
                let query = _supabase.from('bank_accounts').select('*');

                if (identifier.toUpperCase().startsWith('BK-')) {
                    query = query.eq('client_id', identifier.toUpperCase());
                } else {
                    query = query.eq('email', identifier.toLowerCase());
                }

                const { data: user, error: findError } = await query.maybeSingle();

                if (findError) throw findError;

                // 2. Vérification de l'existence et du mot de passe
                if (!user) {
                    throw new Error('Identifiant non trouvé.');
                }

                if (user.password !== password) {
                    throw new Error('Mot de passe incorrect.');
                }

                // 3. Vérification du statut du compte
                const status = (user.account_status || 'en_attente').toLowerCase();
                if (status === 'en_attente') {
                    throw new Error('Votre compte est toujours en attente de validation administrative.');
                }
                if (status === 'suspendu' || status === 'bloqué') {
                    throw new Error('Votre compte est suspendu ou bloqué. Veuillez contacter un administrateur.');
                }
                if (status !== 'actif') {
                    throw new Error('Le statut de votre compte ne permet pas la connexion (' + status + ').');
                }

                // 4. Session manuelle dans localStorage
                const userRole = (user.role || 'CLIENT').toUpperCase();
                localStorage.setItem('sb_user_email', user.email);
                localStorage.setItem('sb_user_role', userRole);

                // Expiration de 10 minutes
                const expiry = Date.now() + (10 * 60 * 1000);
                localStorage.setItem('sb_session_expiry', expiry.toString());

                UI.notify("Connexion réussie ! Redirection...", "success");

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } catch (error) {
                console.error('Login error:', error);
                UI.notify(error.message || 'Une erreur est survenue lors de la connexion.', "error");
                loginBtn.innerHTML = 'Se connecter';
                loginBtn.disabled = false;
            }
        });
    }
});
