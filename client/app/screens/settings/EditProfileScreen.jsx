import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';
import { fetchProfile, updateProfile } from '../../../services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function EditProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
        setDepartment(data.department || 'Medicine');
        setCourse(data.course || 'Anatomy');
        setYearLevel(data.yearLevel || '1st Year');
      } catch (err) {
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!firstName || !lastName || !username) {
      Alert.alert("Error", "First Name, Last Name, and Username are required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ firstName, lastName, username });
      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.navy} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Edit Profile" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.sectionSubtitle}>Manage your account identity. Note: Your registered email is permanent and cannot be edited.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <CustomInput 
            label="First Name *" 
            value={firstName} 
            onChangeText={setFirstName} 
            placeholder="John"
          />
          <CustomInput 
            label="Last Name *" 
            value={lastName} 
            onChangeText={setLastName} 
            placeholder="Doe"
          />
          <CustomInput 
            label="Username *" 
            value={username} 
            onChangeText={setUsername} 
            placeholder="johndoe123"
          />
          <CustomInput 
            label="Email Address" 
            value={email} 
            editable={false}
            isLocked={true}
          />
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <Text style={styles.sectionSubtitle}>Your official school records. These fields are read-only.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <CustomInput 
            label="Department" 
            value={department} 
            editable={false}
            isLocked={true}
          />
          <CustomInput 
            label="Course" 
            value={course} 
            editable={false}
            isLocked={true}
          />
          <CustomInput 
            label="Year Level" 
            value={yearLevel} 
            editable={false}
            isLocked={true}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.navy} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmationModal 
        visible={showSuccessModal}
        title="Profile Updated"
        message="Your profile changes have been saved successfully."
        confirmLabel="Done"
        onConfirm={handleSuccessConfirm}
      />
    </SafeAreaView>
  );
}

function CustomInput({ label, value, onChangeText, placeholder, editable = true, isLocked = false }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
        <TextInput 
          style={[styles.input, !editable && styles.disabledText]} 
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={editable}
          placeholderTextColor={COLORS.textTertiary}
        />
        {isLocked && <Ionicons name="lock-closed" size={16} color={COLORS.textTertiary} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg },
  headerSection: {
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  saveButtonText: { color: COLORS.navy, fontWeight: '700', fontSize: 16 },
});