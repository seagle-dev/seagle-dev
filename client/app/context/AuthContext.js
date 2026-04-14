import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore user on app launch
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to restore user:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const signIn = async (userData, token) => {
    setUser(userData)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      await AsyncStorage.setItem('token', token)
    }
  }

  const signOut = async () => {
    setUser(null)
    await AsyncStorage.removeItem('user')
    await AsyncStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext;