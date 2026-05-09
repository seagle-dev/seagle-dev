import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import TopHeader from '../components/TopHeader';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  const pathname = usePathname();
  const isReadingMode = pathname.startsWith('/tabs/Reader');

  const getHeaderProps = () => {
    switch (pathname) {
      case '/tabs/profile':
        return { title: "Profile & Settings", showBackButton: true };
      case '/tabs/library':
        return { title: "", showNotifications: true, showCart: true };
      case '/tabs/classroom':
        return { title: "My Classroom", showNotifications: true };
      case '/tabs/quizzes':
        return { title: "Assessments", showNotifications: true };
      case '/tabs/notifications':
        return { title: "Notifications", showBackButton: true };
      case '/tabs/cart':
        return { title: "Your Cart", showBackButton: true };
      default:
        return { title: "" };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <View style={styles.container}>
      {!isReadingMode && (
        <TopHeader 
          {...headerProps}
          backgroundColor={COLORS.navy}
        />
      )}
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
