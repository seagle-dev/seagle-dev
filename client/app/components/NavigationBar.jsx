import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

const TABS = [
  { name: 'Home', icon: 'home', href: '/tabs', disabled: true },
  { name: 'Library', icon: 'book', href: '/tabs/library' },
  { name: 'Classroom', icon: 'school', href: '/tabs/classroom', disabled: true },
  { name: 'Quizzes', icon: 'bulb', href: '/tabs/quizzes', disabled: true },
  { name: 'Slides', icon: 'easel', href: '/tabs/slides', disabled: true },
];

const LIBRARY_PATHS = ['/tabs/library', '/tabs/book', '/tabs/models', '/tabs/Reader'];

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeIndex = useMemo(() => {
    if (pathname.startsWith('/tabs/classroom')) return 2;
    if (pathname.startsWith('/tabs/quizzes')) return 3;
    if (pathname.startsWith('/tabs/slides')) return 4;
    if (LIBRARY_PATHS.some((p) => pathname.startsWith(p))) return 1;
    return 1;
  }, [pathname]);

  return (
    <View style={[styles.navigationBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab, index) => {
        const isActive = activeIndex === index;
        const color = isActive ? COLORS.orange : COLORS.navInactive;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.navItem, tab.disabled && styles.navItemDisabled]}
            onPress={() => router.push(tab.href)}
            activeOpacity={0.7}
            disabled={tab.disabled}
            accessibilityState={{ disabled: !!tab.disabled, selected: isActive }}
          >
            <Ionicons name={tab.icon} size={24} color={color} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
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
  navItemDisabled: { opacity: 0.45 },
  navLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.navInactive, textAlign: 'center', marginTop: SPACING.xs },
  navLabelActive: { color: COLORS.orange, fontWeight: '600' },
});
