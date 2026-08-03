(function () {
    'use strict';

    var TRANSITION_KEY = 'bysyuan-page-transition';
    var OVERLAY_FADE_MS = 360;
    var LOGO_FILL_MS = 760;
    var LOGO_HOLD_MS = 180;
    var OVERLAY_OUT_MS = 360;
    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var isReducedMotion = reducedMotionQuery.matches;
    var isLeaving = false;

    function createOverlay() {
        var existing = document.querySelector('.page-transition-overlay');
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        overlay.innerHTML =
            '<div class="page-transition-logo-stack">' +
                '<img class="page-transition-logo page-transition-logo--base" src="assets/images/logo.png" alt="">' +
                '<img class="page-transition-logo page-transition-logo--fill" src="assets/images/logo.png" alt="">' +
            '</div>';

        document.body.appendChild(overlay);
        return overlay;
    }

    function resetOverlayState(overlay) {
        overlay.classList.remove('is-active');
        overlay.classList.remove('is-revealing');
        overlay.classList.remove('is-fading-out');
    }

    function isSamePageAnchor(url) {
        return url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            url.search === window.location.search &&
            url.hash.length > 0;
    }

    function shouldIgnoreLink(anchor, event) {
        if (!anchor) return true;
        if (isReducedMotion) return true;
        if (event.defaultPrevented) return true;
        if (event.button !== 0) return true;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
        if (anchor.target && anchor.target.toLowerCase() !== '_self') return true;
        if (anchor.hasAttribute('download')) return true;

        var href = anchor.getAttribute('href');
        if (!href || href.trim() === '') return true;
        if (href.charAt(0) === '#') return true;

        var url;
        try {
            url = new URL(anchor.href, window.location.href);
        } catch (err) {
            return true;
        }

        if (url.origin !== window.location.origin) return true;
        if (url.protocol === 'mailto:' || url.protocol === 'tel:' || url.protocol === 'javascript:') return true;
        if (isSamePageAnchor(url)) return true;
        if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return true;

        return false;
    }

    function revealOnPageLoad() {
        if (isReducedMotion) {
            sessionStorage.removeItem(TRANSITION_KEY);
            return;
        }

        if (sessionStorage.getItem(TRANSITION_KEY) !== '1') {
            return;
        }

        sessionStorage.removeItem(TRANSITION_KEY);

        var overlay = createOverlay();
        resetOverlayState(overlay);
        overlay.classList.add('is-active');

        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 360ms cubic-bezier(0.16, 1, 0.3, 1)';

        requestAnimationFrame(function () {
            window.setTimeout(function () {
                overlay.classList.add('is-revealing');
            }, OVERLAY_FADE_MS);
        });

        window.setTimeout(function () {
            overlay.classList.add('is-fading-out');
            document.body.style.opacity = '1';
        }, OVERLAY_FADE_MS + LOGO_FILL_MS + LOGO_HOLD_MS);

        window.setTimeout(function () {
            overlay.remove();
            document.body.style.removeProperty('transition');
            document.body.style.removeProperty('opacity');
        }, OVERLAY_FADE_MS + LOGO_FILL_MS + LOGO_HOLD_MS + OVERLAY_OUT_MS);
    }

    function leavePage(url) {
        if (isLeaving) return;
        isLeaving = true;

        var overlay = createOverlay();
        resetOverlayState(overlay);

        document.body.style.transition = 'opacity 340ms cubic-bezier(0.16, 1, 0.3, 1)';

        requestAnimationFrame(function () {
            overlay.classList.add('is-active');
            document.body.style.opacity = '0';

            window.setTimeout(function () {
                sessionStorage.setItem(TRANSITION_KEY, '1');
                window.location.assign(url);
            }, OVERLAY_FADE_MS);
        });
    }

    document.addEventListener('click', function (event) {
        var anchor = event.target.closest('a[href]');
        if (shouldIgnoreLink(anchor, event)) return;

        var destination = new URL(anchor.href, window.location.href);
        event.preventDefault();
        leavePage(destination.href);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealOnPageLoad);
    } else {
        revealOnPageLoad();
    }

    window.addEventListener('pageshow', function () {
        document.body.style.removeProperty('transition');
        document.body.style.removeProperty('opacity');
        isLeaving = false;
    });
})();
