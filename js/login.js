// Configuration Supabase
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
                // Recherche plus flexible : par email OU par Identifiant Client (BK-XXX-XXX)
                const { data: users, error } = await _supabase
                    .from('bank_accounts')
                    .select('*')
                    .or(`email.eq.${identifier.toLowerCase()},client_id.eq.${identifier.toUpperCase()}`);

                if (error || !users || users.length === 0) {
                    throw new Error('Identifiant incorrect.');
                }

                // Pour chaque utilisateur trouvé (normalement un seul), on vérifie le mot de passe
                const user = users.find(u => u.password === password || u.temp_password === password);

                if (!user) {
                    throw new Error('Mot de passe incorrect.');
                }

                // Vérification du statut
                if (user.account_status === 'en_attente') {
                    throw new Error('Votre compte est toujours en attente de validation administrative.');
                }

                if (user.account_status === 'suspendu') {
                    throw new Error('Votre compte a été suspendu par nos services.');
                }

                // Mise à jour de la dernière connexion (optionnel mais recommandé)
                await _supabase
                    .from('bank_accounts')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', user.id);

                // Stockage des informations utilisateur en session pour le dashboard
                sessionStorage.setItem('clientToken', 'BK-AUTH-' + Math.random().toString(36).substr(2, 9));
                sessionStorage.setItem('clientData', JSON.stringify(user));

                // Succès -> Redirection
                window.location.href = 'dashboard.html';

            } catch (error) {
                alert(error.message || 'Une erreur est survenue lors de la connexion.');
                loginBtn.innerHTML = 'Se connecter';
                loginBtn.disabled = false;
            }
        });
    }
});
