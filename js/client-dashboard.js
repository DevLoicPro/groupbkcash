// Configuration Supabase
const supabaseUrl = "https://dwipqqwuqfwcdgugugqw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXBxcXd1cWZ3Y2RndWd1Z3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTAxMTQsImV4cCI6MjA4Mzk2NjExNH0.bZ-wOSMNp8U5V6b9QSCUuzQUczYs7L-mwsjpwh_uSZk";

let _supabase;
if (typeof supabase !== 'undefined') {
    _supabase = supabase.createClient(supabaseUrl, supabaseKey);
}

// EmailJS Configuration
if (typeof emailjs !== 'undefined') {
    emailjs.init("zNpk164s0vsSQH5dW");
}

// Load user data
async function loadUserData() {
    if (!_supabase) {
        console.error('Supabase not initialized');
        return;
    }

    // Get email from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

    if (!email) {
        console.warn('No email found, using demo data');
        displayDemoData();
        return;
    }

    try {
        const { data: user, error } = await _supabase
            .from('bank_accounts')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;

        if (user) {
            displayUserData(user);
        } else {
            displayDemoData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        displayDemoData();
    }
}

function displayUserData(user) {
    // Update card holder name
    const cardHolder = document.querySelector('.card-holder-label');
    if (cardHolder && user.first_name && user.last_name) {
        cardHolder.textContent = `${user.last_name.toUpperCase()} ${user.first_name.toUpperCase()}`;
    }

    // Update balances
    const mainBalance = document.getElementById('mainBalance');
    if (mainBalance) {
        const balance = user.balance || 0;
        mainBalance.textContent = `€${balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const totalSaved = document.getElementById('totalSaved');
    if (totalSaved) {
        const saved = user.total_saved || 0;
        totalSaved.textContent = `€${saved.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Update card status
    if (user.card_status === 'active' && user.card_number) {
        const cardNumber = user.card_number.replace(/\s/g, '');
        const maskedNumber = cardNumber.slice(0, 4) + ' **** **** ' + cardNumber.slice(-4);
        document.querySelector('.card-number').innerHTML = `
            <span class="card-number-part">${maskedNumber.slice(0, 4)}</span>
            <span class="card-number-part">${maskedNumber.slice(5, 9)}</span>
            <span class="card-number-part">${maskedNumber.slice(10, 14)}</span>
            <span class="card-number-part">${maskedNumber.slice(15)}</span>
        `;
        document.querySelector('.card-number-inactive').style.display = 'none';
        document.querySelector('.card-status-message').textContent = 'Votre carte bancaire est active.';
    }

    // Update card expiry if available
    if (user.card_expiry) {
        const expiryEl = document.querySelector('.card-expiry');
        if (expiryEl) {
            expiryEl.textContent = `EXP ${user.card_expiry}`;
        }
    }
}

function displayDemoData() {
    // Demo data for testing
    const mainBalance = document.getElementById('mainBalance');
    if (mainBalance) {
        mainBalance.textContent = '€0,00';
    }

    const totalSaved = document.getElementById('totalSaved');
    if (totalSaved) {
        totalSaved.textContent = '€0,00';
    }
}

// Card request functionality
function openCardModal() {
    const modal = document.getElementById('cardRequestModal');
    if (modal) {
        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    }
}

function closeCardModal() {
    const modal = document.getElementById('cardRequestModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function requestCardActivation() {
    if (!_supabase) {
        alert('Erreur: Supabase non initialisé');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

    if (!email) {
        alert('Email non trouvé');
        return;
    }

    try {
        // Update user's card request status
        const { error } = await _supabase
            .from('bank_accounts')
            .update({ 
                card_request_status: 'en_attente',
                card_request_date: new Date().toISOString()
            })
            .eq('email', email);

        if (error) throw error;

        // Send notification email if EmailJS is available
        if (typeof emailjs !== 'undefined') {
            try {
                await emailjs.send("service_k5qggz9", "template_card_request", {
                    to_email: email,
                    to_name: email.split('@')[0],
                    from_name: "GROUPBKCASH"
                });
            } catch (emailError) {
                console.warn('Email sending failed:', emailError);
            }
        }

        if (typeof UI !== 'undefined' && UI.showModal) {
            UI.showModal("Demande envoyée", "Votre demande d'activation de carte a été enregistrée. L'administrateur va la traiter sous peu.", "success");
        } else {
            alert('Demande d\'activation de carte enregistrée avec succès !');
        }

        closeCardModal();
    } catch (error) {
        console.error('Error requesting card activation:', error);
        alert('Erreur lors de la demande d\'activation');
    }
}

// Tab navigation
function initTabs() {
    const tabLinks = document.querySelectorAll('.menu-link[data-tab]');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            
            // Update active state
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Here you would load different content based on the tab
            console.log('Switching to tab:', tab);
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) lucide.createIcons();
    
    // Apply translations if i18n is available
    if (window.i18n) {
        window.i18n.applyTranslations();
    }
    
    loadUserData();
    initTabs();
    
    // Card request button
    const requestCardBtn = document.getElementById('requestCardBtn');
    if (requestCardBtn) {
        requestCardBtn.addEventListener('click', openCardModal);
    }
    
    // Close modal on overlay click
    const modalOverlay = document.getElementById('cardRequestModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeCardModal();
            }
        });
    }
    
    // Re-apply translations when language changes
    document.addEventListener('languageChanged', () => {
        if (window.lucide) lucide.createIcons();
        if (window.i18n) window.i18n.applyTranslations();
    });
});
