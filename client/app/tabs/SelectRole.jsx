import React from 'react'
import {
  View,
  Text,
  StyleSheet,
} from 'react-native'

const STAGES = [
  { label: 'Role', step: 1 },
  { label: 'Account', step: 2 },
  { label: 'Details', step: 3 },
]

export default function SignUpProgressBar({ currentStep = 1 }) {
  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {STAGES.map((stage, index) => (
          <View key={stage.step} style={styles.stageWrapper}>
            {/* Circle indicator */}
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

            {/* Connecting line (not on last stage) */}
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

      {/* Stage labels */}
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
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleActive: {
    backgroundColor: '#f97316',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  stepNumberActive: {
    color: '#fff',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
    marginTop: 20,
  },
  lineActive: {
    backgroundColor: '#f97316',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',            
    flex: 1,
    textAlign: 'center',
  },
  labelActive: {
    color: '#f97316',
    fontWeight: '600',
  },
})

