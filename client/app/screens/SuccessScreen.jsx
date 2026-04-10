import React from 'react'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme'

export default function SuccessScreen() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  const handleContinue = () => {
    router.push('/')
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.successTitle}>Account Created!</Text>

        <Text style={styles.successMessage}>
          Account Successfully Created Start Using Seagle
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.backButton]}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.continueButton]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgWhite },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xxl },
  successIcon: { width: 80, height: 80, borderRadius: RADIUS.md, backgroundColor: '#8DD3FA', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xxl },
  checkmark: { fontSize: 48, color: COLORS.white, fontWeight: 'bold' },
  successTitle: { fontSize: FONT_SIZES.title, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.md, fontFamily: FONTS.bold },
  successMessage: { fontSize: FONT_SIZES.lg, color: COLORS.navy, textAlign: 'center', marginBottom: SPACING.xxxl, fontFamily: FONTS.regular, lineHeight: 24 },
  buttonContainer: { flexDirection: 'row', gap: SPACING.md, justifyContent: 'center', width: '100%' },
  button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: RADIUS.pill, alignItems: 'center', minWidth: 120 },
  backButton: { backgroundColor: COLORS.navy, borderWidth: 1, borderColor: COLORS.borderLight },
  backButtonText: { color: COLORS.orange, fontSize: FONT_SIZES.body, fontWeight: '600', fontFamily: FONTS.regular },
  continueButton: { backgroundColor: COLORS.orange },
  continueButtonText: { color: COLORS.navy, fontSize: FONT_SIZES.body, fontWeight: '600', fontFamily: FONTS.regular },
})
