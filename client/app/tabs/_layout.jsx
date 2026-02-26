// app/tabs/_layout.jsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import TopHeader from '../components/TopHeader';
import NavigationBar from '../components/NavigationBar';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <TopHeader showBackButton={false} title="" />

      {/* This wrapper prevents children from painting outside the content area */}
      <View style={styles.contentClip}>
        <Slot />
      </View>

      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  contentClip: {
    flex: 1,
    overflow: 'hidden', // key
    backgroundColor: '#f8f9fa',
  },
});


