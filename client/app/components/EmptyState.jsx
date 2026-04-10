import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';

/**
 * Reusable empty-state placeholder with icon, title, and subtitle.
 */
export default function EmptyState({
  icon = 'alert-circle-outline',
  iconSize = 64,
  iconColor = '#d1d5db',
  title = 'Nothing here',
  subtitle = '',
}) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    fontFamily: FONTS.serifBold,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    fontFamily: FONTS.regular,
  },
});
