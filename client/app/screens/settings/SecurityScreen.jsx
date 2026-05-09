import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';
import { changePassword } from '../../../services/api';
import { useRouter } from 'expo-router';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function SecurityScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Security" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Change Password</Text>
          
          <View style={styles.section}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter current password" 
              secureTextEntry 
              value={currentPassword}
              onChangeText={setCurrentPassword}
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
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Confirm new password" 
              secureTextEntry 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal 
        visible={showSuccessModal}
        title="Password Updated"
        message="Your security settings have been updated successfully."
        confirmLabel="Done"
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
    padding: SPACING.lg,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.md },
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
  saveButton: {
    backgroundColor: COLORS.orange,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  saveButtonText: { color: COLORS.navy, fontWeight: '700', fontSize: 16 },
});