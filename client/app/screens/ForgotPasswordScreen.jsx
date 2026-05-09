import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import TopHeader from '../components/TopHeader';
import { forgotPassword } from '../../services/api';
import { useRouter } from 'expo-router';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await forgotPassword(email);
      setShowModal(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    router.push({ pathname: '/screens/ResetPasswordScreen', params: { email } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Forgot Password" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Enter the email address associated with your account and we'll send you a 6-digit code to reset your password.</Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter your email" 
              keyboardType="email-address" 
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.resetButton, loading && { opacity: 0.7 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal 
        visible={showModal}
        title="Check Your Email"
        message={`We've sent a 6-digit reset code to ${email}. Please enter it on the next screen.`}
        confirmLabel="Continue"
        onConfirm={handleModalConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.sm, fontFamily: FONTS.serifBold, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl, textAlign: 'center', lineHeight: 22 },
  section: { width: '100%', marginBottom: SPACING.xl },
  label: { fontSize: 14, color: COLORS.navy, fontWeight: '600', marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  resetButton: {
    width: '100%',
    backgroundColor: COLORS.orange,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  resetButtonText: { color: COLORS.navy, fontWeight: '700', fontSize: 16 },
});