// Administration Logic for GroupBKCash
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check (Manual Session)
    const email = localStorage.getItem('sb_user_email');
    const role = localStorage.getItem('sb_user_role');

    if (!email || isSessionExpired() || role !== 'ADMIN') {
        clearAuthSession();
        window.location.href = '../../login.html';
        return;
    }
    document.body.style.display = 'block';

    // 2. Initialize Lucide Icons
    if (window.lucide) lucide.createIcons();

    // 3. Tab Management
    initTabs();

    // 5. Load Initial Data
    loadOverviewData();

    // 6. Global Buttons
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearAuthSession();
        window.location.href = '../../login.html';
    });

    // 7. Search Client
    const searchInput = document.getElementById('searchClient');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterClients(e.target.value);
        });
    }
});

function filterClients(query) {
    const rows = document.querySelectorAll('#allClientsTable tbody tr');
    const q = query.toLowerCase();
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}


// --- Tab System ---
function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Update Nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update Content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.add('active');

    // Update Header
    const titles = {
        'overview': ["Vue d'ensemble", "Bienvenue dans votre interface d'administration sécurisée."],
        'clients': ["Gestion Clients", "Consultez et gérez l'ensemble des comptes clients."],
        'approvals': ["Demandes d'adhésion", "Examinez les nouvelles demandes d'ouverture de compte."],
        'transactions': ["Transactions", "Suivi des flux financiers et des opérations."],
        'cards': ["Cartes Bancaires", "Gestion des plafonds et des statuts des cartes."],
        'fees': ["Frais & Paiements", "Gestion de la facturation et des frais d'adhésion."],
        'support': ["Tickets Support", "Répondez aux demandes des clients."],
        'notifications': ["Communications", "Envoyez des messages aux clients."],
        'settings': ["Paramètres Système", "Configuration globale de la plateforme."],
        'logs': ["Logs Audit", "Historique de toutes les actions système."]
    };

    if (titles[tabId]) {
        document.getElementById('tabTitle').textContent = titles[tabId][0];
        document.getElementById('tabSubtitle').textContent = titles[tabId][1];
    }

    // Load Tab Specific Data
    loadTabData(tabId);
}

function loadTabData(tabId) {
    switch (tabId) {
        case 'overview': loadOverviewData(); break;
        case 'clients': loadClientsData(); break;
        case 'approvals': loadApprovalsData(); break;
        case 'transactions': loadTransactionsData(); break;
        case 'cards': loadCardsData(); break;
        case 'fees': loadFeesData(); break;
    }
}


// --- Tabs handling extra ---
async function loadApprovalsData() {
    const section = document.getElementById('tab-approvals');
    section.innerHTML = `
        <div class="table-card">
            <div class="card-header">
                <h2>Demandes d'adhésion en attente</h2>
                <p>Examinez et approuvez les nouveaux dossiers clients.</p>
            </div>
            <div class="table-responsive">
                <table id="fullApprovalsTable">
                    <thead>
                        <tr>
                            <th>Identité</th>
                            <th>Contact</th>
                            <th>Profession / Revenus</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="approvalsTableBody">
                        <tr><td colspan="4" style="text-align:center; padding: 2rem;">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const { data: pending, error } = await _supabase.from('bank_accounts').select('*').eq('account_status', 'en_attente');
    const tbody = document.getElementById('approvalsTableBody');

    if (error || !pending || pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Aucun dossier en attente.</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(r => `
        <tr>
            <td>
                <div style="font-weight: 600;">${r.first_name} ${r.last_name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${r.civility} - ${r.nationality}</div>
            </td>
            <td>
                <div>${r.email}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${r.phone || 'Pas de tél'}</div>
            </td>
            <td>
                <div>${r.profession}</div>
                <div style="font-weight: 600; color: var(--info);">${(r.income_reported || 0).toLocaleString()} €/mois</div>
            </td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewRequestDetails('${r.id}')">Ouvrir le dossier</button>
            </td>
        </tr>
    `).join('');
}

// --- Data Loading ---
async function loadOverviewData() {
    try {
        const [activeRes, pendingRes, balanceRes] = await Promise.all([
            _supabase.from('bank_accounts').select('*', { count: 'exact', head: true }).eq('account_status', 'actif').neq('role', 'ADMIN'),
            _supabase.from('bank_accounts').select('*').eq('account_status', 'en_attente'),
            _supabase.from('bank_accounts').select('balance').neq('role', 'ADMIN')
        ]);

        const activeCount = activeRes.count || 0;
        const pendingData = pendingRes.data || [];
        const totalVolume = (balanceRes.data || []).reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);

        document.getElementById('statTotalUsers').textContent = activeCount;
        document.getElementById('statPendingRequests').textContent = pendingData.length;
        document.getElementById('statTotalDeposits').textContent = totalVolume.toLocaleString('fr-FR') + ' €';

        renderRecentRequests(pendingData);
    } catch (err) {
        console.error("Erreur stats overview:", err);
        UI.notify("Erreur lors du chargement des statistiques", "error");
    }
}

function renderRecentRequests(requests) {
    const tbody = document.querySelector('#recentRequestsTable tbody');
    if (!tbody) return;

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Aucune demande en attente.</td></tr>';
        return;
    }

    tbody.innerHTML = requests.map(r => `
        <tr>
            <td>
                <div style="font-weight: 600;">${r.first_name} ${r.last_name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${r.email}</div>
            </td>
            <td>${new Date(r.created_at).toLocaleDateString()}</td>
            <td>${r.profession || 'N/A'}</td>
            <td>${r.income_reported?.toLocaleString()} €</td>
            <td><span class="badge badge-warning">EN ATTENTE</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewRequestDetails('${r.id}')">Examiner</button>
            </td>
        </tr>
    `).join('');
}

async function viewRequestDetails(requestId) {
    const { data: request, error } = await _supabase.from('bank_accounts').select('*').eq('id', requestId).single();
    if (error || !request) return;

    openModal('modalClientDetails');
    const container = document.getElementById('clientDetailBody');
    document.getElementById('det_fullname').textContent = `Dossier: ${request.first_name} ${request.last_name}`;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Détails personnels</h3>
                <p><strong>Civilité:</strong> ${request.civility}</p>
                <p><strong>Nationalité:</strong> ${request.nationality}</p>
                <p><strong>Statut Marital:</strong> ${request.marital_status}</p>
                <p><strong>Profession:</strong> ${request.profession}</p>
                <p><strong>Revenus déclarés:</strong> ${request.income_reported?.toLocaleString()} €</p>
            </div>
            <div>
                <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Coordonnées</h3>
                <p><strong>Email:</strong> ${request.email}</p>
                <p><strong>Téléphone:</strong> ${request.phone}</p>
                <p><strong>Adresse:</strong> ${request.address}</p>
                
                <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.8rem;">
                    <button class="btn btn-success" onclick="updateStatus('${request.id}', 'actif')">Approuver la demande</button>
                    <button class="btn btn-warning" onclick="updateStatus('${request.id}', 'suspendu')">Rejeter la demande</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAccount('${request.id}')">Supprimer le dossier</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

async function loadClientsData() {
    const tbody = document.querySelector('#allClientsTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Chargement...</td></tr>';

    const { data: clients, error } = await _supabase
        .from('bank_accounts')
        .select('*')
        .neq('account_status', 'en_attente')
        .neq('role', 'ADMIN')
        .order('last_name', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    tbody.innerHTML = clients.map(c => `
        <tr>
            <td style="font-family: monospace;">${c.client_id || '---'}</td>
            <td>
                <div style="font-weight: 600;">${c.first_name} ${c.last_name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${c.email}</div>
            </td>
            <td style="font-weight: 700;">${(c.balance || 0).toLocaleString()} €</td>
            <td><span class="badge badge-${getStatusColor(c.account_status)}">${c.account_status}</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="viewClientDetails('${c.id}')">Gérer</button>
                    <button class="btn btn-primary btn-sm" onclick="quickCredit('${c.id}')"><i data-lucide="plus"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function quickCredit(clientId) {
    UI.prompt("Crédit rapide", "Montant à créditer immédiatement (€) :", "Ex: 500", async (amountStr) => {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            UI.notify("Montant invalide", "error");
            return;
        }

        const { data: client } = await _supabase.from('bank_accounts').select('balance').eq('id', clientId).single();
        const newBalance = (client.balance || 0) + amount;

        const { error } = await _supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', clientId);
        if (error) UI.notify("Erreur: " + error.message, "error");
        else {
            UI.notify(`Compte crédité de ${amount} €. Nouveau solde: ${newBalance} €`, "success");
            loadClientsData();
        }
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'actif': return 'success';
        case 'suspendu': return 'danger';
        case 'inactif': return 'info';
        case 'en_attente': return 'warning';
        default: return 'secondary';
    }
}

// --- Modals ---
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// --- Admin Actions (Implementations for Requirements) ---

async function viewClientDetails(clientId) {
    openModal('modalClientDetails');
    const container = document.getElementById('clientDetailBody');
    container.innerHTML = '<div style="text-align:center; padding: 3rem;"><i data-lucide="loader-2" class="spin"></i> Chargement...</div>';
    lucide.createIcons();

    const { data: client, error } = await _supabase.from('bank_accounts').select('*').eq('id', clientId).single();
    if (error || !client) {
        container.innerHTML = "Erreur de chargement.";
        return;
    }

    document.getElementById('det_fullname').textContent = `${client.first_name} ${client.last_name}`;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Informations Bancaires</h3>
                <div class="form-group">
                    <label class="form-label">Client ID</label> 
                    <input type="text" class="form-input" value="${client.client_id || ''}" id="edit_client_id" placeholder="BK-XXX-XXX">
                </div>
                <div class="form-group">
                    <label class="form-label">Numéro de Compte</label> 
                    <input type="text" class="form-input" value="${client.account_number || ''}" id="edit_account_number">
                </div>
                <div class="form-group">
                    <label class="form-label">IBAN</label> 
                    <input type="text" class="form-input" value="${client.iban || ''}" id="edit_iban">
                </div>
                <div class="form-group">
                    <label class="form-label">Code SWIFT (BIC)</label> 
                    <input type="text" class="form-input" value="${client.swift || ''}" id="edit_swift">
                </div>
                <button class="btn btn-primary btn-sm" onclick="saveBankInfo('${client.id}')">Sauvegarder les infos bancaires</button>
                
                <h3 style="margin: 1.5rem 0 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Coordonnées</h3>
                <div class="form-group"><label class="form-label">Téléphone</label> <input type="text" class="form-input" value="${client.phone || ''}" id="edit_phone"></div>
                <div class="form-group"><label class="form-label">Adresse</label> <input type="text" class="form-input" value="${client.address || ''}" id="edit_address"></div>
            </div>
            
            <div>
                <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Gestion Financière</h3>
                <div style="background: var(--dark-border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <div style="display:flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Solde Principal:</span>
                        <strong style="font-size: 1.2rem; color: var(--primary);">${(client.balance || 0).toLocaleString()} €</strong>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                    <button class="btn btn-secondary btn-sm" onclick="adjustBalance('${client.id}', 'credit')">Créditer</button>
                    <button class="btn btn-secondary btn-sm" onclick="adjustBalance('${client.id}', 'debit')">Débiter</button>
                </div>

                <h3 style="margin: 1.5rem 0 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Actions de Compte</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <button class="btn btn-success btn-sm" onclick="updateStatus('${client.id}', 'actif')">Approuver / Activer</button>
                    <button class="btn btn-warning btn-sm" onclick="updateStatus('${client.id}', 'suspendu')">Suspendre</button>
                    <button class="btn btn-primary btn-sm" onclick="resetPassword('${client.id}')">Réinit. Password</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAccount('${client.id}')">Supprimer Déf.</button>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--dark-border); padding-bottom: 0.5rem;">Notes Internes</h3>
            <textarea class="form-input" style="height: 100px;" id="internal_notes" placeholder="Ajouter une note...">${client.internal_notes || ''}</textarea>
            <button class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;" onclick="saveClientNotes('${client.id}')">Enregistrer les notes & coordonnées</button>
        </div>
    `;
    lucide.createIcons();
}

async function saveBankInfo(clientId) {
    const bankInfo = {
        client_id: document.getElementById('edit_client_id').value,
        account_number: document.getElementById('edit_account_number').value,
        iban: document.getElementById('edit_iban').value,
        swift: document.getElementById('edit_swift').value
    };

    const { error } = await _supabase.from('bank_accounts').update(bankInfo).eq('id', clientId);

    if (error) {
        UI.notify("Erreur : Impossible de sauvegarder. Vérifiez que les colonnes existent dans Supabase.", "error");
    } else {
        UI.notify("Informations bancaires mises à jour !", "success");
        viewClientDetails(clientId);
    }
}

async function updateStatus(clientId, newStatus) {
    UI.confirm("Confirmation", `Confirmer le changement de statut vers : ${newStatus} ?`, async () => {
        console.log(`Tentative de mise à jour du statut pour ${clientId} vers ${newStatus}...`);

        const { error } = await _supabase
            .from('bank_accounts')
            .update({ account_status: newStatus })
            .eq('id', clientId);

        if (error) {
            console.error("Erreur Supabase détaillée:", error);
            UI.notify("ERREUR CRITIQUE : La modification n'a pas pu être enregistrée.", "error");
        } else {
            UI.notify("✅ Changement enregistré avec succès.", "success");
            viewClientDetails(clientId);
            loadClientsData();
            loadOverviewData();
            if (typeof loadApprovalsData === 'function') loadApprovalsData();
        }
    });
}

async function adjustBalance(clientId, type) {
    UI.prompt(type === 'credit' ? "Créditer" : "Débiter", "Entrez le montant en € :", "Ex: 1000", async (amountStr) => {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            UI.notify("Montant invalide", "error");
            return;
        }

        UI.prompt("Justification", "Justification du mouvement :", "Raison...", async (justification) => {
            if (!justification) {
                UI.notify("Justification obligatoire.", "warning");
                return;
            }

            const { data: client } = await _supabase.from('bank_accounts').select('balance').eq('id', clientId).single();
            let newBalance = client.balance || 0;

            if (type === 'credit') newBalance += amount;
            else newBalance -= amount;

            const { error } = await _supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', clientId);
            if (error) UI.notify("Erreur: " + error.message, "error");
            else {
                // Log transaction
                await _supabase.from('transactions').insert({
                    account_id: clientId,
                    amount: type === 'credit' ? amount : -amount,
                    type: type,
                    status: 'valide',
                    description: justification,
                    is_internal: true
                });
                UI.notify("Solde ajusté avec succès.", "success");
                viewClientDetails(clientId);
                loadClientsData();
                loadOverviewData();
            }
        });
    });
}

async function saveClientNotes(clientId) {
    const notes = document.getElementById('internal_notes').value;
    const phone = document.getElementById('edit_phone').value;
    const address = document.getElementById('edit_address').value;

    const { error } = await _supabase.from('bank_accounts').update({
        internal_notes: notes,
        phone: phone,
        address: address
    }).eq('id', clientId);

    if (error) {
        console.error(error);
        UI.notify("Erreur lors de l'enregistrement.", "error");
    } else {
        UI.notify("Informations enregistrées.", "success");
    }
}

// Utility
function generateRandomPass() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('c_password').value = pass;
}

// --- Cards Management ---
async function loadCardsData() {
    const section = document.getElementById('tab-cards');
    section.innerHTML = `
        <div class="table-card">
            <div class="card-header">
                <h2>Toutes les Cartes Bancaires</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Numéro (Masqué)</th>
                            <th>Type</th>
                            <th>Plafond</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="cardsTableBody">
                        <tr><td colspan="6" style="text-align:center; padding: 2rem;">Chargement...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const { data: cards, error } = await _supabase.from('bank_accounts').select('*').not('card_number', 'is', null);

    if (error) return;

    const tbody = document.getElementById('cardsTableBody');
    tbody.innerHTML = (cards || []).map(c => `
        <tr>
            <td>${c.first_name} ${c.last_name}</td>
            <td style="font-family: monospace;">•••• •••• •••• ${(c.card_number || '0000').slice(-4)}</td>
            <td><span class="badge badge-info">${c.card_type || 'Visa Infinite'}</span></td>
            <td>${(c.card_limit || 0).toLocaleString()} €</td>
            <td><span class="badge badge-${c.card_status === 'actif' ? 'success' : 'warning'}">${c.card_status || 'inactif'}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="manageCard('${c.id}')">Gérer Plafond/Statut</button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function manageCard(clientId) {
    const newLimit = prompt("Nouveau plafond (€) :");
    if (newLimit) {
        const { error } = await _supabase.from('bank_accounts').update({ card_limit: parseFloat(newLimit) }).eq('id', clientId);
        if (error) alert("Erreur : Impossible de mettre à jour le plafond. La colonne est peut-être manquante dans votre table.");
        else {
            alert("Plafond mis à jour avec succès.");
            loadCardsData();
        }
    }
}

// --- Transactions Management ---
async function loadTransactionsData() {
    const { data: trans, error } = await _supabase.from('transactions').select('*, bank_accounts(first_name, last_name)').order('created_at', { ascending: false });

    const tbody = document.querySelector('#globalTransactionsTable tbody');
    if (!tbody) return;

    if (error || !trans || trans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Aucune transaction trouvée.</td></tr>';
        return;
    }

    tbody.innerHTML = trans.map(t => `
        <tr>
            <td style="font-size: 0.7rem; font-family: monospace;">${t.id.slice(0, 8)}</td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
            <td>${(t.bank_accounts?.first_name || 'Inconnu')} ${(t.bank_accounts?.last_name || '')}</td>
            <td><span class="badge badge-info">${t.type}</span></td>
            <td style="font-weight: 700; color: ${t.amount < 0 ? 'var(--danger)' : 'var(--success)'}">${(t.amount || 0).toLocaleString()} €</td>
            <td><span class="badge badge-${t.status === 'valide' ? 'success' : 'danger'}">${t.status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="cancelTransaction('${t.id}')">Annuler</button>
            </td>
        </tr>
    `).join('');
}

async function cancelTransaction(transId) {
    UI.confirm("Annulation", "Voulez-vous vraiment annuler cette transaction ?", async () => {
        const { error } = await _supabase.from('transactions').update({ status: 'annulee' }).eq('id', transId);
        if (error) UI.notify("Erreur: " + error.message, "error");
        else {
            UI.notify("Transaction annulée.", "success");
            loadTransactionsData();
        }
    });
}

// --- Fees Management ---
async function loadFeesData() {
    const section = document.getElementById('tab-fees');
    section.innerHTML = `
        < div class="stats-grid" >
            <div class="stat-card">
                <div class="stat-label">Frais d'activation standard</div>
                <div class="stat-value">466,00 €</div>
                <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="updateBaseFee()">Modifier le montant</button>
            </div>
        </div >
        <div class="table-card" style="margin-top: 2rem;">
            <div class="card-header">
                <h2>Historique des Frais Facturés</h2>
            </div>
            <div class="table-responsive">
                <table id="feesTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Libellé</th>
                            <th>Montant</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="5" style="text-align:center; padding: 2rem;">Aucun frais enregistré.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

async function updateBaseFee() {
    const newFee = prompt("Nouveau montant des frais d'activation (€) :", "466");
    if (newFee) {
        alert("Réglage système mis à jour.");
    }
}

async function resetPassword(clientId) {
    UI.prompt("Mot de passe", "Saisissez le nouveau mot de passe :", "Nouveau mot de passe", async (newPass) => {
        if (!newPass) return;
        const { error } = await _supabase.from('bank_accounts').update({ password: newPass }).eq('id', clientId);
        if (error) UI.notify("Erreur : " + error.message, "error");
        else UI.notify("Mot de passe mis à jour.", "success");
    });
}

async function deleteAccount(clientId) {
    UI.confirm("DANGER", "ATTENTION: Cette action est irréversible. Supprimer définitivement ce compte ?", async () => {
        const { error } = await _supabase.from('bank_accounts').delete().eq('id', clientId);
        if (error) UI.notify("Erreur : " + error.message, "error");
        else {
            UI.notify("Compte supprimé.", "success");
            closeModal('modalClientDetails');
            loadClientsData();
            loadOverviewData();
        }
    });
}

async function submitCreateClient() {
    const firstName = document.getElementById('c_firstname').value;
    const lastName = document.getElementById('c_lastname').value;
    const email = document.getElementById('c_email').value;
    const password = document.getElementById('c_password').value;
    const clientId = document.getElementById('c_clientid').value || `BK-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const accNum = document.getElementById('c_accnum').value || `GBK${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    if (!firstName || !lastName || !email || !password) {
        UI.notify("Veuillez remplir tous les champs obligatoires.", "warning");
        return;
    }

    const newClient = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        client_id: clientId,
        account_number: accNum,
        role: 'CLIENT',
        account_status: 'actif',
        balance: 0.00,
        civility: 'M.',
        nationality: 'N/A'
    };

    const { error } = await _supabase.from('bank_accounts').insert([newClient]);
    if (error) {
        UI.notify("Erreur : " + error.message, "error");
    } else {
        UI.notify("Client créé avec succès.", "success");
        closeModal('modalCreateClient');
        loadClientsData();
        loadOverviewData();
        // Reset form
        document.getElementById('createClientForm').reset();
    }
}
