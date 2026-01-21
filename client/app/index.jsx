import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Auth from './screens/Auth'
import Home from './screens/Home'

const index = () => {
  const [loading, setLoading] = React.useState(true)
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
      } catch (e) {}
      setLoading(false)
    }
    restore()
  }, [])

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" /></View>
  )

  if (!user) return <Auth onSignIn={async (u, token) => { await AsyncStorage.setItem('user', JSON.stringify(u)); await AsyncStorage.setItem('token', token || ''); setUser(u) }} />

  return <Home user={user} onSignOut={async () => { await AsyncStorage.removeItem('user'); await AsyncStorage.removeItem('token'); setUser(null) }} />
}

export default index

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})