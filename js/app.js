/* Seollal Greetings Generator - Main App Logic */
;(function() {
    'use strict';

    // ========== STATE ==========
    var state = {
        recipient: null,
        tone: null,
        currentGreetings: [],
        history: [],
        usedIndices: {}
    };

    // ========== DOM REFS ==========
    var screens = {
        intro: document.getElementById('intro-screen'),
        recipient: document.getElementById('recipient-screen'),
        tone: document.getElementById('tone-screen'),
        result: document.getElementById('result-screen')
    };

    var els = {
        loader: document.getElementById('app-loader'),
        themeToggle: document.getElementById('theme-toggle'),
        langBtn: document.getElementById('langBtn'),
        langMenu: document.getElementById('langMenu'),
        btnStart: document.getElementById('btn-start'),
        btnBackIntro: document.getElementById('btn-back-intro'),
        btnBackRecipient: document.getElementById('btn-back-recipient'),
        btnBackTone: document.getElementById('btn-back-tone'),
        btnRegenerate: document.getElementById('btn-regenerate'),
        btnNew: document.getElementById('btn-new'),
        recipientGrid: document.getElementById('recipient-grid'),
        toneOptions: document.getElementById('tone-options'),
        resultInfo: document.getElementById('result-info'),
        greetingCards: document.getElementById('greeting-cards'),
        historySection: document.getElementById('history-section'),
        historyList: document.getElementById('history-list'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        floatingDeco: document.querySelector('.floating-deco')
    };

    // ========== RECIPIENT & TONE LABELS ==========
    var recipientIcons = {
        parents: '👨‍👩‍👧',
        grandparents: '👴👵',
        boss: '👔',
        colleague: '🤝',
        friend: '🎉',
        partner: '💕',
        sns: '📱'
    };

    // ========== INIT ==========
    function init() {
        initTheme();
        initFloatingDeco();
        bindEvents();
        loadHistory();
        hideLoader();
    }

    // ========== LOADER ==========
    function hideLoader() {
        setTimeout(function() {
            if (els.loader) {
                els.loader.classList.add('hidden');
            }
        }, 600);
    }

    // ========== THEME ==========
    function initTheme() {
        var saved = localStorage.getItem('theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (els.themeToggle) els.themeToggle.textContent = '🌙';
        }
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            if (els.themeToggle) els.themeToggle.textContent = '☀️';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            if (els.themeToggle) els.themeToggle.textContent = '🌙';
        }
    }

    // ========== FLOATING DECORATIONS ==========
    function initFloatingDeco() {
        if (!els.floatingDeco) return;
        var emojis = ['🧧', '🐴', '✨', '🎊', '🏮', '💛', '🌸'];
        for (var i = 0; i < 8; i++) {
            var particle = document.createElement('span');
            particle.className = 'float-particle';
            particle.textContent = emojis[i % emojis.length];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = (Math.random() * 8) + 's';
            particle.style.animationDuration = (6 + Math.random() * 6) + 's';
            particle.style.fontSize = (14 + Math.random() * 14) + 'px';
            els.floatingDeco.appendChild(particle);
        }
    }

    // ========== SCREEN NAVIGATION ==========
    function showScreen(name) {
        Object.keys(screens).forEach(function(key) {
            if (screens[key]) {
                if (key === name) {
                    screens[key].classList.remove('hidden');
                    screens[key].classList.add('active');
                } else {
                    screens[key].classList.add('hidden');
                    screens[key].classList.remove('active');
                }
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========== BIND EVENTS ==========
    function bindEvents() {
        // Theme
        if (els.themeToggle) {
            els.themeToggle.addEventListener('click', toggleTheme);
        }

        // Language selector
        if (els.langBtn && els.langMenu) {
            els.langBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                els.langMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', function() {
                els.langMenu.classList.add('hidden');
            });
            els.langMenu.addEventListener('click', function(e) {
                var btn = e.target.closest('.lang-option');
                if (!btn) return;
                var lang = btn.getAttribute('data-lang');
                if (lang && window.i18n) {
                    window.i18n.setLanguage(lang);
                }
                els.langMenu.classList.add('hidden');
            });
        }

        // Start
        if (els.btnStart) {
            els.btnStart.addEventListener('click', function() {
                showScreen('recipient');
                trackEvent('greeting_start', {});
            });
        }

        // Back buttons
        if (els.btnBackIntro) {
            els.btnBackIntro.addEventListener('click', function() {
                showScreen('intro');
            });
        }
        if (els.btnBackRecipient) {
            els.btnBackRecipient.addEventListener('click', function() {
                showScreen('recipient');
            });
        }
        if (els.btnBackTone) {
            els.btnBackTone.addEventListener('click', function() {
                showScreen('tone');
            });
        }

        // Recipient selection
        if (els.recipientGrid) {
            els.recipientGrid.addEventListener('click', function(e) {
                var card = e.target.closest('.select-card');
                if (!card) return;
                state.recipient = card.getAttribute('data-recipient');
                showScreen('tone');
                trackEvent('recipient_select', { recipient: state.recipient });
            });
        }

        // Tone selection
        if (els.toneOptions) {
            els.toneOptions.addEventListener('click', function(e) {
                var card = e.target.closest('.tone-card');
                if (!card) return;
                state.tone = card.getAttribute('data-tone');
                generateGreetings();
                showScreen('result');
                trackEvent('greeting_generate', {
                    recipient: state.recipient,
                    tone: state.tone
                });
            });
        }

        // Regenerate
        if (els.btnRegenerate) {
            els.btnRegenerate.addEventListener('click', function() {
                generateGreetings();
                renderGreetingCards();
                trackEvent('greeting_regenerate', {
                    recipient: state.recipient,
                    tone: state.tone
                });
            });
        }

        // New greeting
        if (els.btnNew) {
            els.btnNew.addEventListener('click', function() {
                state.recipient = null;
                state.tone = null;
                state.usedIndices = {};
                showScreen('intro');
            });
        }

        // Clear history
        if (els.btnClearHistory) {
            els.btnClearHistory.addEventListener('click', function() {
                state.history = [];
                localStorage.removeItem('seollalHistory');
                renderHistory();
            });
        }
    }

    // ========== GREETING GENERATION ==========
    function generateGreetings() {
        var data = window.SEOLLAL_GREETINGS;
        if (!data || !state.recipient || !state.tone) return;

        var pool = data[state.recipient] && data[state.recipient][state.tone];
        if (!pool || pool.length === 0) return;

        // Key for tracking used indices
        var key = state.recipient + '_' + state.tone;
        if (!state.usedIndices[key]) {
            state.usedIndices[key] = [];
        }

        // Pick 3-4 random greetings (avoid repeats if possible)
        var count = Math.min(pool.length >= 5 ? 4 : 3, pool.length);
        var available = [];
        for (var i = 0; i < pool.length; i++) {
            if (state.usedIndices[key].indexOf(i) === -1) {
                available.push(i);
            }
        }

        // If not enough unused, reset
        if (available.length < count) {
            state.usedIndices[key] = [];
            available = [];
            for (var j = 0; j < pool.length; j++) {
                available.push(j);
            }
        }

        // Shuffle and pick
        shuffleArray(available);
        var picked = available.slice(0, count);
        state.usedIndices[key] = state.usedIndices[key].concat(picked);

        state.currentGreetings = picked.map(function(idx) {
            return pool[idx];
        });

        renderResultInfo();
        renderGreetingCards();
    }

    function shuffleArray(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    // ========== RENDER ==========
    function renderResultInfo() {
        if (!els.resultInfo) return;
        var icon = recipientIcons[state.recipient] || '🧧';
        var recipientLabel = getI18nLabel('recipient.' + state.recipient) || state.recipient;
        var toneLabel = getI18nLabel('tone.' + state.tone) || state.tone;
        els.resultInfo.innerHTML = '<span class="ri-icon">' + icon + '</span>' +
            '<span>' + recipientLabel + ' &middot; ' + toneLabel + '</span>';
    }

    function getI18nLabel(key) {
        if (window.i18n && typeof window.i18n.t === 'function') {
            var val = window.i18n.t(key);
            if (val !== key) return val;
        }
        // Fallback Korean labels
        var fallbacks = {
            'recipient.parents': '부모님',
            'recipient.grandparents': '조부모님',
            'recipient.boss': '직장 상사',
            'recipient.colleague': '직장 동료',
            'recipient.friend': '친구',
            'recipient.partner': '연인',
            'recipient.sns': 'SNS용',
            'tone.formal': '격식체',
            'tone.casual': '반말',
            'tone.funny': '재미있는'
        };
        return fallbacks[key] || key;
    }

    function renderGreetingCards() {
        if (!els.greetingCards) return;

        var html = '';
        state.currentGreetings.forEach(function(text, idx) {
            var escapedText = escapeHtml(text);
            html += '<div class="greeting-card">' +
                '<span class="greeting-number">' + (idx + 1) + '</span>' +
                '<div class="greeting-text">' + escapedText + '</div>' +
                '<div class="greeting-actions">' +
                '<button class="btn-action btn-copy" data-index="' + idx + '">📋 ' +
                    (getI18nLabel('button.copy') || '복사') + '</button>' +
                '<button class="btn-action btn-share" data-index="' + idx + '">🔗 ' +
                    (getI18nLabel('button.share') || '공유') + '</button>' +
                '</div>' +
                '</div>';
        });

        els.greetingCards.innerHTML = html;

        // Bind copy/share events
        els.greetingCards.querySelectorAll('.btn-copy').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(btn.getAttribute('data-index'), 10);
                copyGreeting(index, btn);
            });
        });
        els.greetingCards.querySelectorAll('.btn-share').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(btn.getAttribute('data-index'), 10);
                shareGreeting(index);
            });
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========== COPY ==========
    function copyGreeting(index, btn) {
        var text = state.currentGreetings[index];
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                onCopySuccess(text, btn);
            }).catch(function() {
                fallbackCopy(text, btn);
            });
        } else {
            fallbackCopy(text, btn);
        }
    }

    function fallbackCopy(text, btn) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            onCopySuccess(text, btn);
        } catch (e) {
            showToast(getI18nLabel('greeting.copyFailed') || '복사 실패');
        }
        document.body.removeChild(ta);
    }

    function onCopySuccess(text, btn) {
        // Visual feedback
        btn.classList.add('copied');
        var original = btn.innerHTML;
        btn.innerHTML = '✅ ' + (getI18nLabel('greeting.copied') || '복사됨');
        setTimeout(function() {
            btn.classList.remove('copied');
            btn.innerHTML = original;
        }, 2000);

        showToast(getI18nLabel('greeting.copiedToast') || '인사말이 복사되었습니다!');

        // Add to history
        addToHistory(text);

        trackEvent('greeting_copy', {
            recipient: state.recipient,
            tone: state.tone
        });
    }

    // ========== SHARE ==========
    function shareGreeting(index) {
        var text = state.currentGreetings[index];
        if (!text) return;

        if (navigator.share) {
            navigator.share({
                title: getI18nLabel('share.title') || '설날 인사말',
                text: text,
                url: window.location.href
            }).then(function() {
                trackEvent('share', {
                    method: 'native',
                    recipient: state.recipient
                });
            }).catch(function() {
                // User cancelled or share failed
            });
        } else {
            // Fallback: copy to clipboard
            copyGreeting(index, els.greetingCards.querySelectorAll('.btn-share')[index]);
        }
    }

    // ========== HISTORY ==========
    function loadHistory() {
        try {
            var saved = localStorage.getItem('seollalHistory');
            if (saved) {
                state.history = JSON.parse(saved);
            }
        } catch (e) {
            state.history = [];
        }
        renderHistory();
    }

    function addToHistory(text) {
        // Avoid duplicates
        if (state.history.indexOf(text) !== -1) return;
        state.history.unshift(text);
        if (state.history.length > 10) {
            state.history = state.history.slice(0, 10);
        }
        try {
            localStorage.setItem('seollalHistory', JSON.stringify(state.history));
        } catch (e) {
            // Storage full or blocked
        }
        renderHistory();
    }

    function renderHistory() {
        if (!els.historySection || !els.historyList) return;

        if (state.history.length === 0) {
            els.historySection.style.display = 'none';
            return;
        }

        els.historySection.style.display = 'block';
        var html = '';
        state.history.forEach(function(text) {
            html += '<div class="history-item">' + escapeHtml(text) + '</div>';
        });
        els.historyList.innerHTML = html;
    }

    // ========== TOAST ==========
    function showToast(msg) {
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2500);
    }

    // ========== GA4 TRACKING ==========
    function trackEvent(name, params) {
        try {
            if (typeof gtag === 'function') {
                gtag('event', name, params || {});
            }
        } catch (e) {
            // GA not loaded
        }
    }

    // ========== START ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
