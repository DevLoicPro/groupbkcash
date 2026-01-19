/**
 * Component Management (Partials)
 * Handles Header and Footer injection across pages.
 */

const COMPONENTS = {
    // Header for Main Pages (Index, About, Cards, Professionals)
    header: (activePage = '') => `
        <nav class="nav container">
            <a href="index.html" class="logo">
                <span class="logo-icon"><i data-lucide="wallet"></i></span>
                <span class="logo-text">GROUPBK<span>CASH</span></span>
            </a>

            <ul class="nav-links">
                <li class="nav-item dropdown">
                    <button class="nav-link dropdown-toggle" id="offres-toggle">
                        Nos offres <i data-lucide="chevron-down" class="chevron-icon"></i>
                    </button>
                    <ul class="dropdown-menu" id="offres-menu">
                        <li><a href="index.html" class="${activePage === 'index.html' ? 'active' : ''}">Particulier</a></li>
                        <li><a href="professions-liberales.html" class="${activePage === 'professions-liberales.html' ? 'active' : ''}">Professionnel</a></li>
                    </ul>
                </li>
                <li><a href="nos-cartes.html" class="${activePage === 'nos-cartes.html' ? 'active' : ''}">Nos Cartes</a></li>
                <li><a href="about.html" class="${activePage === 'about.html' ? 'active' : ''}">Qui sommes-nous</a></li>
                <li><a href="contact.html" class="${activePage === 'contact.html' ? 'active' : ''}">Contact</a></li>
                <li class="mobile-only-actions">
                    <a href="login.html" class="btn btn-outline mobile-btn">Se connecter</a>
                    <a href="register.html" class="btn btn-primary mobile-btn">Ouvrir un compte bancaire</a>
                </li>
            </ul>

            <div class="nav-actions">
                <a href="login.html" class="btn btn-outline">Me connecter</a>
                <a href="register.html" class="btn btn-primary">Ouvrir un compte</a>
            </div>

            <button class="mobile-menu-toggle">
                <i data-lucide="menu"></i>
            </button>
        </nav>
    `,

    // Standard Footer for ALL pages
    footer: `
        <div class="container">
            <div class="footer-top">
                <div class="footer-brand">
                    <div class="logo">
                        <span class="logo-icon"><i data-lucide="wallet"></i></span>
                        <span class="logo-text">GROUPBK<span>CASH</span></span>
                    </div>
                    <p>La banque qui réinvente votre quotidien avec des outils technologiques de pointe et une dimension
                        humaine préservée.</p>
                    <div class="social-links">
                        <a href="#" class="social-icon"><i data-lucide="facebook"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="twitter"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="linkedin"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="instagram"></i></a>
                    </div>
                </div>

                <div class="footer-column">
                    <h4>L'OFFRE</h4>
                    <ul>
                        <li><a href="index.html">Particuliers</a></li>
                        <li><a href="professions-liberales.html">Professionnels</a></li>
                        <li><a href="nos-cartes.html">Nos Cartes</a></li>
                        <li><a href="register.html">Ouvrir un compte</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h4>PRATIQUE</h4>
                    <ul>
                        <li><a href="#">Tarifs</a></li>
                        <li><a href="#">Aide & FAQ</a></li>
                        <li><a href="#">Sécurité</a></li>
                        <li><a href="contact.html">Contact</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h4>GROUPBKCASH</h4>
                    <ul>
                        <li><a href="about.html">Qui sommes-nous ?</a></li>
                        <li><a href="#">Recrutement</a></li>
                        <li><a href="#">Presse</a></li>
                        <li><a href="#">Blog</a></li>
                    </ul>
                </div>
            </div>

            <div class="footer-legal">
                <div class="footer-bottom">
                    <p>© 2024 GROUPBKCASH Banque. Tous droits réservés.</p>
                    <div class="legal-links">
                        <a href="#">MENTIONS LÉGALES</a>
                        <a href="#">CONFIDENTIALITÉ</a>
                        <a href="#">COOKIES</a>
                    </div>
                </div>
            </div>
        </div>
    `
};

/**
 * Initializes the layout layout
 */
function initLayout() {
    const headerContainer = document.getElementById('main-header');
    const footerContainer = document.getElementById('main-footer');

    // Detect active page name from URL
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';

    // Inject Header (only if container exists)
    if (headerContainer) {
        headerContainer.innerHTML = COMPONENTS.header(page);
    }

    // Inject Footer (only if container exists)
    if (footerContainer) {
        footerContainer.innerHTML = COMPONENTS.footer;
    }

    // Re-initialize icons/scripts that depend on DOM
    if (window.lucide) {
        lucide.createIcons();
    }

    // Initialize Mobile Menu Logic (moved from main.js)
    initMobileMenu();

    // Initialize Dropdown Logic
    initDropdowns();
}

/**
 * Handles Dropdown Toggles (Nos offres)
 */
function initDropdowns() {
    const toggle = document.querySelector('#offres-toggle');
    const menu = document.querySelector('#offres-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.toggle('active');
        toggle.classList.toggle('active');

        // Chevron rotation is handled by CSS on .dropdown-toggle.active
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('active');
            toggle.classList.remove('active');
        }
    });
}

/**
 * Handles Mobile Menu Interaction
 */
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!mobileToggle || !navLinks) return;

    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }

    let scrollPosition = 0;

    const toggleMenu = () => {
        const isActive = navLinks.classList.toggle('active');
        overlay.classList.toggle('active');

        if (isActive) {
            // Save current scroll position
            scrollPosition = window.pageYOffset;
            document.body.classList.add('scroll-lock');
            document.body.style.top = `-${scrollPosition}px`;
        } else {
            // Restore scroll position
            document.body.classList.remove('scroll-lock');
            document.body.style.top = '';
            window.scrollTo(0, scrollPosition);
        }

        const icon = mobileToggle.querySelector('i');
        if (isActive) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    };

    // Remove existing listeners to avoid duplicates if re-init
    mobileToggle.removeEventListener('click', toggleMenu);

    mobileToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu(); // Use the same function to ensure scroll is restored
            }
        });
    });
}

// Auto-init on load
document.addEventListener('DOMContentLoaded', initLayout);
