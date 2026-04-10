import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';

const STAGES = [
  { label: 'Role', step: 1 },
  { label: 'Account', step: 2 },
  { label: 'Details', step: 3 },
];

export default function SignUpProgressBar({ currentStep = 1 }) {
  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {STAGES.map((stage, index) => (
          <View key={stage.step} style={styles.stageWrapper}>
            <View
              style={[
                styles.circle,
                currentStep >= stage.step && styles.circleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  currentStep >= stage.step && styles.stepNumberActive,
                ]}
              >
                {stage.step}
              </Text>
            </View>

            {index < STAGES.length - 1 && (
              <View
                style={[
                  styles.line,
                  currentStep > stage.step && styles.lineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.labelsContainer}>
        {STAGES.map((stage) => (
          <Text
            key={stage.step}
            style={[
              styles.label,
              currentStep === stage.step && styles.labelActive,
            ]}
          >
            {stage.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  stageWrapper: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleActive: {
    backgroundColor: COLORS.orange,
  },
  stepNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
    marginTop: SPACING.xl,
  },
  lineActive: {
    backgroundColor: COLORS.orange,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    fontFamily: FONTS.regular,
    flex: 1,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.orange,
    fontWeight: '600',
  },
});
