// Mobile menu toggle
let menuOpen = false;
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const bar1 = document.getElementById('bar1');
    const bar2 = document.getElementById('bar2');
    const bar3 = document.getElementById('bar3');
    menuOpen = !menuOpen;

    if (menuOpen) {
        menu.style.maxHeight = menu.scrollHeight + 'px';
        menu.style.borderColor = 'rgba(255,255,255,0.05)';
        // Animate to X
        bar1.style.transform = 'translateY(8px) rotate(45deg)';
        bar2.style.opacity = '0';
        bar3.style.transform = 'translateY(-8px) rotate(-45deg)';
    } else {
        menu.style.maxHeight = '0px';
        menu.style.borderColor = 'rgba(255,255,255,0)';
        // Reset bars
        bar1.style.transform = 'none';
        bar2.style.opacity = '1';
        bar3.style.transform = 'none';
    }
}

// Navbar scroll background
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(5,5,5,0.95)';
        navbar.style.backdropFilter = 'blur(20px)';
        navbar.style.WebkitBackdropFilter = 'blur(20px)';
        navbar.style.borderColor = 'rgba(255,255,255,0.05)';
    } else {
        navbar.style.background = 'transparent';
        navbar.style.backdropFilter = 'none';
        navbar.style.WebkitBackdropFilter = 'none';
        navbar.style.borderColor = 'transparent';
    }
});

// Lightbox functions (global scope)
function openLightbox(el) {
    const img = el.querySelector('img');
    if (!img) return;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = img.src;
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
}

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

document.addEventListener('DOMContentLoaded', () => {

    // Video Carousel - Auto slide on mobile only
    const videoTrack = document.getElementById('video-track');
    const videoDots = document.getElementById('video-dots');
    if (videoTrack && videoDots) {
        const slides = videoTrack.querySelectorAll('.video-slide');
        const dots = videoDots.querySelectorAll('.dot');
        let currentSlide = 0;
        let slideInterval;

        function goToSlide(index) {
            currentSlide = index;
            videoTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        function nextSlide() {
            const next = (currentSlide + 1) % slides.length;
            goToSlide(next);
        }

        function startAutoSlide() {
            // Only auto-slide on mobile (< 640px)
            if (window.innerWidth < 640) {
                slideInterval = setInterval(nextSlide, 4000);
            }
        }

        function stopAutoSlide() {
            clearInterval(slideInterval);
        }

        // Touch swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        videoTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });

        videoTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentSlide < slides.length - 1) {
                    goToSlide(currentSlide + 1);
                } else if (diff < 0 && currentSlide > 0) {
                    goToSlide(currentSlide - 1);
                }
            }
            startAutoSlide();
        }, { passive: true });

        // Dot click
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                stopAutoSlide();
                goToSlide(i);
                startAutoSlide();
            });
        });

        // Start
        startAutoSlide();

        // Re-check on resize
        window.addEventListener('resize', () => {
            stopAutoSlide();
            if (window.innerWidth >= 640) {
                videoTrack.style.transform = 'none';
            } else {
                goToSlide(currentSlide);
                startAutoSlide();
            }
        });
    }
    
    // === Drag/Swipe support for CSS-animated carousels ===
    function makeDraggable(container, track) {
        if (!container || !track) return;

        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let dragStartTime = 0;

        // Get the animation name and duration from computed style
        const computedStyle = window.getComputedStyle(track);
        const animName = computedStyle.animationName || 'scroll';
        const animDuration = parseFloat(computedStyle.animationDuration) || 40;

        function getTranslateX() {
            const style = window.getComputedStyle(track);
            const matrix = new DOMMatrix(style.transform);
            return matrix.m41;
        }

        function pauseAnimation() {
            // Freeze the track at its current visual position
            currentTranslate = getTranslateX();
            track.style.animation = 'none';
            track.style.transform = `translateX(${currentTranslate}px)`;
        }

        function resumeAnimation() {
            // The track has items duplicated, so total scrollable = scrollWidth / 2
            const halfWidth = track.scrollWidth / 2;

            // Normalize position into the range [0, -halfWidth)
            let pos = currentTranslate % halfWidth;
            if (pos > 0) pos -= halfWidth;
            // pos is now between -halfWidth and 0

            // Figure out how far through the animation this position is (0 to 1)
            // Animation goes from 0 → -halfWidth, so fraction = pos / -halfWidth
            const fraction = pos / -halfWidth; // 0..1

            // Compute the negative delay so CSS animation starts from this point
            const delay = -(fraction * animDuration);

            // Remove inline transform, restart animation from calculated offset
            track.style.transform = '';
            // Force a reflow so browser registers the animation reset
            void track.offsetHeight;
            track.style.animation = `${animName} ${animDuration}s linear infinite`;
            track.style.animationDelay = `${delay}s`;
        }

        // Touch events
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            dragStartTime = Date.now();
            pauseAnimation();
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].clientX;
            const diff = x - startX;
            track.style.transform = `translateX(${currentTranslate + diff}px)`;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            currentTranslate += diff;

            // Quick tap — don't interfere (let click events through)
            const elapsed = Date.now() - dragStartTime;
            if (Math.abs(diff) < 5 && elapsed < 200) {
                resumeAnimation();
                return;
            }

            resumeAnimation();
        }, { passive: true });

        // Mouse events (desktop drag)
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            dragStartTime = Date.now();
            track.style.cursor = 'grabbing';
            pauseAnimation();
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const diff = e.clientX - startX;
            track.style.transform = `translateX(${currentTranslate + diff}px)`;
        });

        window.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const diff = e.clientX - startX;
            currentTranslate += diff;
            track.style.cursor = '';
            resumeAnimation();
        });
    }

    // Apply to all carousel tracks (screenshots + testimonials)
    document.querySelectorAll('.carousel-container').forEach(container => {
        const track = container.querySelector('.carousel-track');
        if (track) makeDraggable(container, track);
    });

    // 1. Reveal Elements on Scroll
    const reveal = () => {
        document.querySelectorAll('.reveal').forEach(el => {
            const windowHeight = window.innerHeight;
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - 100) el.classList.add('active');
        });
    };
    window.addEventListener('scroll', reveal);
    reveal();

    // 2. Load Pricing Data from "Backend" (localStorage)
    const loadPricing = () => {
        const prices = JSON.parse(localStorage.getItem('pb_prices')) || {
            starter: "$59",
            silver: "$449",
            platinum: "$1,119"
        };
        if(document.getElementById('price-starter')) {
            document.getElementById('price-starter').innerText = prices.starter;
            document.getElementById('price-silver').innerText = prices.silver;
            document.getElementById('price-platinum').innerText = prices.platinum;
        }
    };
    loadPricing();

    // 3. Load Approved Testimonials
    const loadTestimonials = () => {
        const track = document.getElementById('testimonial-track');
        if (!track) return;
        
        const reviews = JSON.parse(localStorage.getItem('pb_reviews')) || [];
        const approved = reviews.filter(r => r.status === 'approved');
        
        if (approved.length > 0) {
            // In a real app, we'd clear and rebuild, but here we append new ones
            approved.forEach(rev => {
                const div = document.createElement('div');
                div.className = "testimonial-card";
                div.innerHTML = `
                    <div class="p-8 bg-white/[0.02] border border-white/10 rounded-3xl w-[350px] mx-4">
                        <p class="italic text-slate-300 mb-6">"${rev.text}"</p>
                        <p class="font-bold text-white">${rev.name}</p>
                    </div>
                `;
                track.prepend(div);
            });
        }
    };
    loadTestimonials();

    // 4. Handle Review Submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newReview = {
                id: Date.now(),
                name: document.getElementById('revName').value,
                text: document.getElementById('revText').value,
                status: 'pending'
            };
            
            const existing = JSON.parse(localStorage.getItem('pb_reviews')) || [];
            existing.push(newReview);
            localStorage.setItem('pb_reviews', JSON.stringify(existing));
            
            alert('Review submitted! It will appear once approved by admin.');
            reviewForm.reset();
        });
    }
});