class ShareManager {
    constructor() {
        this.initQRCode();
        this.addShareButton();
    }

    initQRCode() {
        // Add QRCode.js script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
        document.head.appendChild(script);

        // Wait for script to load
        script.onload = () => {
            this.qrCodeReady = true;
        };
    }

    addShareButton() {
        // Add share button to mobile nav
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'mobile-nav-item';
            shareBtn.innerHTML = `
                <i class="fas fa-share-alt"></i>
                <span>Share</span>
            `;
            shareBtn.onclick = () => this.showShareOptions();
            mobileNav.appendChild(shareBtn);
        }
    }

    showShareOptions() {
        const options = [
            { text: 'Share via WhatsApp', action: () => this.shareViaWhatsApp() },
            { text: 'Show QR Code', action: () => this.showQRCode() },
            { text: 'Copy Link', action: () => this.copyLink() }
        ];

        // Use existing action sheet functionality
        if (window.mobileUI) {
            window.mobileUI.showActionSheet('Share App', options);
        }
    }

    async shareViaWhatsApp() {
        const appUrl = window.location.href;
        const message = encodeURIComponent(
            '📱 Check out this Task Manager app!\n\n' +
            '✨ Features:\n' +
            '- Daily, weekly & monthly tasks\n' +
            '- Progress tracking\n' +
            '- Mobile-friendly\n\n' +
            'Install it here: ' + appUrl
        );
        
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }

    showQRCode() {
        if (!this.qrCodeReady) {
            setTimeout(() => this.showQRCode(), 500);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <h3>Scan to Install App</h3>
                <div id="qrcode"></div>
                <p>Open this link on your mobile device to install the app</p>
                <button class="close-btn">Close</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Generate QR Code
        QRCode.toCanvas(document.getElementById('qrcode'), window.location.href, {
            width: 256,
            margin: 2,
            color: {
                dark: '#667eea',
                light: '#ffffff'
            }
        });

        // Close button handler
        modal.querySelector('.close-btn').onclick = () => {
            modal.remove();
        };

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    async copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            if (window.mobileUI) {
                window.mobileUI.showNotification('Link copied to clipboard');
            }
        } catch (err) {
            if (window.mobileUI) {
                window.mobileUI.showNotification('Failed to copy link');
            }
        }
    }
}

// Initialize ShareManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shareManager = new ShareManager();
});
