/* i18n - Internationalization module (IIFE with try-catch) */
;(function() {
    'use strict';
    try {
        var I18n = function() {
            this.translations = {};
            this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'pt', 'id', 'tr', 'de', 'fr', 'hi', 'ru'];
            this.currentLang = this.detectLanguage();
            this.isLoading = false;
        };

        I18n.prototype.detectLanguage = function() {
            // Check localStorage
            var saved = localStorage.getItem('preferredLanguage');
            if (saved && this.supportedLanguages.indexOf(saved) !== -1) {
                return saved;
            }
            // Browser language detection
            var browserLang = navigator.language.split('-')[0].toLowerCase();
            if (this.supportedLanguages.indexOf(browserLang) !== -1) {
                return browserLang;
            }
            // Default: Korean
            return 'ko';
        };

        I18n.prototype.loadTranslations = function(lang) {
            var self = this;
            if (self.isLoading) return Promise.resolve();

            return new Promise(function(resolve) {
                try {
                    self.isLoading = true;

                    if (self.translations[lang]) {
                        self.isLoading = false;
                        resolve(self.translations[lang]);
                        return;
                    }

                    fetch('js/locales/' + lang + '.json')
                        .then(function(response) {
                            if (!response.ok) throw new Error('Failed to load language: ' + lang);
                            return response.json();
                        })
                        .then(function(data) {
                            self.translations[lang] = data;
                            self.isLoading = false;
                            resolve(data);
                        })
                        .catch(function(error) {
                            console.error('Error loading translations:', error);
                            self.isLoading = false;
                            if (lang !== 'ko') {
                                self.loadTranslations('ko').then(resolve);
                            } else {
                                resolve(null);
                            }
                        });
                } catch (e) {
                    console.error('i18n loadTranslations error:', e);
                    self.isLoading = false;
                    resolve(null);
                }
            });
        };

        I18n.prototype.t = function(key) {
            var keys = key.split('.');
            var value = this.translations[this.currentLang];

            if (!value) return key;

            for (var i = 0; i < keys.length; i++) {
                if (value && typeof value === 'object' && keys[i] in value) {
                    value = value[keys[i]];
                } else {
                    return key;
                }
            }

            return value || key;
        };

        I18n.prototype.setLanguage = function(lang) {
            var self = this;
            if (self.supportedLanguages.indexOf(lang) === -1) {
                console.warn('Unsupported language: ' + lang);
                return Promise.resolve();
            }

            self.currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            return self.loadTranslations(lang).then(function() {
                self.updateUI();
                self.updateLangButtons();
            });
        };

        I18n.prototype.updateUI = function() {
            var self = this;
            document.querySelectorAll('[data-i18n]').forEach(function(element) {
                var key = element.getAttribute('data-i18n');
                var text = self.t(key);

                if (text === key) return;

                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.placeholder !== undefined) {
                        element.placeholder = text;
                    }
                } else if (element.tagName === 'META') {
                    element.setAttribute('content', text);
                } else if (element.tagName === 'TITLE') {
                    document.title = text;
                } else {
                    element.textContent = text;
                }
            });
        };

        I18n.prototype.updateLangButtons = function() {
            var self = this;
            document.querySelectorAll('.lang-option').forEach(function(btn) {
                if (btn.getAttribute('data-lang') === self.currentLang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        I18n.prototype.init = function() {
            var self = this;
            return self.loadTranslations(self.currentLang).then(function() {
                self.updateUI();
                self.updateLangButtons();
            });
        };

        // Create global instance and initialize
        window.i18n = new I18n();
        window.i18n.init().catch(function(e) {
            console.error('i18n init error:', e);
        });

    } catch (e) {
        console.error('i18n IIFE error:', e);
    }
})();
