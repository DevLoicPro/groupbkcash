/**
 * Component Management (Partials)
 * Handles Header and Footer injection across pages.
 */

const COMPONENTS = {
    // Header for Main Pages (Index, About, Cards, Professionals)
    header: (activePage = '') => {
        const lang = localStorage.getItem('groupbk_lang') || 'fr';
        const t = TRANSLATIONS[lang];

        return `
        <nav class="nav container">
            <a href="index.html" class="logo">
                <span class="logo-icon"><i data-lucide="wallet"></i></span>
                <span class="logo-text">GROUPBK<span>CASH</span></span>
            </a>

            <ul class="nav-links">
                <li class="nav-item dropdown">
                    <button class="nav-link dropdown-toggle" id="offres-toggle">
                        <span data-i18n="nav_offers">${t.nav_offers}</span> <i data-lucide="chevron-down" class="chevron-icon"></i>
                    </button>
                    <ul class="dropdown-menu" id="offres-menu">
                        <li><a href="index.html" class="${activePage === 'index.html' ? 'active' : ''}" data-i18n="nav_individuals">${t.nav_individuals}</a></li>
                        <li><a href="professions-liberales.html" class="${activePage === 'professions-liberales.html' ? 'active' : ''}" data-i18n="nav_pros">${t.nav_pros}</a></li>
                    </ul>
                </li>
                <li><a href="nos-cartes.html" class="${activePage === 'nos-cartes.html' ? 'active' : ''}" data-i18n="nav_cards">${t.nav_cards}</a></li>
                <li><a href="about.html" class="${activePage === 'about.html' ? 'active' : ''}" data-i18n="nav_about">${t.nav_about}</a></li>
                <li><a href="contact.html" class="${activePage === 'contact.html' ? 'active' : ''}" data-i18n="nav_contact">${t.nav_contact}</a></li>
                <li class="mobile-only-actions">
                    <div class="mobile-switcher">
                        ${i18n.getSwitcherHTML()}
                    </div>
                    <div class="mobile-btns-wrapper">
                        <a href="login.html" class="btn btn-outline mobile-btn" data-i18n="nav_login">${t.nav_login}</a>
                        <a href="register.html" class="btn btn-primary mobile-btn" data-i18n="nav_register">${t.nav_register}</a>
                    </div>
                </li>
            </ul>

            <div class="nav-actions">
                ${i18n.getSwitcherHTML()}
                <a href="login.html" class="btn btn-outline" data-i18n="nav_login">${t.nav_login}</a>
                <a href="register.html" class="btn btn-primary" data-i18n="nav_register">${t.nav_register}</a>
            </div>

            <button class="mobile-menu-toggle">
                <i data-lucide="menu"></i>
            </button>
        </nav>
        `;
    },

    // Standard Footer for ALL pages
    footer: () => {
        const lang = localStorage.getItem('groupbk_lang') || 'fr';
        const t = TRANSLATIONS[lang];
        const currentYear = new Date().getFullYear();

        return `
        <div class="container">
            <div class="footer-top">
                <div class="footer-brand">
                    <div class="logo">
                        <span class="logo-icon"><i data-lucide="wallet"></i></span>
                        <span class="logo-text">GROUPBK<span>CASH</span></span>
                    </div>
                    <p data-i18n="footer_desc">${t.footer_desc}</p>
                    <div class="social-links">
                        <a href="#" class="social-icon"><i data-lucide="facebook"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="twitter"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="linkedin"></i></a>
                        <a href="#" class="social-icon"><i data-lucide="instagram"></i></a>
                    </div>
                </div>

                <div class="footer-column">
                    <h4 data-i18n="footer_offers">${t.footer_offers}</h4>
                    <ul>
                        <li><a href="index.html" data-i18n="nav_individuals">${t.nav_individuals}</a></li>
                        <li><a href="professions-liberales.html" data-i18n="nav_pros">${t.nav_pros}</a></li>
                        <li><a href="nos-cartes.html" data-i18n="nav_cards">${t.nav_cards}</a></li>
                        <li><a href="register.html" data-i18n="nav_register">${t.nav_register}</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h4 data-i18n="footer_practical">${t.footer_practical}</h4>
                    <ul>
                        <li><a href="#" data-i18n="footer_rates">${t.footer_rates}</a></li>
                        <li><a href="#" data-i18n="footer_faq">${t.footer_faq}</a></li>
                        <li><a href="#" data-i18n="footer_security">${t.footer_security}</a></li>
                        <li><a href="contact.html" data-i18n="nav_contact">${t.nav_contact}</a></li>
                    </ul>
                </div>

                <div class="footer-column">
                    <h4 data-i18n="footer_group">${t.footer_group}</h4>
                    <ul>
                        <li><a href="about.html" data-i18n="nav_about">${t.nav_about}</a></li>
                        <li><a href="#" data-i18n="footer_jobs">${t.footer_jobs}</a></li>
                        <li><a href="#" data-i18n="footer_press">${t.footer_press}</a></li>
                        <li><a href="#" data-i18n="footer_blog">${t.footer_blog}</a></li>
                    </ul>
                </div>
            </div>

            <div class="footer-legal">
                <div class="footer-bottom">
                    <p>© ${currentYear} Groupe BK Cash Bank — <span data-i18n="footer_rights">${t.footer_rights}</span></p>
                    <div class="legal-links">
                        <a href="legal.html" data-i18n="footer_legal">${t.footer_legal}</a>
                        <a href="security.html" data-i18n="footer_privacy">CONFIDENTIALITÉ ET SÉCURITÉ</a>
                        <a href="cookies.html" data-i18n="footer_cookies">${t.footer_cookies}</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
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
        footerContainer.innerHTML = COMPONENTS.footer();
    }

    // Initialize interactive elements
    lucide.createIcons();
    initMobileMenu();
    initDropdowns();

    // Re-render components when language changes
    document.addEventListener('languageChanged', () => {
        if (headerContainer) headerContainer.innerHTML = COMPONENTS.header(page);
        if (footerContainer) {
            footerContainer.innerHTML = COMPONENTS.footer();
        }
        lucide.createIcons();
        initMobileMenu();
        initDropdowns();
    });
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
