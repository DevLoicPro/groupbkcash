// La configuration est maintenant dans js/supabase-config.js
// On l'utilise via le client global _supabase

document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) lucide.createIcons();

    const registrationForm = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            emailjs.init("zNpk164s0vsSQH5dW");

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (password !== confirmPassword) {
                UI.showModal("Attention", "Les mots de passe ne correspondent pas.", "error");
                return;
            }

            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loader"></span> Enregistrement...';

            const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const firstName = document.getElementById('first_name').value.trim();
            const lastName = document.getElementById('last_name').value.trim();

            try {
                // 1. On vérifie si l'email existe déjà dans la table
                const { data: existingUser, error: checkError } = await _supabase
                    .from('bank_accounts')
                    .select('email')
                    .eq('email', email)
                    .maybeSingle();

                if (checkError) throw checkError;
                if (existingUser) {
                    throw new Error('Cette adresse e-mail est déjà utilisée.');
                }

                // 2. Préparation des données
                const bankData = {
                    civility: document.getElementById('civility').value,
                    last_name: lastName,
                    first_name: firstName,
                    nationality: document.getElementById('nationality').value,
                    marital_status: document.getElementById('marital_status').value,
                    phone: document.getElementById('phone').value,
                    email: email,
                    address: document.getElementById('address').value,
                    profession: document.getElementById('profession').value,
                    income_reported: parseFloat(document.getElementById('income').value) || 0,
                    security_question: document.getElementById('security_question').value,
                    security_answer: document.getElementById('security_answer').value,
                    password: password,
                    account_status: 'en_attente',
                    balance: 0.00,
                    role: 'CLIENT',
                    confirmation_code: confirmationCode,
                    client_id: `BK-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
                    account_number: `GBK${Math.floor(1000000000 + Math.random() * 9000000000)}`
                };

                const { error: dbError } = await _supabase.from('bank_accounts').insert([bankData]);

                if (dbError) throw dbError;

                // 3. Envoi de l'email de confirmation via EmailJS
                const templateParams = {
                    to_name: firstName + " " + lastName,
                    confirmation_code: confirmationCode,
                    to_email: email,
                    from_name: "GROUPBKCASH Support"
                };

                try {
                    await emailjs.send("service_k5qggz9", "template_uznxynq", templateParams);
                    sessionStorage.setItem('fromRegister', 'true');
                    UI.notify("Demande Envoyée : Un code de vérification vous a été envoyé.", "success");
                    setTimeout(() => {
                        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
                    }, 2000);
                } catch (mailError) {
                    console.error("EmailJS Error:", mailError);
                    sessionStorage.setItem('fromRegister', 'true');
                    UI.notify("Compte Créé : L'envoi de l'email a échoué mais votre dossier est enregistré.", "warning");
                    setTimeout(() => {
                        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
                    }, 2000);
                }

            } catch (error) {
                console.error("Registration Error:", error);
                UI.notify(error.message, "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
    }
});
