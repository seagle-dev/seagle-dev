import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export default function PaginatedListFooter({ loading, color = COLORS.navy }) {
  if (!loading) return null;

  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});
