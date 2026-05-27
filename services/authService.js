// ─── services/authService.js ─────────────────────────────────────────────────
// Handles biometric authentication via expo-local-authentication.
// Falls back to a hardcoded PIN (1234) for demo purposes.
// ⚠️  BioVault NEVER stores biometric data – biometrics only gate access to
//    the encrypted private key held in the secure enclave.

import * as LocalAuthentication from 'expo-local-authentication';

/** Hardcoded demo PIN – replace with a user-set PIN + salted hash in production. */
const DEMO_PIN = '1234';

// ── Capability checks ─────────────────────────────────────────────────────────

/**
 * Check whether the device has biometric hardware AND enrolled credentials.
 * @returns {{ compatible: boolean, enrolled: boolean, types: number[] }}
 */
export const checkBiometricAvailability = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled   = await LocalAuthentication.isEnrolledAsync();
  const types      = compatible
    ? await LocalAuthentication.supportedAuthenticationTypesAsync()
    : [];
  return { compatible, enrolled, types };
};

// ── Biometric auth ────────────────────────────────────────────────────────────

/**
 * Prompt the user for biometric (fingerprint / Face ID) authentication.
 * @param {string} [promptMessage]
 * @returns {Promise<{ success: boolean, error?: string, fallbackNeeded?: boolean }>}
 */
export const authenticateWithBiometrics = async (
  promptMessage = 'Authenticate to access BioVault'
) => {
  const { compatible, enrolled } = await checkBiometricAvailability();

  if (!compatible) {
    console.warn('⚠️  Device has no biometric hardware');
    return { success: false, error: 'No biometric hardware', fallbackNeeded: true };
  }
  if (!enrolled) {
    console.warn('⚠️  No biometric credentials enrolled');
    return { success: false, error: 'No biometrics enrolled', fallbackNeeded: true };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: false,   // allow system PIN/pattern fallback
    cancelLabel: 'Cancel',
  });

  if (result.success) {
    console.log('✅ Biometric authentication successful');
    // Small delay so any system overlay can dismiss cleanly
    await new Promise((r) => setTimeout(r, 300));
  } else {
    console.warn('❌ Biometric authentication failed:', result.error);
  }

  return result;
};

// ── PIN auth ──────────────────────────────────────────────────────────────────

/**
 * Validate the entered PIN against the demo PIN.
 * In production, compare against a securely-stored salted hash.
 * @param {string} enteredPin
 * @returns {{ success: boolean }}
 */
export const authenticateWithPIN = (enteredPin) => {
  const success = enteredPin === DEMO_PIN;
  if (success) {
    console.log('✅ PIN authentication successful');
  } else {
    console.warn('❌ PIN authentication failed – wrong PIN');
  }
  return { success };
};
