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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#8DD3FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111A50',
    marginBottom: 12,
    fontFamily: 'FunnelSans-Bold',
  },
  successMessage: {
    fontSize: 16,
    color: '#111A50',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'FunnelSans-Regular',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 26,
    alignItems: 'center',
    minWidth: 120,
  },
  backButton: {
    backgroundColor: '#111A50',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#FF8C42',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'FunnelSans-Regular',
  },
  continueButton: {
    backgroundColor: '#FF8C42',
  },
  continueButtonText: {
    color: '#111A50',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'FunnelSans-Regular',
  },
})
