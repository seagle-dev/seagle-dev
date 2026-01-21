import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function Home({ user, onSignOut }) {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  welcome: { fontSize: 20, marginBottom: 6 },
  email: { color: '#666', marginBottom: 20 },
  button: { backgroundColor: '#ff3b30', padding: 12, borderRadius: 4 },
  buttonText: { color: '#fff', fontWeight: '600' }
})