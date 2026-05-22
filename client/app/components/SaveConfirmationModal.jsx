import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function SaveConfirmationModal({ 
  visible, 
  onSave, 
  onDiscard, 
  onCancel 
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="save-outline" size={40} color={COLORS.orange} />
          </View>
          
          <Text style={styles.title}>Unsaved Changes</Text>
          <Text style={styles.message}>You have unsaved annotations. Would you like to save them before leaving?</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.discardButton]} 
              onPress={onDiscard}
            >
              <Text style={styles.discardButtonText}>Discard Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Continue Editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: FONTS.serifBold,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.navy,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  discardButton: {
    backgroundColor: '#FCECEC',
  },
  discardButtonText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EDE6F6',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
});
