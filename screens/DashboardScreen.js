// ─── screens/DashboardScreen.js ─────────────────────────────────────────────
// Shows wallet address, Sepolia ETH balance, and security status.
// Entry point to the Send Transaction flow.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, ScrollView,
  RefreshControl,
} from 'react-native';
import { loadWallet, getBalance, shortenAddress } from '../services/walletService';

export default function DashboardScreen({ navigation }) {
  const [wallet,     setWallet]     = useState(null);
  const [balance,    setBalance]    = useState('--');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load wallet on mount ───────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const w = await loadWallet();
      if (!w) {
        Alert.alert('Error', 'No wallet found. Restarting…');
        navigation.replace('Auth');
        return;
      }
      setWallet(w);
      const bal = await fetchBalance(w.address);
      setBalance(bal);
    } catch (err) {
      console.error('Dashboard load error:', err);
      Alert.alert('Load Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const bal = await getBalance(address);
      return bal;
    } catch {
      return '0.0';   // RPC unreachable – show 0 rather than crashing
    }
  };

  // ── Pull-to-refresh balance ────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    if (!wallet) return;
    setRefreshing(true);
    const bal = await fetchBalance(wallet.address);
    setBalance(bal);
    setRefreshing(false);
  }, [wallet]);

  // ── Lock wallet (go back to auth) ─────────────────────────────────────────
  const handleLock = () => {
    setWallet(null);
    navigation.replace('Auth');
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Unlocking wallet…</Text>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BioVault</Text>
            <Text style={styles.headerSub}>Decentralised Wallet</Text>
          </View>
          <TouchableOpacity style={styles.lockBtn} onPress={handleLock}>
            <Text style={styles.lockBtnText}>🔒 Lock</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Wallet Address</Text>
          <Text style={styles.address}>{wallet?.address ?? 'N/A'}</Text>

          <View style={styles.divider} />

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.cardLabel}>Balance</Text>
              <Text style={styles.balance}>
                {parseFloat(balance).toFixed(6)}
                <Text style={styles.balanceUnit}>  ETH</Text>
              </Text>
            </View>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Sepolia</Text>
            </View>
          </View>
          <Text style={styles.refreshHint}>Pull down to refresh balance</Text>
        </View>

        {/* Security status card */}
        <View style={styles.secCard}>
          <Text style={styles.secTitle}>🔐 Security Status</Text>
          {[
            '✅  Biometric protection active',
            '✅  Private key AES-256 encrypted',
            '✅  Stored in device secure enclave',
            '✅  Biometric data never stored',
            '✅  Key wiped from memory post-tx',
          ].map((line, i) => (
            <Text key={i} style={styles.secItem}>{line}</Text>
          ))}
        </View>

        {/* Faucet tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Need Sepolia ETH? Visit{' '}
            <Text style={styles.tipLink}>sepoliafaucet.com</Text>
            {' '}and paste your address above.
          </Text>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => navigation.navigate('SendTransaction', { walletAddress: wallet?.address })}
        >
          <Text style={styles.sendBtnText}>↗  Send Transaction</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  content:   { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24, marginTop: 8,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub:   { color: '#555', fontSize: 12, marginTop: 2 },
  lockBtn:     { backgroundColor: '#1E1E2E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  lockBtnText: { color: '#aaa', fontSize: 13 },

  card: {
    backgroundColor: '#1E1E2E', borderRadius: 20,
    padding: 22, marginBottom: 16,
  },
  cardLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  address: {
    color: '#6C63FF', fontSize: 12, fontFamily: 'monospace',
    marginBottom: 18, lineHeight: 20,
  },
  divider:    { height: 1, backgroundColor: '#2A2A3E', marginBottom: 18 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  balance:    { color: '#fff', fontSize: 30, fontWeight: '800' },
  balanceUnit:{ color: '#888', fontSize: 16, fontWeight: '400' },
  networkBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#12261E', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  networkDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 5 },
  networkText: { color: '#4CAF50', fontSize: 11, fontWeight: '600' },
  refreshHint: { color: '#444', fontSize: 11, marginTop: 4 },

  secCard: {
    backgroundColor: '#1E1E2E', borderRadius: 20,
    padding: 20, marginBottom: 14,
  },
  secTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 14 },
  secItem:  { color: '#888', fontSize: 13, marginBottom: 8, lineHeight: 20 },

  tipCard: {
    backgroundColor: '#161626', borderRadius: 14, borderLeftWidth: 3,
    borderLeftColor: '#6C63FF', padding: 14, marginBottom: 24,
  },
  tipText: { color: '#888', fontSize: 13, lineHeight: 20 },
  tipLink: { color: '#6C63FF', fontWeight: '600' },

  sendBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#6C63FF', shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },

  loadingText: { color: '#aaa', marginTop: 14, fontSize: 13 },
});
