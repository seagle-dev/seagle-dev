import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import NavigationBar from './NavigationBar'

export default function Home({ user, onSignOut }) {
  return (
    <View style={styles.container}>
      <NavigationBar />
      <TouchableOpacity style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  button: { position: 'absolute', top: 40, right: 16, backgroundColor: '#ff3b30', padding: 12, borderRadius: 4, zIndex: 10 },
  buttonText: { color: '#fff', fontWeight: '600' }
})