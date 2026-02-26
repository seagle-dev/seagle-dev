import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';

/**
 * Reusable full-screen centered loading spinner with optional message.
 */
export default function LoadingView({ message = 'Loading...', color = COLORS.navy, backgroundColor = COLORS.bgWhite }) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={color} />
      {message ? <Text style={[styles.text, { color: COLORS.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
});
