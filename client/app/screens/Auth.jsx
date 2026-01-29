import React from 'react'
import { useRouter } from 'expo-router'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

export default function Auth({ onSignIn }) {
  const router = useRouter() // Move this INSIDE the component
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [staySigned, setStaySigned] = React.useState(false)

  const handleSignIn = async () => {
    const user = { id: Date.now().toString(), name: email || 'User', email }
    const token = 'local-token-' + Date.now()
    try {
      await onSignIn(user, token)
    } catch {
      onSignIn(user, token)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require('../../assets/seagle.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Log in to seagle</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@email.com"
            placeholderTextColor="#999999ce"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password:</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="*********"
            placeholderTextColor="#999999ce"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setStaySigned((s) => !s)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, staySigned && styles.checkboxChecked]}>
              {staySigned && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>Stay signed in</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot your password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleSignIn} activeOpacity={0.9}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.signUpRow}>
          <Text style={styles.noAccount}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/SignUpScreen')}>
            <Text style={styles.signUpLink}> Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.googleButton}>
          <Image source={require('../../assets/google.png')} style={styles.googleIcon} />
          <Text style={styles.googleText}>Google</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By clicking Sign in, Continue with Google you agree to seagle{' '}
          <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.
        </Text>

        <TouchableOpacity style={styles.adminLink}>
          <Text style={styles.adminText}>Sign in as Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'stretch',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  logo: {
    width: 92,
    height: 92,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  field: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 8,
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontStyle: '#ffffff9d',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9ca3af',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
    borderColor: '#f97316',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#f97316',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: '#374151',
  },
  forgot: {
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#f7944d',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  signUpRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccount: {
    color: '#6b7280',
  },
  signUpLink: {
    color: '#374151',
    fontWeight: '600',
  },
  dividerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    flex: 1,
    marginHorizontal: 12,
  },
  dividerText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
    color: '#111827',
  },
  terms: {
    marginTop: 14,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#374151',
  },
  adminLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  adminText: {
    color: '#374151',
    textDecorationLine: 'underline',
  },
})