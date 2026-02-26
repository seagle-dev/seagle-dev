import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

/**
 * Reusable badge/chip component with filled and outline variants.
 *
 * @param {string} label   – badge text
 * @param {'filled'|'outline'} variant – visual style
 * @param {string} color   – primary color (background for filled, border for outline)
 * @param {string} textColor – override text color
 * @param {object} style   – extra container styles
 */
export default function Badge({
  label,
  variant = 'filled',
  color = COLORS.orange,
  textColor,
  style,
}) {
  const isFilled = variant === 'filled';
  const resolvedTextColor = textColor || (isFilled ? COLORS.white : color);

  return (
    <View
      style={[
        styles.base,
        isFilled ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color },
        style,
      ]}
    >
      <Text style={[styles.text, { color: resolvedTextColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },
});
