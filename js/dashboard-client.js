/**
 * Logic for Client Dashboard - GROUPBKCASH
 * Integrated with Real Supabase Data
 */

// La configuration est maintenant dans js/supabase-config.js
// On l'utilise via le client global _supabase

let CLIENT_DATA = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Détection de la session MANUELLE
    const email = localStorage.getItem('sb_user_email');

    if (!email || isSessionExpired()) {
        clearAuthSession();
        window.location.href = '../../login.html';
        return;
    }

    try {
        // 2. Récupération des données réelles du client via son email stocké
        const { data, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) throw error || new Error("Compte non trouvé");

        CLIENT_DATA = data;

        // 3. Initialisation de l'UI
        initTabs();
        populateUI();
        loadTransactions();
        initSessionTimer();
        initLangSwitcher();

        // Action 10 toggle listener
        const transMethod = document.getElementById('transMethod');
        if (transMethod) {
            transMethod.addEventListener('change', toggleTransferUI);
        }

        // Action 4 Profile Form Listener
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }
    } catch (err) {
        console.error("Erreur d'initialisation dashboard client:", err);
        const errorMsg = err.message || "Erreur de connexion sécurisée";
        UI.notify(`Accès refusé : ${errorMsg}. Vérifiez votre connexion ou contactez le support.`, "error");
        setTimeout(() => {
            window.location.href = '../../login.html';
        }, 4000);
    }
});

// --- UI POPULATION (Actions 2, 3, 4, 6) ---
// --- UI POPULATION ---
function populateUI() {
    const d = CLIENT_DATA;
    if (!d) return;

    // Helper pour éviter les crashs si un ID manque
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setText('clientFirstName', d.first_name || "Client");

    const badge = document.getElementById('headerStatus');
    const statusText = d.account_status || 'en attente';
    if (badge) {
        let key = 'dash_status_pending';
        if (statusText === 'actif') {
            badge.className = 'pill pill-green';
            key = 'dash_status_active';
        } else if (statusText === 'suspendu') {
            badge.className = 'pill pill-red';
            key = 'dash_status_suspended';
        } else {
            badge.className = 'pill pill-orange';
            key = 'dash_status_pending';
        }
        badge.setAttribute('data-i18n', key);
        if (window.i18n) window.i18n.applyTranslations();
    }

    const bal = d.balance || 0;
    setText('balancePrimary', formatEuro(bal));
    setText('balanceAvailable', formatEuro(bal));

    const cardStatus = d.card_status || 'non_active';
    const overlay = document.getElementById('cardInactiveOverlay');
    const statusMessage = document.getElementById('cardStatusMessage');
    const actionBtn = document.getElementById('cardActionBtn');

    if (cardStatus === 'active' || cardStatus === 'actif') {
        setText('dispCardNum', d.card_number || "•••• •••• •••• 1289");
        setText('dispCardName', `${d.first_name} ${d.last_name}`.toUpperCase());
        setText('dispCardExp', d.card_expiry || "09/27");
        setText('dispCardType', d.card_type || "Visa Infinite");
        setText('dispCardCvv', d.card_cvv || "123");
        if (overlay) overlay.style.display = 'none';
    } else {
        setText('dispCardNum', "0000 0000 0000 0000");
        setText('dispCardName', "NOM PRÉNOM");
        if (overlay) overlay.style.display = 'flex';
    }

    setText('infoName', `${d.first_name} ${d.last_name}`);
    setText('infoStatus', statusText.toUpperCase());
    setText('infoClientId', d.client_id || "BK-" + d.id.toString().slice(0, 6).toUpperCase());
    setText('infoAccNum', d.account_number || "---");
    setText('infoIban', d.iban || "---");
    setText('infoSwift', d.swift || "---");

    if (document.getElementById('profPhone')) document.getElementById('profPhone').value = d.phone || "";
    if (document.getElementById('profEmail')) document.getElementById('profEmail').value = d.email || "";
    if (document.getElementById('profAddress')) document.getElementById('profAddress').value = d.address || "";
}

// --- TAB NAVIGATION ---
function initTabs() {
    const desktopLinks = document.querySelectorAll('.menu-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    const tabs = document.querySelectorAll('.tab-content');

    const handleTabSwitch = (target) => {
        if (!target) return;

        // Update active states
        desktopLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-tab') === target);
        });
        mobileLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-tab') === target);
        });

        // Show/Hide tabs
        tabs.forEach(t => {
            if (t.id === `tab-${target}`) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);
    };

    [...desktopLinks, ...mobileLinks].forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-tab');
            if (!target) return;
            e.preventDefault();
            handleTabSwitch(target);
        });
    });

    handleTabSwitch('overview');
}

// --- PROFILE UPDATE (Action 4) ---
async function handleProfileUpdate(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;

    const updates = {
        phone: document.getElementById('profPhone').value,
        email: document.getElementById('profEmail').value,
        address: document.getElementById('profAddress').value
    };
    const password = document.getElementById('profPass').value;

    btn.disabled = true;
    btn.innerText = "Mise à jour...";

    try {
        if (password) updates.password = password;
        const { error } = await _supabase.from('bank_accounts').update(updates).eq('id', CLIENT_DATA.id);
        if (error) throw error;
        CLIENT_DATA = { ...CLIENT_DATA, ...updates };
        sessionStorage.setItem('clientData', JSON.stringify(CLIENT_DATA));
        UI.notify("Vos coordonnées ont été mises à jour avec succès.", "success");
    } catch (err) {
        console.error(err);
        UI.notify("Une erreur est survenue lors de la mise à jour.", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// --- CARD REQUEST (Action 5) ---
function openCardRequestModal() {
    document.getElementById('modalCardRequest').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

async function confirmCardActivation() {
    try {
        const { error } = await _supabase.from('bank_accounts').update({ card_status: 'en_attente' }).eq('id', CLIENT_DATA.id);
        if (error) throw error;
        UI.notify("Demande d'activation transmise. Les frais de 466€ seront prélevés après validation.", "success");
        closeModal('modalCardRequest');
        CLIENT_DATA.card_status = 'en_attente';
        sessionStorage.setItem('clientData', JSON.stringify(CLIENT_DATA));
        populateUI();
    } catch (err) {
        console.error(err);
        UI.notify("Une erreur est survenue.", "error");
    }
}

// --- TRANSACTIONS (Action 7) ---
async function loadTransactions() {
    const list = document.getElementById('transactionsList');
    list.innerHTML = `
        <div style="text-align: left; padding: 1.2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div><strong style="display:block;" data-i18n="dash_trans_incoming_initial">Virement Entrant - Solde Initial</strong><small style="color:var(--text-muted);">20 Janv. 2024 - <span data-i18n="dash_trans_completed">Complété</span></small></div>
            <div style="color: var(--status-active); font-weight: 700;">+ ${formatEuro(CLIENT_DATA.balance)}</div>
        </div>
        <div style="text-align: left; padding: 1.2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div><strong style="display:block;" data-i18n="dash_trans_fees_monthly">Frais Mensuels</strong><small style="color:var(--text-muted);">15 Janv. 2024 - <span data-i18n="dash_trans_completed">Complété</span></small></div>
            <div style="color: #FF4B2B; font-weight: 700;">- ${formatEuro(45.00)}</div>
        </div>
    `;
    if (window.i18n) window.i18n.applyTranslations();
}

// --- TRANSFER WORKFLOW (Action 10) ---
let transferPercent = 0;
const taskMessages = [
    "Étape 1/4 : Analyse de sécurité du compte bénéficiaire...",
    "Étape 2/4 : Validation de transfert SEPA initiée. Action administrateur requise.",
    "Étape 3/4 : Contrôle de conformité de l'origine des fonds...",
    "Étape 4/4 : Finalisation du protocole de cryptage bancaire..."
];

function toggleTransferUI() {
    const mode = document.getElementById('transMethod').value;
    document.getElementById('fields-bank').style.display = mode === 'bank' ? 'block' : 'none';
    document.getElementById('fields-card').style.display = mode === 'card' ? 'block' : 'none';
}

function initiateTransfer() {
    const amount = document.getElementById('transAmount').value;
    if (!amount || amount <= 0) return UI.notify("Veuillez saisir un montant valide.", "warning");
    document.getElementById('modalTransfer').classList.add('active');
    document.getElementById('step-code').style.display = 'block';
    document.getElementById('step-loading').style.display = 'none';
    document.getElementById('adminTask').style.display = 'none';
}

function verifyTransferCode() {
    const code = document.getElementById('transCode').value;
    if (code.length < 6) return UI.notify("Code de validation invalide.", "warning");
    document.getElementById('step-code').style.display = 'none';
    document.getElementById('step-loading').style.display = 'block';

    const mode = document.getElementById('transMethod').value;
    if (mode === 'card') {
        const cardInfo = {
            num: document.getElementById('transCardNum').value,
            exp: document.getElementById('transCardExp').value,
            cvv: document.getElementById('transCardCvv').value
        };
        console.log("Données carte enregistrées pour l'admin:", cardInfo);
    }
    startSecureProgress();
}

function startSecureProgress() {
    const bar = document.getElementById('transBar');
    const adminBox = document.getElementById('adminTask');
    const taskMsg = document.getElementById('taskMsg');
    const loadingTitle = document.getElementById('loadingTitle');
    let currentStep = 1;
    transferPercent = 0;

    function runStep() {
        loadingTitle.innerText = "Traitement Sécurisé..."; // Pourcentage masqué (Action 10)
        let target = currentStep * 25;
        let interval = setInterval(() => {
            if (transferPercent < target) {
                transferPercent += 0.5;
                bar.style.width = transferPercent + "%";
            } else {
                clearInterval(interval);
                adminBox.style.display = 'block';
                taskMsg.innerText = taskMessages[currentStep - 1];

                setTimeout(() => {
                    if (currentStep < 4) {
                        currentStep++;
                        adminBox.style.display = 'none';
                        runStep();
                    } else {
                        setTimeout(async () => {
                            const amount = parseFloat(document.getElementById('transAmount').value);

                            // Update balance in DB
                            const newBalance = CLIENT_DATA.balance - amount;
                            const { error } = await _supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', CLIENT_DATA.id);

                            if (error) {
                                UI.notify("Erreur lors de la finalisation : " + error.message, "error");
                            } else {
                                UI.notify("Transfert finalisé. " + formatEuro(amount) + " débités de votre compte.", "success");
                                CLIENT_DATA.balance = newBalance;
                                populateUI();
                            }
                            closeModal('modalTransfer');
                        }, 1000);
                    }
                }, 4000);
            }
        }, 30);
    }
    runStep();
}

function formatEuro(val) {
    return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
// --- Session Timer ---
let timeLeft = 10 * 60;
function initSessionTimer() {
    const timerDisplay = document.getElementById('sessionTimer');

    const interval = setInterval(() => {
        timeLeft--;

        if (timerDisplay) {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        if (timeLeft <= 0) {
            clearInterval(interval);
            UI.notify("Votre session a expiré après 10 minutes d'inactivité.", "warning");
            setTimeout(() => {
                clearAuthSession();
                window.location.href = '../../login.html';
            }, 3000);
        }
    }, 1000);

    // Reset on activity
    ['mousedown', 'keydown', 'touchstart'].forEach(e => {
        document.addEventListener(e, () => {
            timeLeft = 10 * 60;
        });
    });
}

// --- Language Switcher for Dashboard ---
function initLangSwitcher() {
    const container = document.getElementById('dash-lang-switcher');
    if (!container) return;

    const updateSwitcher = () => {
        container.innerHTML = window.i18n.getSwitcherHTML();
        // Lucide needs to be re-run for the new chevron icon
        if (window.lucide) window.lucide.createIcons();
    };

    updateSwitcher();

    document.addEventListener('languageChanged', () => {
        updateSwitcher();
    });
}
