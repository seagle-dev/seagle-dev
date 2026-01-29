import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts } from 'expo-font'

import Auth from './screens/Auth'
import Home from './screens/Home'

const Index = () => {
  const [fontsLoaded] = useFonts({
    'FunnelSans-Regular': require('../assets/fonts/FunnelSans-Regular.ttf'),
    'FunnelSans-Bold': require('../assets/fonts/FunnelSans-Bold.ttf'),
    'FunnelSans-Light': require('../assets/fonts/FunnelSans-Light.ttf'),
  })

  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to restore user', e)
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  // ⛔ Wait for BOTH auth + fonts
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!user) {
    return (
      <Auth
        onSignIn={async (u, token) => {
          await AsyncStorage.setItem('user', JSON.stringify(u))
          await AsyncStorage.setItem('token', token || '')
          setUser(u)
        }}
      />
    )
  }

  return (
    <Home
      user={user}
      onSignOut={async () => {
        await AsyncStorage.removeItem('user')
        await AsyncStorage.removeItem('token')
        setUser(null)
      }}
    />
  )
}

export default Index

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
