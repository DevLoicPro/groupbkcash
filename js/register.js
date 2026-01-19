// Configuration Supabase
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
                income_reported: parseFloat(document.getElementById('income').value),
                security_question: document.getElementById('security_question').value,
                security_answer: document.getElementById('security_answer').value,
                password: password,
                account_status: 'en_attente',
                balance: 0.00,
                is_admin: false,
                confirmation_code: confirmationCode
            };

            try {
                const { error: dbError } = await _supabase.from('bank_accounts').insert([bankData]);
                if (dbError) {
                    if (dbError.code === '23505') throw new Error('Cette adresse e-mail est déjà utilisée.');
                    throw dbError;
                }

                const templateParams = {
                    to_name: firstName + " " + lastName,
                    confirmation_code: confirmationCode,
                    to_email: email,
                    email: email,
                    from_name: "GROUPBKCASH Support"
                };

                try {
                    await emailjs.send("service_k5qggz9", "template_uznxynq", templateParams);
                    sessionStorage.setItem('fromRegister', 'true');
                    UI.showModal("Félicitations", `Un code de confirmation a été envoyé à l'adresse héliportée : ${email}`, "success", () => {
                        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
                    });
                } catch (mailError) {
                    sessionStorage.setItem('fromRegister', 'true');
                    UI.showModal("Compte créé", `L'envoi de l'e-mail a échoué. Veuillez vérifier vos spams ou contacter le support.\n\nVotre code de secours est : ${confirmationCode}`, "info", () => {
                        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;
                    });
                }

            } catch (error) {
                UI.showModal("Erreur", error.message || "Problème technique", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
        });
    }
});
