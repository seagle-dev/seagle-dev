import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import TopHeader from '../components/TopHeader';
import { resetPassword } from '../../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleReset = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    router.replace('/auth/Auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Create New Password" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter Reset Code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to {email}. Enter it below along with your new password.</Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>6-Digit Code</Text>
            <TextInput 
              style={styles.input} 
              placeholder="123456" 
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>New Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter new password" 
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Confirm new password" 
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
              <Text style={styles.resetButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal 
        visible={showSuccessModal}
        title="Password Reset Successful"
        message="Your password has been successfully updated. You can now log in with your new password."
        confirmLabel="Go to Login"
        onConfirm={handleSuccessConfirm}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.sm, fontFamily: FONTS.serifBold },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 22 },
  section: { width: '100%', marginBottom: SPACING.lg },
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
    marginTop: SPACING.sm,
  },
  resetButtonText: { color: COLORS.navy, fontWeight: '700', fontSize: 16 },
});