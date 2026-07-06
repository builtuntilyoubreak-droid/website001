/* ===== The Event Originators — Interactions (Elegant) ===== */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Loader ---------- */
    window.addEventListener('load', function () {
        setTimeout(function () {
            var loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
            window.dispatchEvent(new Event('teo:ready'));
        }, 800);
    });
    // Safety: hide loader even if load already fired
    setTimeout(function () {
        var loader = document.getElementById('loader');
        if (loader && !loader.classList.contains('hidden')) {
            loader.classList.add('hidden');
            window.dispatchEvent(new Event('teo:ready'));
        }
    }, 3000);

    /* ---------- Scroll progress + nav state ---------- */
    var nav = document.getElementById('nav');
    var progress = document.getElementById('scrollProgress');
    function onScroll() {
        var st = window.scrollY || document.documentElement.scrollTop;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
        if (nav) nav.classList.toggle('scrolled', st > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    var burger = document.getElementById('burger');
    var navLinks = document.getElementById('navLinks');
    var navCta = document.querySelector('.nav__cta');
    function toggleMenu(open) {
        var o = (open === undefined) ? !burger.classList.contains('open') : open;
        burger.classList.toggle('open', o);
        navLinks.classList.toggle('open', o);
        // Prevent body scroll when menu is open
        document.body.style.overflow = o ? 'hidden' : '';
    }
    if (burger) burger.addEventListener('click', function () { toggleMenu(); });
    navLinks && navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { toggleMenu(false); });
    });
    // Close mobile menu on escape key or clicking outside
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && burger && burger.classList.contains('open')) {
            toggleMenu(false);
        }
    });
    document.addEventListener('click', function (e) {
        if (burger && burger.classList.contains('open')) {
            if (!navLinks.contains(e.target) && !burger.contains(e.target)) {
                toggleMenu(false);
            }
        }
    });

    /* ---------- Reveal on scroll ---------- */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
        // stagger hero items
        var heroReveals = document.querySelectorAll('.hero .reveal');
        heroReveals.forEach(function (el, i) { el.style.transitionDelay = (0.15 + i * 0.15) + 's'; });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- Stats counters ---------- */
    var statsRan = false;
    var statsSection = document.getElementById('stats');
    function runStats() {
        if (statsRan) return; statsRan = true;
        document.querySelectorAll('.stat__num').forEach(function (el) {
            var target = parseFloat(el.getAttribute('data-target'));
            var suffix = el.getAttribute('data-suffix') || '';
            var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
            var dur = 2200, start = 0, t0 = null;
            function step(ts) {
                if (!t0) t0 = ts;
                var p = Math.min((ts - t0) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                var val = start + (target - start) * eased;
                el.textContent = val.toFixed(decimals) + suffix;
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = target.toFixed(decimals) + suffix;
            }
            requestAnimationFrame(step);
        });
    }
    if (statsSection && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { runStats(); obs.disconnect(); }
            });
        }, { threshold: 0.3 }).observe(statsSection);
    } else { runStats(); }

    /* ---------- Gentle hover tilt for [data-tilt] (desktop only) ---------- */
    var isTouch = window.matchMedia('(hover: none)').matches;
    if (!isTouch && !reduceMotion) {
        document.querySelectorAll('[data-tilt]').forEach(function (el) {
            var max = el.classList.contains('gallery__tile') ? 8 : 6;
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = 'perspective(900px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateZ(4px)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
                el.style.transition = 'transform 0.5s ease';
                setTimeout(function () { el.style.transition = ''; }, 500);
            });
        });
    }

    /* ---------- Service card tap-flip on touch ---------- */
    if (isTouch) {
        document.querySelectorAll('.service-card').forEach(function (card) {
            card.addEventListener('click', function () {
                // Close other open cards first
                document.querySelectorAll('.service-card.flipped').forEach(function (other) {
                    if (other !== card) other.classList.remove('flipped');
                });
                card.classList.toggle('flipped');
            });
        });
    }

    /* ---------- 3D Carousel ---------- */
    (function carousel() {
        var track = document.getElementById('carouselTrack');
        var prev = document.getElementById('evPrev');
        var next = document.getElementById('evNext');
        if (!track) return;
        var cards = Array.prototype.slice.call(track.querySelectorAll('.carousel__card'));
        var count = cards.length;
        var dragStart = null, dragging = false, dragMoved = false;

        function layout() {
            var w = window.innerWidth;
            var spread = w < 600 ? 0.48 : 0.42;
            for (var i = 0; i < count; i++) {
                var offset = ((i - index) + count) % count;
                if (offset > count / 2) offset -= count;
                var abs = Math.abs(offset);
                var inView = abs <= 2;
                var tx = offset * spread * 100 + '%';
                var tz = -abs * 160;
                var ry = offset * -28;
                var scale = 1 - abs * 0.1;
                var card = cards[i];
                card.style.transform = 'translate(-50%,-50%) translateX(' + tx + ') translateZ(' + tz + 'px) rotateY(' + ry + 'deg) scale(' + Math.max(scale, 0.65) + ')';
                card.style.opacity = inView ? (1 - abs * 0.25) : 0;
                card.style.zIndex = String(100 - abs);
                card.style.filter = 'brightness(' + (1 - abs * 0.12) + ')';
                card.style.pointerEvents = inView ? 'auto' : 'none';
            }
        }

        function go(dir) { index = (index + dir + count) % count; layout(); }
        if (prev) prev.addEventListener('click', function () { go(-1); });
        if (next) next.addEventListener('click', function () { go(1); });

        // click a side card to bring it center
        cards.forEach(function (card, i) {
            card.addEventListener('click', function (e) {
                if (dragMoved) {
                    e.preventDefault();
                    return;
                }
                if (i !== index) { index = i; layout(); }
            });
        });

        // drag / swipe
        var stage = document.getElementById('carousel');
        function onPointerMove(e) {
            if (!dragging) return;
            if (Math.abs(e.clientX - dragStart) > 10) {
                dragMoved = true;
            }
        }
        if (stage) {
            stage.addEventListener('pointerdown', function (e) {
                dragging = true;
                dragStart = e.clientX;
                dragMoved = false;
                window.addEventListener('pointermove', onPointerMove);
            });
            window.addEventListener('pointerup', function (e) {
                if (!dragging) return;
                dragging = false;
                window.removeEventListener('pointermove', onPointerMove);
                var dx = e.clientX - dragStart;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            });
        }

        // keyboard
        document.addEventListener('keydown', function (e) {
            var rect = stage && stage.getBoundingClientRect();
            var visible = rect && rect.top < window.innerHeight && rect.bottom > 0;
            if (!visible) return;
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
        });

        // autoplay (paused on hover & touch)
        var timer = null;
        function startAuto() {
            if (reduceMotion) return;
            timer = setInterval(function () { if (!dragging) go(1); }, 5000);
        }
        function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
        if (stage) {
            stage.addEventListener('mouseenter', stopAuto);
            stage.addEventListener('mouseleave', startAuto);
            stage.addEventListener('touchstart', stopAuto, { passive: true });
        }
        startAuto();

        layout();
        window.addEventListener('resize', layout);
    })();

    /* ---------- Voices slider ---------- */
    (function voices() {
        var track = document.getElementById('voicesTrack');
        var dotsWrap = document.getElementById('voicesDots');
        if (!track) return;
        var items = track.querySelectorAll('.voice');
        var total = items.length;
        var current = 0;
        var dots = [];
        for (var i = 0; i < total; i++) {
            (function (i) {
                var d = document.createElement('button');
                d.className = 'voices__dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', 'Testimonial ' + (i + 1));
                d.addEventListener('click', function () { current = i; update(); resetAuto(); });
                dotsWrap.appendChild(d); dots.push(d);
            })(i);
        }
        // Swipe support for testimonials
        var startX = 0;
        var slider = document.getElementById('voicesSlider');
        if (slider) {
            slider.addEventListener('touchstart', function (e) {
                startX = e.touches[0].clientX;
            }, { passive: true });
            slider.addEventListener('touchend', function (e) {
                var dx = e.changedTouches[0].clientX - startX;
                if (Math.abs(dx) > 50) {
                    current = dx < 0 ? Math.min(current + 1, total - 1) : Math.max(current - 1, 0);
                    update();
                    resetAuto();
                }
            }, { passive: true });
        }
        function update() {
            track.style.transform = 'translateX(' + (-current * 100) + '%)';
            dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
        }
        var auto = null;
        function resetAuto() {
            if (auto) clearInterval(auto);
            if (reduceMotion) return;
            auto = setInterval(function () { current = (current + 1) % total; update(); }, 6000);
        }
        resetAuto();
        if (slider) {
            slider.addEventListener('mouseenter', function () { if (auto) clearInterval(auto); });
            slider.addEventListener('mouseleave', resetAuto);
        }
    })();

    /* ---------- Contact form ---------- */
    var form = document.getElementById('contactForm');
    var note = document.getElementById('formNote');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.querySelector('#name');
            var email = form.querySelector('#email');
            var type = form.querySelector('#type');
            var msg = form.querySelector('#message');
            var ok = true;
            [name, email, type, msg].forEach(function (f) {
                if (!f.value.trim()) { ok = false; f.style.borderBottomColor = '#DB7093'; }
                else { f.style.borderBottomColor = ''; }
            });
            if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                ok = false; email.style.borderBottomColor = '#DB7093';
            }
            if (!ok) {
                if (note) {
                    note.textContent = 'Please complete all fields with a valid email.';
                    note.style.color = '#DB7093';
                }
                return;
            }
            var btn = form.querySelector('button[type="submit"]');
            var orig = btn.textContent;
            btn.textContent = 'Sending…'; btn.disabled = true;
            setTimeout(function () {
                btn.textContent = 'Inquiry Sent ✓';
                if (note) {
                    note.textContent = 'Thank you, ' + name.value.split(' ')[0] + '! A producer will reach out within 24 hours.';
                    note.style.color = '';
                }
                form.reset();
                setTimeout(function () { btn.textContent = orig; btn.disabled = false; }, 3000);
            }, 1200);
        });
    }

    /* ---------- Smooth anchor offset fix ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            if (id.length < 2) return;
            var target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            var top = target.getBoundingClientRect().top + (window.scrollY || 0) - 10;
            window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });
})();
