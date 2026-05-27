// ─── screens/AuthScreen.js ───────────────────────────────────────────────────
// First screen: creates wallet on first launch, then gates access via biometrics
// or the demo PIN (1234).

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import {
  authenticateWithBiometrics,
  authenticateWithPIN,
  checkBiometricAvailability,
} from '../services/authService';
import { hasWallet } from '../services/storage';
import { createWallet } from '../services/walletService';

export default function AuthScreen({ navigation }) {
  const [initialising, setInitialising] = useState(true);
  const [showPIN, setShowPIN]           = useState(false);
  const [pin, setPin]                   = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [statusMsg, setStatusMsg]       = useState('Initialising BioVault…');

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    setInitialising(true);
    setStatusMsg('Checking wallet…');

    // Create wallet if this is the very first launch
    const exists = await hasWallet();
    if (!exists) {
      setStatusMsg('Creating secure wallet…');
      await createWallet();
      Alert.alert(
        '🔐 Wallet Created',
        'A new Ethereum wallet has been generated and secured with AES encryption on this device.',
        [{ text: 'OK' }]
      );
    }

    // Check biometric capability
    const { compatible, enrolled } = await checkBiometricAvailability();
    setBioAvailable(compatible && enrolled);
    setInitialising(false);

    if (compatible && enrolled) {
      triggerBiometric();
    } else {
      setShowPIN(true);
    }
  };

  // ── Biometric flow ─────────────────────────────────────────────────────────
  const triggerBiometric = useCallback(async () => {
    const result = await authenticateWithBiometrics('Unlock your BioVault');
    if (result.success) {
      navigation.replace('Dashboard');
    } else if (result.fallbackNeeded) {
      setShowPIN(true);
    }
    // If user cancelled: do nothing – they can tap the button again
  }, [navigation]);

  // ── PIN flow ───────────────────────────────────────────────────────────────
  const handlePINSubmit = () => {
    const result = authenticateWithPIN(pin);
    if (result.success) {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Wrong PIN', 'Incorrect PIN.\n\nDemo PIN: 1234');
      setPin('');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (initialising) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{statusMsg}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>BioVault</Text>
        <Text style={styles.subtitle}>Biometric-Secured Crypto Wallet</Text>

        {!showPIN ? (
          /* ── Biometric section ── */
          <View style={styles.authSection}>
            <TouchableOpacity style={styles.biometricCircle} onPress={triggerBiometric}>
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={styles.biometricLabel}>Touch to{'\n'}Authenticate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPIN(true)}>
              <Text style={styles.linkText}>Use PIN instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── PIN section ── */
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>Enter PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="• • • •"
              placeholderTextColor="#444"
              onSubmitEditing={handlePINSubmit}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePINSubmit}>
              <Text style={styles.primaryBtnText}>Unlock Wallet</Text>
            </TouchableOpacity>
            {bioAvailable && (
              <TouchableOpacity
                onPress={() => { setShowPIN(false); triggerBiometric(); }}
              >
                <Text style={styles.linkText}>Use biometrics instead</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.hintText}>Demo PIN: 1234</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0D0D1A',
  },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  logo:     { fontSize: 64, marginBottom: 12 },
  title:    { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 52, textAlign: 'center' },

  /* Biometric */
  authSection:    { alignItems: 'center' },
  biometricCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#15152A',
    borderWidth: 2, borderColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#6C63FF', shadowOpacity: 0.4,
    shadowRadius: 20, elevation: 8,
  },
  biometricIcon:  { fontSize: 50, marginBottom: 4 },
  biometricLabel: { color: '#aaa', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  /* PIN */
  pinSection: { width: '100%', alignItems: 'center' },
  pinLabel:   { color: '#ccc', fontSize: 16, marginBottom: 14, fontWeight: '600' },
  pinInput: {
    backgroundColor: '#15152A', color: '#fff',
    fontSize: 30, textAlign: 'center', letterSpacing: 14,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    width: '60%', borderWidth: 1, borderColor: '#6C63FF',
    marginBottom: 22,
  },
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 48, marginBottom: 18,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText:  { color: '#6C63FF', fontSize: 14, marginBottom: 14 },
  hintText:  { color: '#444', fontSize: 12, marginTop: 4 },
  loadingText: { color: '#aaa', marginTop: 14, fontSize: 13 },
});
