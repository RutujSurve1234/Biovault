// ─── screens/SendTransactionScreen.js ───────────────────────────────────────
// Collects recipient address + ETH amount, re-authenticates via biometrics,
// then signs and broadcasts the transaction on Sepolia testnet.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ethers }                          from 'ethers';
import { authenticateWithBiometrics,
         authenticateWithPIN,
         checkBiometricAvailability }      from '../services/authService';
import { loadWallet, sendTransaction }     from '../services/walletService';

// Flow states
const STATE = {
  IDLE:      'IDLE',
  AUTH:      'AUTH',
  SIGNING:   'SIGNING',
  BROADCAST: 'BROADCAST',
  SUCCESS:   'SUCCESS',
};

export default function SendTransactionScreen({ navigation, route }) {
  const [recipient,  setRecipient]  = useState('');
  const [amount,     setAmount]     = useState('');
  const [flowState,  setFlowState]  = useState(STATE.IDLE);
  const [txHash,     setTxHash]     = useState(null);
  const [pinVisible, setPinVisible] = useState(false);
  const [pin,        setPin]        = useState('');

  // ── Input validation ───────────────────────────────────────────────────────
  const validate = () => {
    if (!ethers.utils.isAddress(recipient)) {
      Alert.alert('Invalid Address', 'Enter a valid Ethereum address starting with 0x.');
      return false;
    }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive ETH amount, e.g. 0.001');
      return false;
    }
    return true;
  };

  // ── Main send handler ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!validate()) return;

    setFlowState(STATE.AUTH);

    const { compatible, enrolled } = await checkBiometricAvailability();

    if (compatible && enrolled) {
      // Biometric path
      const result = await authenticateWithBiometrics('Authorise transaction with BioVault');
      if (result.success) {
        await executeTransaction();
      } else if (result.fallbackNeeded) {
        // Hardware present but nothing enrolled – show PIN
        setFlowState(STATE.IDLE);
        setPinVisible(true);
      } else {
        // User cancelled or failed
        setFlowState(STATE.IDLE);
        Alert.alert('Auth Failed', 'Biometric authentication failed. Transaction cancelled.');
      }
    } else {
      // No biometric hardware – fall back to PIN
      setFlowState(STATE.IDLE);
      setPinVisible(true);
    }
  };

  // ── PIN submit handler ────────────────────────────────────────────────────
  const handlePINAuth = async () => {
    const result = authenticateWithPIN(pin);
    setPin('');
    setPinVisible(false);
    if (result.success) {
      setFlowState(STATE.AUTH);
      await executeTransaction();
    } else {
      Alert.alert('Wrong PIN', 'Incorrect PIN. Transaction cancelled.\n\nDemo PIN: 1234');
    }
  };

  // ── Execute transaction ───────────────────────────────────────────────────
  const executeTransaction = async () => {
    try {
      setFlowState(STATE.SIGNING);
      const wallet = await loadWallet();

      setFlowState(STATE.BROADCAST);
      const tx = await sendTransaction(wallet, recipient, amount);

      console.log('✅ Transaction successful! Hash:', tx.hash);
      setTxHash(tx.hash);
      setFlowState(STATE.SUCCESS);
    } catch (err) {
      console.error('Transaction error:', err);
      setFlowState(STATE.IDLE);
      Alert.alert(
        'Transaction Failed',
        err.message.includes('insufficient')
          ? 'Insufficient balance. Grab Sepolia ETH from sepoliafaucet.com'
          : err.message
      );
    }
  };

  // ── Status label for loading screen ───────────────────────────────────────
  const loadingLabel = {
    [STATE.AUTH]:      '🔐 Awaiting biometric confirmation…',
    [STATE.SIGNING]:   '✍️  Signing transaction…',
    [STATE.BROADCAST]: '📡 Broadcasting to Sepolia…',
  }[flowState] ?? 'Processing…';

  // ── Success screen ─────────────────────────────────────────────────────────
  if (flowState === STATE.SUCCESS && txHash) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Transaction Sent!</Text>
          <Text style={styles.successSub}>Successfully broadcast to Sepolia Testnet</Text>

          <View style={styles.hashCard}>
            <Text style={styles.hashLabel}>Transaction Hash</Text>
            <Text style={styles.hashValue} selectable>{txHash}</Text>
          </View>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() =>
              Alert.alert(
                'View on Etherscan',
                `https://sepolia.etherscan.io/tx/${txHash}`,
                [{ text: 'Copy', onPress: () => {} }, { text: 'OK' }]
              )
            }
          >
            <Text style={styles.outlineBtnText}>🔍  View on Etherscan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.primaryBtnText}>← Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading overlay ────────────────────────────────────────────────────────
  if (flowState !== STATE.IDLE) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>{loadingLabel}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send ETH</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Network badge */}
          <View style={styles.networkBadge}>
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>Sepolia Testnet</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Recipient Address</Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x…"
              placeholderTextColor="#444"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={styles.label}>Amount (ETH)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.001"
              placeholderTextColor="#444"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleSend}
            />
          </View>

          {/* Security note */}
          <View style={styles.secNote}>
            <Text style={styles.secNoteText}>
              🔐  Biometric verification is required to sign and broadcast this transaction.
            </Text>
          </View>

          {/* PIN modal (inline) */}
          {pinVisible && (
            <View style={styles.pinCard}>
              <Text style={styles.pinTitle}>Enter PIN to Authorise</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="• • • •"
                placeholderTextColor="#444"
                onSubmitEditing={handlePINAuth}
                autoFocus
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handlePINAuth}>
                <Text style={styles.primaryBtnText}>Confirm PIN</Text>
              </TouchableOpacity>
              <Text style={styles.hintText}>Demo PIN: 1234</Text>
            </View>
          )}

          {!pinVisible && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>🔐  Authenticate & Send</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:   { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20, marginTop: 8,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backText:    { color: '#6C63FF', fontSize: 14 },

  networkBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  networkDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
  networkText:  { color: '#4CAF50', fontSize: 12, fontWeight: '600' },

  card: { backgroundColor: '#1E1E2E', borderRadius: 20, padding: 20, marginBottom: 16 },
  label: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  input: {
    backgroundColor: '#0D0D1A', color: '#fff',
    borderRadius: 10, padding: 14, fontSize: 13,
    borderWidth: 1, borderColor: '#2A2A3E',
    marginBottom: 20, fontFamily: 'monospace',
  },

  secNote: {
    backgroundColor: '#161626', borderRadius: 14,
    borderLeftWidth: 3, borderLeftColor: '#6C63FF',
    padding: 14, marginBottom: 24,
  },
  secNoteText: { color: '#888', fontSize: 13, lineHeight: 20 },

  sendBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6C63FF', shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  loadingText: { color: '#aaa', marginTop: 14, fontSize: 14 },

  /* PIN inline card */
  pinCard: {
    backgroundColor: '#1E1E2E', borderRadius: 20,
    padding: 22, alignItems: 'center', marginBottom: 16,
  },
  pinTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 16 },
  pinInput: {
    backgroundColor: '#0D0D1A', color: '#fff',
    fontSize: 28, textAlign: 'center', letterSpacing: 14,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    width: '60%', borderWidth: 1, borderColor: '#6C63FF',
    marginBottom: 18,
  },
  hintText: { color: '#444', fontSize: 12, marginTop: 8 },

  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 36, marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Success */
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  successIcon:  { fontSize: 72, marginBottom: 16 },
  successTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  successSub:   { color: '#888', fontSize: 13, marginBottom: 32, textAlign: 'center' },
  hashCard: {
    backgroundColor: '#1E1E2E', borderRadius: 16,
    padding: 20, width: '100%', marginBottom: 20,
  },
  hashLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  hashValue: { color: '#6C63FF', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
  outlineBtn: {
    borderWidth: 1, borderColor: '#6C63FF', borderRadius: 12,
    paddingVertical: 13, width: '100%',
    alignItems: 'center', marginBottom: 12,
  },
  outlineBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 15 },
});
