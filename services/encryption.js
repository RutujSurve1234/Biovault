// ─── services/encryption.js ─────────────────────────────────────────────────
// AES-256 encrypt / decrypt helpers using crypto-js.
// In production, derive SECRET_KEY from a device-specific secret (e.g. Keychain).

import CryptoJS from 'crypto-js';

// ⚠️  Demo only – replace with a securely-derived key in production
const SECRET_KEY = 'BioVault_AES_Demo_Secret_Key_2024';

/**
 * Encrypt a plain-text string (e.g. raw private key).
 * @param {string} text
 * @returns {string} base64 cipher text
 */
export const encrypt = (text) => {
  try {
    const cipher = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    console.log('🔒 Data encrypted successfully');
    return cipher;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt a cipher text string back to plain text.
 * @param {string} cipherText
 * @returns {string} original plain text
 */
export const decrypt = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption produced empty result');
    console.log('🔓 Data decrypted successfully');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data – wrong key or corrupted cipher');
  }
};
