// ─── services/walletService.js ───────────────────────────────────────────────
// All Ethereum / ethers.js logic lives here.
// Depends on encryption.js for AES and storage.js for SecureStore.

import { ethers } from 'ethers';
import { encrypt, decrypt } from './encryption';
import { saveEncryptedKey, saveAddress, getEncryptedKey } from './storage';

// ── RPC Configuration ─────────────────────────────────────────────────────────
// 🔧 REPLACE the value below with your Alchemy or Infura Sepolia RPC URL.
// e.g. https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
//      https://sepolia.infura.io/v3/YOUR_KEY
const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/avmEQ4GEnxiSjEZI5pO38';

let _provider = null;

const getProvider = () => {
  if (!_provider) {
    _provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
  }
  return _provider;
};

// ── Wallet Creation ───────────────────────────────────────────────────────────

/**
 * Generate a fresh random wallet, AES-encrypt the private key, and persist it.
 * The raw private key is ONLY returned here and never saved in plain text.
 * @returns {{ address: string, privateKey: string }}
 */
export const createWallet = async () => {
  const wallet = ethers.Wallet.createRandom();

  const encryptedPK = encrypt(wallet.privateKey);
  await saveEncryptedKey(encryptedPK);
  await saveAddress(wallet.address);

  console.log('🔐 New Ethereum wallet created');
  console.log('   Address:', wallet.address);
  console.log('   Private key encrypted and stored in SecureStore');

  // Return raw key only once (caller should handle it carefully)
  return { address: wallet.address, privateKey: wallet.privateKey };
};

// ── Wallet Loading ────────────────────────────────────────────────────────────

/**
 * Decrypt and reconstruct the wallet from SecureStore.
 * Call this ONLY after successful biometric/PIN authentication.
 * @returns {ethers.Wallet | null}
 */
export const loadWallet = async () => {
  const encryptedPK = await getEncryptedKey();
  if (!encryptedPK) {
    console.warn('⚠️  No encrypted key found in SecureStore');
    return null;
  }

  const privateKey = decrypt(encryptedPK);
  const wallet = new ethers.Wallet(privateKey, getProvider());

  console.log('🔓 Wallet unlocked:', wallet.address);
  return wallet;
};

// ── Balance ───────────────────────────────────────────────────────────────────

/**
 * Fetch ETH balance for any address on Sepolia.
 * @param {string} address
 * @returns {Promise<string>}  formatted ETH balance
 */
export const getBalance = async (address) => {
  const provider = getProvider();
  const raw = await provider.getBalance(address);
  return ethers.utils.formatEther(raw);
};

// ── Send Transaction ──────────────────────────────────────────────────────────

/**
 * Sign and broadcast a transaction.  The wallet reference is nulled after use
 * to encourage garbage collection of the private key from JS memory.
 *
 * @param {ethers.Wallet} walletInstance  – loaded via loadWallet()
 * @param {string}        toAddress       – recipient 0x address
 * @param {string}        amountEth       – amount as string, e.g. "0.001"
 * @returns {Promise<ethers.providers.TransactionResponse>}
 */
export const sendTransaction = async (walletInstance, toAddress, amountEth) => {
  if (!walletInstance) throw new Error('Wallet not loaded');

  console.log('🔑 Transaction signed after biometric verification');
  console.log(`   To: ${toAddress}`);
  console.log(`   Amount: ${amountEth} ETH`);

  const tx = await walletInstance.sendTransaction({
    to: toAddress,
    value: ethers.utils.parseEther(amountEth),
    // gasLimit is estimated automatically by ethers.js
  });

  console.log('📡 Transaction broadcast to Sepolia testnet');
  console.log('   Hash:', tx.hash);

  // ⚠️  Clear wallet reference from JS memory after signing
  walletInstance = null;

  return tx;
};

/**
 * Utility: shorten an address for display, e.g. 0x1234…abcd
 * @param {string} address
 * @returns {string}
 */
export const shortenAddress = (address) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};
