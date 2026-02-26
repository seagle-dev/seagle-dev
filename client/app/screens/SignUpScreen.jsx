import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { register } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme'

export default function SignUpScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAccount = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const data = await register(email, password)
      await signIn(data.user, data.token)
      setIsLoading(false)
      router.push('/screens/SuccessScreen')
    } catch (err) {
      setIsLoading(false)
      Alert.alert('Registration Failed', err.message || 'Could not create account')
    }
  }

  const navigateToLogin = () => {
    router.push('/')
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Account Information</Text>

          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter First Name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Last Name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="************"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIconText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="************"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIconText}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Log in here</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.nextButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Modal */}
      <Modal transparent visible={isLoading} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8C42" />
            <Text style={styles.loadingText}>Creating your account...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgWhite },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.xxl, paddingTop: 40, paddingBottom: 30 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: '600', textAlign: 'center', marginBottom: 30, color: COLORS.black, fontFamily: FONTS.bold },
  form: { flex: 1 },
  inputGroup: { marginBottom: SPACING.xl },
  label: { fontSize: FONT_SIZES.body, fontWeight: '500', marginBottom: SPACING.sm, color: COLORS.black, fontFamily: FONTS.regular },
  input: { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 14, fontSize: FONT_SIZES.regular, color: COLORS.black, fontFamily: FONTS.light },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: RADIUS.md },
  passwordInput: { flex: 1, paddingHorizontal: SPACING.lg, paddingVertical: 14, fontSize: FONT_SIZES.regular, color: COLORS.black, fontFamily: FONTS.light },
  eyeIcon: { padding: 14 },
  eyeIconText: { fontSize: FONT_SIZES.xxl },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  loginText: { fontSize: FONT_SIZES.body, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  loginLink: { fontSize: FONT_SIZES.body, color: COLORS.orange, fontWeight: '600', fontFamily: FONTS.bold },
  buttonContainer: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.xl, justifyContent: 'center' },
  nextButton: { backgroundColor: COLORS.orange, borderRadius: 25, paddingVertical: SPACING.lg, paddingHorizontal: 40, alignItems: 'center' },
  nextButtonText: { color: COLORS.navy, fontSize: FONT_SIZES.lg, fontWeight: '600', fontFamily: FONTS.regular },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { backgroundColor: COLORS.bgWhite, borderRadius: RADIUS.lg, padding: SPACING.xxxl, alignItems: 'center', minWidth: 200 },
  loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZES.lg, color: COLORS.navy, fontFamily: FONTS.bold },
})