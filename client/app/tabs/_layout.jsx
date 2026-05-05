import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import TopHeader from '../components/TopHeader';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <TopHeader showBackButton={false} title="" showNotifications={false} showCart={false} />
      <View style={styles.contentClip}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
  },
  contentClip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.bgPrimary,
  },
});
