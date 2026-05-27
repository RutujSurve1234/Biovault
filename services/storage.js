// ─── services/storage.js ────────────────────────────────────────────────────
// Thin wrapper around expo-secure-store.
// Only the AES-encrypted private key is ever written to disk.

import * as SecureStore from 'expo-secure-store';

const WALLET_KEY   = 'biovault_encrypted_pk';   // key for the encrypted private key
const ADDRESS_KEY  = 'biovault_wallet_address';  // key for the public address (safe to store plain)

// ── Private Key ──────────────────────────────────────────────────────────────

/** Persist AES-encrypted private key in the secure enclave. */
export const saveEncryptedKey = async (encryptedPrivateKey) => {
  await SecureStore.setItemAsync(WALLET_KEY, encryptedPrivateKey);
  console.log('💾 Encrypted key saved to SecureStore');
};

/** Retrieve the AES-encrypted private key. */
export const getEncryptedKey = async () => {
  return await SecureStore.getItemAsync(WALLET_KEY);
};

/** Wipe the stored key (logout / reset). */
export const clearWallet = async () => {
  await SecureStore.deleteItemAsync(WALLET_KEY);
  await SecureStore.deleteItemAsync(ADDRESS_KEY);
  console.log('🗑️  Wallet data cleared from SecureStore');
};

// ── Address ──────────────────────────────────────────────────────────────────

/** Persist the public address (not sensitive, but kept alongside private key). */
export const saveAddress = async (address) => {
  await SecureStore.setItemAsync(ADDRESS_KEY, address);
};

/** Retrieve the cached public address. */
export const getSavedAddress = async () => {
  return await SecureStore.getItemAsync(ADDRESS_KEY);
};

// ── Utility ──────────────────────────────────────────────────────────────────

/** Returns true if an encrypted wallet already exists on device. */
export const hasWallet = async () => {
  const stored = await SecureStore.getItemAsync(WALLET_KEY);
  return stored !== null && stored !== undefined && stored.length > 0;
};
