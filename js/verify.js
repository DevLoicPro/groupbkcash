// Configuration Supabase
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function () {
    if (!sessionStorage.getItem('fromRegister')) {
        window.location.href = 'register.html';
        return;
    }

    if (window.lucide) lucide.createIcons();

    const verifyForm = document.getElementById('verifyForm');
    const verifyBtn = document.getElementById('verifyBtn');
    const emailInput = document.getElementById('email');
    const codeInput = document.getElementById('code');

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        emailInput.value = decodeURIComponent(emailParam);
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = emailInput.value.trim();
            const code = codeInput.value.trim();

            if (!email || !code) {
                UI.showModal("Champs manquants", "Veuillez remplir tous les champs du formulaire.", "info");
                return;
            }

            const originalBtnContent = verifyBtn.innerHTML;
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<span class="loader"></span> Activation...';

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
