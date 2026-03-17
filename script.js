const DEFAULT_SETTINGS = {
    searchEngine: 'google',
    cacheEnabled: true,
    refreshInterval: 0,
    adBlocking: true,
    trackerBlocking: true,
    disableJS: false,
    userAgentSpoof: false,
    theme: 'auto',
    fontSize: 'normal',
    compactMode: false,
    customProxy: 'https://api.allorigins.win/get?url=',
    corsBypass: true,
    timeout: 30000,
    debugMode: false
};

class CapitalsProxy {
    constructor() {
        this.settings = this.loadSettings();
        this.initializeUI();
        this.setupEventListeners();
        this.applySettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('capitalsSettings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }

    saveSettings() {
        localStorage.setItem('capitalsSettings', JSON.stringify(this.settings));
    }

    initializeUI() {
        document.getElementById('searchEngine').value = this.settings.searchEngine;
        document.getElementById('cacheToggle').checked = this.settings.cacheEnabled;
        document.getElementById('refreshInterval').value = this.settings.refreshInterval;
        document.getElementById('adBlocking').checked = this.settings.adBlocking;
        document.getElementById('trackerBlocking').checked = this.settings.trackerBlocking;
        document.getElementById('disableJS').checked = this.settings.disableJS;
        document.getElementById('userAgentSpoof').checked = this.settings.userAgentSpoof;
        document.getElementById('theme').value = this.settings.theme;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('compactMode').checked = this.settings.compactMode;
        document.getElementById('customProxy').value = this.settings.customProxy;
        document.getElementById('corsToggle').checked = this.settings.corsBypass;
        document.getElementById('timeout').value = this.settings.timeout;
        document.getElementById('debugMode').checked = this.settings.debugMode;
    }

    setupEventListeners() {
        document.getElementById('goBtn').addEventListener('click', () => this.browse());
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.browse();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.querySelector('.close-btn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.applySettingsFromUI());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.shortcut').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('urlInput').value = btn.dataset.url;
                this.browse();
            });
        });

        document.getElementById('clearCookies').addEventListener('click', () => this.clearCookies());
        document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());
        document.getElementById('importSettings').addEventListener('click', () => 
            document.getElementById('settingsFile').click()
        );
        document.getElementById('settingsFile').addEventListener('change', (e) => this.importSettings(e));

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('settingsModal');
            if (e.target === modal) this.closeSettings();
        });
    }

    browse() {
        const url = document.getElementById('urlInput').value.trim();
        if (!url) {
            alert('Please enter a URL or search term');
            return;
        }

        let finalUrl = url;
        
        if (!url.includes('.') || !url.includes('://')) {
            const searchEngines = {
                google: 'https://www.google.com/search?q=',
                bing: 'https://www.bing.com/search?q=',
                duckduckgo: 'https://duckduckgo.com/?q=',
                yahoo: 'https://search.yahoo.com/search?p='
            };
            finalUrl = searchEngines[this.settings.searchEngine] + encodeURIComponent(url);
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = 'https://' + url;
        }

        this.loadProxy(finalUrl);
    }

    loadProxy(url) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<div class="loading">⏳ Loading...</div>';

        let proxyUrl = this.settings.customProxy + encodeURIComponent(url);

        fetch(proxyUrl, {
            method: 'GET',
            timeout: this.settings.timeout
        })
        .then(res => res.json())
        .then(data => {
            let content = data.contents || '';

            if (this.settings.adBlocking) {
                content = this.removeAds(content);
            }
            if (this.settings.trackerBlocking) {
                content = this.removeTrackers(content);
            }
            if (this.settings.disableJS) {
                content = this.disableJavaScript(content);
            }

            const iframe = document.createElement('iframe');
            iframe.srcdoc = content;
            resultDiv.innerHTML = '';
            resultDiv.appendChild(iframe);
        })
        .catch(err => {
            resultDiv.innerHTML = `<div class="error">❌ Error loading content. Please check the URL.</div>`;
        });
    }

    removeAds(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const adSelectors = ['[class*="ad"]', '[id*="ad"]', '[class*="banner"]', 'ins'];
        adSelectors.forEach(selector => {
            tempDiv.querySelectorAll(selector).forEach(el => el.remove());
        });

        return tempDiv.innerHTML;
    }

    removeTrackers(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const trackerSelectors = ['[src*="google-analytics"]', '[src*="facebook.com"]', 'img[src*="pixel"]'];
        trackerSelectors.forEach(selector => {
            tempDiv.querySelectorAll(selector).forEach(el => el.remove());
        });

        return tempDiv.innerHTML;
    }

    disableJavaScript(html) {
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    applySettingsFromUI() {
        this.settings.searchEngine = document.getElementById('searchEngine').value;
        this.settings.cacheEnabled = document.getElementById('cacheToggle').checked;
        this.settings.refreshInterval = document.getElementById('refreshInterval').value;
        this.settings.adBlocking = document.getElementById('adBlocking').checked;
        this.settings.trackerBlocking = document.getElementById('trackerBlocking').checked;
        this.settings.disableJS = document.getElementById('disableJS').checked;
        this.settings.userAgentSpoof = document.getElementById('userAgentSpoof').checked;
        this.settings.theme = document.getElementById('theme').value;
        this.settings.fontSize = document.getElementById('fontSize').value;
        this.settings.compactMode = document.getElementById('compactMode').checked;
        this.settings.customProxy = document.getElementById('customProxy').value;
        this.settings.corsBypass = document.getElementById('corsToggle').checked;
        this.settings.timeout = parseInt(document.getElementById('timeout').value);
        this.settings.debugMode = document.getElementById('debugMode').checked;

        this.saveSettings();
        this.applySettings();
        this.closeSettings();
        alert('✅ Settings saved!');
    }

    applySettings() {
        document.body.classList.remove('dark-mode', 'light-mode');
        if (this.settings.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) document.body.classList.add('dark-mode');
        } else if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        document.body.classList.remove('font-small', 'font-normal', 'font-large');
        document.body.classList.add(`font-${this.settings.fontSize}`);
        document.body.classList.toggle('compact-mode', this.settings.compactMode);
    }

    clearCookies() {
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });

        localStorage.clear();
        sessionStorage.clear();
        alert('✅ Cookies and data cleared!');
    }

    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'capitals-settings.json';
        link.click();
    }

    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...imported };
                this.saveSettings();
                this.initializeUI();
                this.applySettings();
                alert('✅ Settings imported!');
            } catch (err) {
                alert('❌ Invalid settings file');
            }
        };
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CapitalsProxy();
});
