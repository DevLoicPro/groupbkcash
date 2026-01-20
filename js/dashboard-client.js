/**
 * Logic for Client Dashboard - GROUPBKCASH
 * Integrated with Real Supabase Data
 */

// Configuration Supabase (Reuse same credentials)
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let CLIENT_DATA = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check Auth (Temporairement désactivé pour test)
    const authRecord = sessionStorage.getItem('clientData');
    if (!authRecord) {
        console.warn("Mode Test: Pas de session détectée, chargement de données factices.");
        CLIENT_DATA = {
            id: "MOCK-ID-123",
            first_name: "Client",
            last_name: "PRIVILÈGE",
            email: "test@elite.fr",
            phone: "+33 6 00 00 00 00",
            address: "123 Avenue des Champs-Élysées, Paris",
            balance: 0.00,
            balance_available: 0.00,
            account_status: "actif", // actif / en cours / en attente / désactivé
            card_status: "non_active", // non_active / en_attente / active / suspendue / bloquée
            client_id: "BK-777-999",
            account_number: "9900112233",
            iban: "FR76 3000 6000 0112 3456 7890 123",
            swift: "GRPBFRPP XXX",
            card_number: "4532 •••• •••• 9999",
            card_expiry: "12/28",
            card_cvv: "753",
            card_type: "Visa Infinite Premium",
            card_limit: 15000
        };
    } else {
        CLIENT_DATA = JSON.parse(authRecord);
    }

    initTabs();
    populateUI();
    loadTransactions();

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
});

// --- UI POPULATION (Actions 2, 3, 4, 6) ---
function populateUI() {
    const d = CLIENT_DATA;

    // Header & Greeting
    document.getElementById('clientFirstName').innerText = d.first_name || "Client";
    const badge = document.getElementById('headerStatus');
    const statusText = d.account_status || 'en attente';
    badge.innerText = "Compte " + statusText.charAt(0).toUpperCase() + statusText.slice(1);

    // Status colors
    if (statusText === 'actif') badge.className = 'pill pill-green';
    else if (statusText === 'désactivé') badge.className = 'pill pill-red';
    else badge.className = 'pill pill-orange';


    // Balances (Action 3)
    const bal = d.balance || 0;
    document.getElementById('balancePrimary').innerText = formatEuro(bal);
    document.getElementById('balanceAvailable').innerText = formatEuro(d.balance_available || bal);

    // Card Status
    const cardStatus = d.card_status || 'non_active';
    const overlay = document.getElementById('cardInactiveOverlay');
    const statusMessage = document.getElementById('cardStatusMessage');
    const actionBtn = document.getElementById('cardActionBtn');

    // Card Visual (Action 6) - Display based on status
    if (cardStatus === 'active' || cardStatus === 'actif') {
        // Active card: show real data
        document.getElementById('dispCardNum').innerText = d.card_number || "•••• •••• •••• 1289";
        document.getElementById('dispCardName').innerText = `${d.first_name} ${d.last_name}`.toUpperCase();
        document.getElementById('dispCardExp').innerText = d.card_expiry || "09/27";
        document.getElementById('dispCardType').innerText = d.card_type || "Infinite";
        document.getElementById('dispCardCvv').innerText = d.card_cvv || "123";

        overlay.style.display = 'none';
        statusMessage.innerText = "Votre carte est active et prête à l'emploi.";
        actionBtn.style.display = 'none';
    } else if (cardStatus === 'en_attente') {
        // Pending: show placeholders
        document.getElementById('dispCardNum').innerText = "0000 0000 0000 0000";
        document.getElementById('dispCardName').innerText = "NOM PRÉNOM";
        document.getElementById('dispCardExp').innerText = "00/00";
        document.getElementById('dispCardType').innerText = "...";
        document.getElementById('dispCardCvv').innerText = "...";

        overlay.style.display = 'flex';
        overlay.querySelector('div').innerText = "CARTE EN ATTENTE D'ACTIVATION";
        statusMessage.innerText = "Votre demande d'activation est en cours de traitement.";
        actionBtn.style.display = 'none';
    } else if (cardStatus === 'suspendue' || cardStatus === 'bloquée') {
        // Suspended/Blocked: show placeholders
        document.getElementById('dispCardNum').innerText = "0000 0000 0000 0000";
        document.getElementById('dispCardName').innerText = "NOM PRÉNOM";
        document.getElementById('dispCardExp').innerText = "00/00";
        document.getElementById('dispCardType').innerText = "...";
        document.getElementById('dispCardCvv').innerText = "...";

        overlay.style.display = 'flex';
        overlay.querySelector('div').innerText = "CARTE " + cardStatus.toUpperCase();
        statusMessage.innerText = "Votre carte est actuellement " + cardStatus + ". Contactez le support.";
        actionBtn.style.display = 'none';
    } else {
        // Non-active: show placeholders
        document.getElementById('dispCardNum').innerText = "0000 0000 0000 0000";
        document.getElementById('dispCardName').innerText = "NOM PRÉNOM";
        document.getElementById('dispCardExp').innerText = "00/00";
        document.getElementById('dispCardType').innerText = "...";
        document.getElementById('dispCardCvv').innerText = "...";

        overlay.style.display = 'flex';
        overlay.querySelector('div').innerText = "CARTE BANCAIRE INACTIVE";
        statusMessage.innerText = "Votre carte bancaire n'est pas encore active.";
        actionBtn.style.display = 'inline-flex';
        actionBtn.innerHTML = '<i data-lucide="credit-card" style="width: 18px; height: 18px;"></i> DEMANDER UNE CARTE';
        lucide.createIcons();
    }

    // Read-only Details (Action 2)
    document.getElementById('infoName').innerText = `${d.first_name} ${d.last_name}`;
    document.getElementById('infoStatus').innerText = statusText.toUpperCase();
    document.getElementById('infoClientId').innerText = d.client_id || d.patient_id || "BK-" + d.id.slice(0, 6).toUpperCase();
    document.getElementById('infoAccNum').innerText = d.account_number || "990088" + d.id.slice(0, 4);
    document.getElementById('infoIban').innerText = d.iban || "FR76 3000 6000 0000 0000 000";
    document.getElementById('infoSwift').innerText = d.swift || "GRPBFRPP XXX";

    // Profile Prefill (Action 4) - Editable fields
    document.getElementById('profPhone').value = d.phone || "";
    document.getElementById('profEmail').value = d.email || "";
    document.getElementById('profAddress').value = d.address || "";
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
        alert("Vos coordonnées ont été mises à jour avec succès.");
    } catch (err) {
        // Mock fallback
        CLIENT_DATA = { ...CLIENT_DATA, ...updates };
        sessionStorage.setItem('clientData', JSON.stringify(CLIENT_DATA));
        alert("Mode Test : Coordonnées enregistrées localement.");
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
        alert("Demande d'activation transmise. Les frais de 466€ seront prélevés après validation.");
        closeModal('modalCardRequest');
        CLIENT_DATA.card_status = 'en_attente';
        sessionStorage.setItem('clientData', JSON.stringify(CLIENT_DATA));
        populateUI();
    } catch (err) {
        CLIENT_DATA.card_status = 'en_attente';
        sessionStorage.setItem('clientData', JSON.stringify(CLIENT_DATA));
        populateUI();
        alert("Demande d'activation enregistrée (Mode Test).");
        closeModal('modalCardRequest');
    }
}

// --- TRANSACTIONS (Action 7) ---
async function loadTransactions() {
    const list = document.getElementById('transactionsList');
    list.innerHTML = `
        <div style="text-align: left; padding: 1.2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div><strong style="display:block;">Virement Entrant - Solde Initial</strong><small style="color:var(--text-muted);">20 Janv. 2024 - Complété</small></div>
            <div style="color: var(--status-active); font-weight: 700;">+ ${formatEuro(CLIENT_DATA.balance)}</div>
        </div>
        <div style="text-align: left; padding: 1.2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div><strong style="display:block;">Frais Mensuels</strong><small style="color:var(--text-muted);">15 Janv. 2024 - Complété</small></div>
            <div style="color: #FF4B2B; font-weight: 700;">- ${formatEuro(45.00)}</div>
        </div>
    `;
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
    if (!amount || amount <= 0) return alert("Veuillez saisir un montant valide.");
    document.getElementById('modalTransfer').classList.add('active');
    document.getElementById('step-code').style.display = 'block';
    document.getElementById('step-loading').style.display = 'none';
    document.getElementById('adminTask').style.display = 'none';
}

function verifyTransferCode() {
    const code = document.getElementById('transCode').value;
    if (code.length < 6) return alert("Code de validation invalide.");
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
                        setTimeout(() => {
                            const amount = parseFloat(document.getElementById('transAmount').value);
                            alert("Transfert finalisé. " + formatEuro(amount) + " débités de votre compte.");
                            closeModal('modalTransfer');
                            CLIENT_DATA.balance -= amount;
                            populateUI();
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
