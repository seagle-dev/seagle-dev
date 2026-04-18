import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import EmptyState from '../components/EmptyState';

export default function SlidesTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EmptyState
        icon="easel-outline"
        title="Slides"
        subtitle="Presentation slides and materials will appear here."
        iconColor={COLORS.navy}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: SPACING.xl,
  },
});
