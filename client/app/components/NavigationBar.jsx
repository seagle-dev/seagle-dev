import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { name: 'Home', icon: 'home', href: '/tabs' },
  { name: 'Library', icon: 'book', href: '/tabs/library' },
  { name: 'Classroom', icon: 'school', href: '/tabs' },
  { name: 'Quizzes', icon: 'bulb', href: '/tabs' },
  { name: 'Slides', icon: 'easel', href: '/tabs' },
];

const LIBRARY_PATHS = ['/tabs/library', '/tabs/book', '/tabs/models', '/tabs/Reader'];

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeIndex = useMemo(() => {
    if (LIBRARY_PATHS.some((p) => pathname.startsWith(p))) return 1;
    if (pathname === '/tabs' || pathname === '/tabs/index') return 0;
    return 0;
  }, [pathname]);

  const itemWidth = width / TABS.length;
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * itemWidth,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeIndex, itemWidth, indicatorPosition]);

  return (
    <View style={[styles.navigationBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Animated.View
        style={[styles.activeIndicator, { width: itemWidth, transform: [{ translateX: indicatorPosition }] }]}
      />
      {TABS.map((tab, index) => (
        <TouchableOpacity key={tab.name} style={styles.navItem} onPress={() => router.push(tab.href)} activeOpacity={0.7}>
          <Ionicons name={tab.icon} size={24} color={activeIndex === index ? COLORS.white : COLORS.navInactive} />
          <Text style={[styles.navLabel, activeIndex === index && styles.navLabelActive]}>{tab.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.navyDeep,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 16 },
    }),
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  navLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.navInactive, textAlign: 'center', marginTop: SPACING.xs },
  navLabelActive: { color: COLORS.white, fontWeight: '600' },
  activeIndicator: { position: 'absolute', top: 0, height: 3, backgroundColor: COLORS.white, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
