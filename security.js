class DataSecurity {
    constructor() {
        this.encryptionKey = this.getOrCreateKey();
    }

    // Get or create encryption key
    getOrCreateKey() {
        let key = localStorage.getItem('encryption_key');
        if (!key) {
            key = this.generateKey();
            localStorage.setItem('encryption_key', key);
        }
        return key;
    }

    // Generate a random encryption key
    generateKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Encrypt data
    encrypt(data) {
        try {
            const stringData = JSON.stringify(data);
            return CryptoJS.AES.encrypt(stringData, this.encryptionKey).toString();
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    // Decrypt data
    decrypt(encryptedData) {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    // Sanitize input
    sanitize(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '')  // Remove potential HTML tags
            .trim();
    }

    // Generate CSRF token
    generateCSRFToken() {
        const token = crypto.getRandomValues(new Uint8Array(32))
            .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
        sessionStorage.setItem('csrf_token', token);
        return token;
    }

    // Validate CSRF token
    validateCSRFToken(token) {
        return token === sessionStorage.getItem('csrf_token');
    }
}
