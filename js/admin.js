// Configuration Supabase pour Admin
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";

let _supabase;
let currentRequest = null; // stocke la demande en cours d'examen
if (typeof supabase !== 'undefined') {
    _supabase = supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error('Supabase library not loaded');
}

// EmailJS Configuration
if (typeof emailjs !== 'undefined') {
    emailjs.init("zNpk164s0vsSQH5dW");
}

// Admin Utilities
const AdminUtils = {
    // Générer un identifiant unique pour le client
    generateClientId: function() {
        const prefix = "BK";
        const part1 = Math.floor(100 + Math.random() * 900);
        const part2 = Math.floor(100 + Math.random() * 900);
        return `${prefix}-${part1}-${part2}`;
    },

    // Générer un mot de passe temporaire sécurisé
    generateTempPassword: function() {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    },

    // Formater la date
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
    },

    // Formater la date et l'heure
    formatDateTime: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Calculer le temps écoulé
    getTimeAgo: function(dateString) {
        if (!dateString) return 'Jamais';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return this.formatDate(dateString);
    }
};

// Fonctions pour les statistiques
async function loadDashboardStats() {
    if (!_supabase) {
        console.error('Supabase not initialized');
        return;
    }
    
    try {
        const { data: accounts, error } = await _supabase
            .from('bank_accounts')
            .select('account_status');

        if (error) throw error;

        const stats = {
            pending: accounts.filter(a => a.account_status === 'en_attente').length,
            inactive: accounts.filter(a => a.account_status === 'inactif').length,
            active: accounts.filter(a => a.account_status === 'actif').length,
            suspended: accounts.filter(a => a.account_status === 'suspendu').length
        };

        // Mettre à jour les statistiques dans le DOM
        const statBoxes = document.querySelectorAll('.stat-box p');
        if (statBoxes.length >= 4) {
            statBoxes[0].textContent = stats.pending.toString().padStart(2, '0');
            statBoxes[1].textContent = stats.inactive.toString().padStart(2, '0');
            statBoxes[2].textContent = stats.active.toString().padStart(2, '0');
            statBoxes[3].textContent = stats.suspended.toString().padStart(2, '0');
        }

        return stats;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Fonctions pour les demandes d'adhésion
async function loadPendingRequests() {
    if (!_supabase) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data: requests, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('account_status', 'en_attente')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return requests || [];
    } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        return [];
    }
}

async function renderRequestsTable() {
    const requests = await loadPendingRequests();
    const tbody = document.querySelector('#requestsTable tbody');
    
    if (!tbody) return;

    if (requests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    Aucune demande en attente
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = requests.map(request => {
        const submissionDate = AdminUtils.formatDate(request.created_at);
        const initials = (request.first_name?.[0] || '') + (request.last_name?.[0] || '');
        
        return `
            <tr data-request-id="${request.id}">
                <td>${submissionDate}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div style="font-weight: 600;">${request.first_name} ${request.last_name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${request.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;"><strong>${request.income_reported?.toLocaleString('fr-FR')} €</strong> net/mois</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${request.profession || 'N/A'}</div>
                </td>
                <td><span class="badge badge-pending">EN ATTENTE</span></td>
                <td>
                    <button class="btn-action btn-primary-admin btn-request-review" data-request-id="${request.id}">
                        <i data-lucide="eye" size="14"></i> Examiner le dossier
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Fonction pour ouvrir le modal de révision
async function openReviewModal(requestId) {
    try {
        const { data: request, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', requestId)
            .single();

        if (error || !request) {
            alert('Erreur lors du chargement du dossier');
            return;
        }

        currentRequest = request;

        // Remplir le modal avec les données
        document.getElementById('modalRequestId').value = request.id;
        document.getElementById('modalUserName').textContent = `${request.first_name} ${request.last_name}`;
        document.getElementById('modalEmail').textContent = request.email;
        document.getElementById('modalProfession').textContent = request.profession || 'N/A';
        document.getElementById('modalIncome').textContent = `${request.income_reported?.toLocaleString('fr-FR')} €`;
        document.getElementById('modalPhone').textContent = request.phone || 'N/A';
        document.getElementById('modalAddress').textContent = request.address || 'N/A';
        document.getElementById('modalNationality').textContent = request.nationality || 'N/A';
        document.getElementById('modalMaritalStatus').textContent = request.marital_status || 'N/A';

        // Réinitialiser l'état du modal
        document.getElementById('approvalSection').style.display = 'none';
        document.getElementById('approveBtn').style.display = 'inline-flex';
        document.getElementById('rejectBtn').style.display = 'inline-flex';
        document.getElementById('sendCredentialsBtn').style.display = 'none';

        // Afficher le modal
        document.getElementById('reviewModal').classList.add('active');
        
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ouverture du dossier');
    }
}

// Fonction pour approuver et générer les identifiants
async function approveRequest() {
    if (!_supabase) {
        alert('Erreur: Supabase non initialisé');
        return;
    }
    
    const requestId = document.getElementById('modalRequestId').value;
    const clientId = AdminUtils.generateClientId();
    const tempPassword = AdminUtils.generateTempPassword();

    try {
        // Mettre à jour le compte avec les identifiants et le statut "inactif"
        // Note: Les champs client_id, temp_password, credentials_sent_at doivent exister dans la base de données
        const updateData = {
            account_status: 'inactif'
        };
        
        // Ajouter les champs seulement s'ils existent dans le schéma
        // En production, assurez-vous que ces colonnes existent dans votre table bank_accounts
        try {
            updateData.client_id = clientId;
            updateData.temp_password = tempPassword;
            updateData.credentials_sent_at = new Date().toISOString();
        } catch (e) {
            console.warn('Certains champs ne sont pas disponibles dans le schéma');
        }
        
        const { error: updateError } = await _supabase
            .from('bank_accounts')
            .update(updateData)
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Afficher les identifiants générés
        document.getElementById('generatedClientId').textContent = clientId;
        document.getElementById('generatedPassword').textContent = tempPassword;
        document.getElementById('approvalSection').style.display = 'block';
        document.getElementById('approveBtn').style.display = 'none';
        document.getElementById('rejectBtn').style.display = 'none';
        document.getElementById('sendCredentialsBtn').style.display = 'inline-flex';

        // Envoyer immédiatement les identifiants
        await sendCredentials(true);

        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la génération des identifiants');
    }
}

// Fonction pour envoyer les identifiants par email
async function sendCredentials(auto = false) {
    const requestId = document.getElementById('modalRequestId').value;
    
    try {
        const request = currentRequest;
        if (!request) throw new Error('Aucune demande sélectionnée');

        const clientId = document.getElementById('generatedClientId').textContent;
        const tempPassword = document.getElementById('generatedPassword').textContent;

        // Envoyer l'email avec EmailJS
        if (typeof emailjs !== 'undefined') {
            const templateParams = {
                to_name: `${request.first_name} ${request.last_name}`,
                to_email: request.email,
                client_id: clientId,
                temp_password: tempPassword,
                from_name: "GROUPBKCASH Administration"
            };

            try {
                await emailjs.send("service_k5qggz9", "template_credentials", templateParams);
                
                // Marquer comme envoyé
                await _supabase
                    .from('bank_accounts')
                    .update({ credentials_sent: true })
                    .eq('id', requestId);

                const msg = `Identifiants envoyés avec succès à ${request.email}.\nLe compte est maintenant en statut INACTIF jusqu'à l'activation finale.`;
                auto ? console.info(msg) : alert(msg);
                closeModal();
                renderRequestsTable();
                loadDashboardStats();
            } catch (emailError) {
                console.error('Erreur email:', emailError);
                alert('Les identifiants ont été générés mais l\'envoi par email a échoué. Veuillez les communiquer manuellement au client.');
            }
        } else {
            alert('Service email non disponible. Veuillez communiquer les identifiants manuellement au client.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'envoi des identifiants');
    }
}

// Fonction pour fermer le modal
function closeModal() {
    document.getElementById('reviewModal').classList.remove('active');
}

// Fonctions pour la gestion des utilisateurs
async function loadUsers() {
    if (!_supabase) {
        console.error('Supabase not initialized');
        return [];
    }
    
    try {
        const { data: users, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .neq('account_status', 'en_attente')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return users || [];
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return [];
    }
}

async function renderUsersTable() {
    const users = await loadUsers();
    const tbody = document.querySelector('#usersTable tbody');
    
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    Aucun utilisateur trouvé
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
        const statusClass = {
            'inactif': 'badge-inactive',
            'actif': 'badge-active',
            'suspendu': 'badge-suspended'
        }[user.account_status] || 'badge-inactive';

        const statusText = {
            'inactif': 'INACTIF',
            'actif': 'ACTIF',
            'suspendu': 'SUSPENDU'
        }[user.account_status] || 'INACTIF';

        const lastLogin = user.last_login ? AdminUtils.getTimeAgo(user.last_login) : 'Première connexion effectuée';

        let actionButton = '';
        if (user.account_status === 'inactif') {
            actionButton = `
                <button class="btn-action btn-primary-admin" onclick="openActivationModal(${user.id})">
                    <i data-lucide="zap" size="14"></i> Activation & Attribution Carte
                </button>
            `;
        } else if (user.account_status === 'actif') {
            actionButton = `
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-action" onclick="viewUserDetails(${user.id})">
                        <i data-lucide="file-text" size="14"></i> Détails
                    </button>
                    <button class="btn-action" style="color: #EF4444; border-color: #EF4444;" onclick="suspendUser(${user.id})">
                        <i data-lucide="shield-alert" size="14"></i> Suspendre
                    </button>
                </div>
            `;
        } else {
            actionButton = `
                <button class="btn-action" style="color: #22C55E; border-color: #22C55E;" onclick="reactivateUser(${user.id})">
                    <i data-lucide="unlock" size="14"></i> Réactiver
                </button>
            `;
        }

        return `
            <tr>
                <td style="font-family: monospace; font-weight: 700;">${user.client_id || 'N/A'}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div style="font-weight: 600;">${user.first_name} ${user.last_name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${lastLogin}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Fonction pour ouvrir le modal d'activation et attribution de carte
async function openActivationModal(userId) {
    try {
        const { data: user, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            alert('Erreur lors du chargement des informations utilisateur');
            return;
        }

        // Remplir les informations utilisateur
        document.getElementById('activationUserId').value = user.id;
        document.getElementById('activationUserName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('activationUserEmail').textContent = user.email;
        document.getElementById('activationClientId').textContent = user.client_id || 'N/A';

        // Générer un numéro de carte par défaut (16 chiffres)
        const cardNumber = generateCardNumber();
        document.getElementById('cardNumber').value = cardNumber;

        // Générer une date d'expiration par défaut (3 ans à partir d'aujourd'hui)
        const expiryDate = generateExpiryDate();
        document.getElementById('cardExpiry').value = expiryDate;

        // Générer un CVV par défaut (3 chiffres)
        const cvv = generateCVV();
        document.getElementById('cardCVV').value = cvv;

        // Afficher le modal
        document.getElementById('activationModal').classList.add('active');
        
        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ouverture du modal');
    }
}

// Générer un numéro de carte bancaire (16 chiffres)
function generateCardNumber() {
    let cardNumber = '';
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) cardNumber += ' ';
        cardNumber += Math.floor(Math.random() * 10);
    }
    return cardNumber;
}

// Générer une date d'expiration (MM/YY)
function generateExpiryDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
}

// Générer un CVV (3 chiffres)
function generateCVV() {
    return String(Math.floor(100 + Math.random() * 900));
}

// Fonction pour activer le compte et attribuer la carte
async function activateAccountAndAssignCard() {
    if (!_supabase) {
        alert('Erreur: Supabase non initialisé');
        return;
    }
    
    const userId = document.getElementById('activationUserId').value;
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVV = document.getElementById('cardCVV').value;

    // Validation
    if (!cardNumber || cardNumber.length !== 16) {
        alert('Le numéro de carte doit contenir 16 chiffres');
        return;
    }

    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        alert('La date d\'expiration doit être au format MM/YY');
        return;
    }

    if (!cardCVV || cardCVV.length !== 3) {
        alert('Le CVV doit contenir 3 chiffres');
        return;
    }

    try {
        // Mettre à jour le compte avec les informations de la carte et activer
        // Note: Les champs card_number, card_expiry, card_cvv, activated_at doivent exister dans la base de données
        const updateData = {
            account_status: 'actif'
        };
        
        // Ajouter les champs de carte seulement s'ils existent dans le schéma
        // En production, assurez-vous que ces colonnes existent dans votre table bank_accounts
        try {
            updateData.card_number = cardNumber;
            updateData.card_expiry = cardExpiry;
            updateData.card_cvv = cardCVV;
            updateData.activated_at = new Date().toISOString();
        } catch (e) {
            console.warn('Certains champs de carte ne sont pas disponibles dans le schéma');
        }
        
        const { error: updateError } = await _supabase
            .from('bank_accounts')
            .update(updateData)
            .eq('id', userId);

        if (updateError) throw updateError;

        alert('Compte activé et carte attribuée avec succès !');
        closeActivationModal();
        renderUsersTable();
        loadDashboardStats();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'activation du compte');
    }
}

// Fonction pour fermer le modal d'activation
function closeActivationModal() {
    document.getElementById('activationModal').classList.remove('active');
}

// Fonction pour suspendre un utilisateur
async function suspendUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir suspendre ce compte ?')) return;

    try {
        const { error } = await _supabase
            .from('bank_accounts')
            .update({ account_status: 'suspendu' })
            .eq('id', userId);

        if (error) throw error;

        alert('Compte suspendu avec succès');
        renderUsersTable();
        loadDashboardStats();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suspension du compte');
    }
}

// Fonction pour réactiver un utilisateur
async function reactivateUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir réactiver ce compte ?')) return;

    try {
        const { error } = await _supabase
            .from('bank_accounts')
            .update({ account_status: 'actif' })
            .eq('id', userId);

        if (error) throw error;

        alert('Compte réactivé avec succès');
        renderUsersTable();
        loadDashboardStats();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la réactivation du compte');
    }
}

// Fonction pour voir les détails d'un utilisateur
async function viewUserDetails(userId) {
    // TODO: Implémenter une vue détaillée de l'utilisateur
    alert('Fonctionnalité à venir : Vue détaillée de l\'utilisateur');
}

// Fonction pour charger les dernières demandes sur le dashboard
async function loadRecentRequests() {
    try {
        const { data: requests, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('account_status', 'en_attente')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const tbody = document.querySelector('#recentRequestsTable');
        if (!tbody) return;

        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        Aucune demande en attente
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(request => {
            const initials = (request.first_name?.[0] || '') + (request.last_name?.[0] || '');
            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">${initials}</div>
                            <div>
                                <div style="font-weight: 600;">${request.first_name} ${request.last_name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${request.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${request.profession || 'N/A'}</td>
                    <td><strong>${request.income_reported?.toLocaleString('fr-FR')} €</strong> / mois</td>
                    <td><span class="badge badge-pending">À VALIDER</span></td>
                    <td>
                        <a href="admin-requests.html" class="btn-action">Examiner</a>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    } catch (error) {
        console.error('Erreur lors du chargement des dernières demandes:', error);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) lucide.createIcons();

    // Charger les statistiques si on est sur le dashboard
    if (document.querySelector('.stats-grid')) {
        loadDashboardStats();
        loadRecentRequests();
    }

    // Charger les demandes si on est sur la page des demandes
    if (document.querySelector('#requestsTable')) {
        renderRequestsTable();
        // Délégation de clic pour le bouton "Examiner"
        document.querySelector('#requestsTable').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-request-review');
            if (btn) {
                const requestId = btn.getAttribute('data-request-id');
                if (requestId) openReviewModal(requestId);
            }
        });
    }

    // Charger les utilisateurs si on est sur la page des utilisateurs
    if (document.querySelector('#usersTable')) {
        renderUsersTable();
    }
});
