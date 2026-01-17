document.addEventListener('DOMContentLoaded', () => {
    // Header scroll effect
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply animation classes to sections
    const animateElements = document.querySelectorAll('.feature-item, .service-card, .promo-content, .hero-content, .stat-card, .team-card, .value-card, .figure-item');

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // Animation implementation through JS property change
    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    };

    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
    const allAnimated = document.querySelectorAll('.feature-item, .service-card, .promo-content, .hero-content, .stat-card, .team-card, .value-card, .figure-item');
    allAnimated.forEach(el => scrollObserver.observe(el));

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile menu toggle logic is now handled in layout.js

    // Fix for button sizing and box layouts on specific browser versions
    const adjustLayout = () => {
        const isMobile = window.innerWidth <= 768;
        const boxes = document.querySelectorAll('.service-card, .feature-item, .stat-card');

        boxes.forEach(box => {
            if (isMobile) {
                box.style.width = '100%';
            } else {
                box.style.width = '';
            }
        });
    };

    window.addEventListener('resize', adjustLayout);
    adjustLayout();

    // Card hover effect enhancement
    const card = document.querySelector('.card-inner');
    if (card) {
        const promoContent = document.querySelector('.promo-content');
        promoContent.addEventListener('mousemove', (e) => {
            const rect = promoContent.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        promoContent.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateY(-10deg) rotateX(10deg)';
        });
    }
});
