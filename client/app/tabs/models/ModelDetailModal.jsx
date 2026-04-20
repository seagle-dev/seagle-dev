import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../constants/theme';
import ModelModal from '../../components/Reading/ModelModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ModelDetailModal({ visible, model, onClose }) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('token').then(setAuthToken);
    }
  }, [visible]);

  if (!model) return null;

  const handleView3D = () => {
    setViewerVisible(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={COLORS.textLight} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Model Preview */}
            <View style={styles.previewContainer}>
              <Image source={{ uri: model.thumbnail }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <View style={styles.badge3D}>
                  <Ionicons name="cube-outline" size={18} color={COLORS.white} />
                  <Text style={styles.badge3DText}>3D Model</Text>
                </View>
              </View>
            </View>

            {/* Model Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.modelName}>{model.name}</Text>

              <View style={styles.metaRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{model.category}</Text>
                </View>
                <Text style={styles.uploadedBy}>by {model.uploadedBy}</Text>
              </View>

              {/* View 3D Button */}
              <TouchableOpacity style={styles.view3DButton} onPress={handleView3D} activeOpacity={0.8}>
                <Ionicons name="cube" size={20} color={COLORS.white} />
                <Text style={styles.view3DButtonText}>View in 3D</Text>
              </TouchableOpacity>

              {/* Action Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionBtnText}>Like</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="share-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="download-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{model.category}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Uploaded By</Text>
                <Text style={styles.detailValue}>{model.uploadedBy}</Text>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Format</Text>
                <Text style={styles.detailValue}>.glb</Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </View>

      <ModelModal
        visible={viewerVisible}
        model={model}
        authToken={authToken}
        onClose={() => setViewerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: { flex: 1 },
  modalContainer: {
    backgroundColor: COLORS.bgWhite,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: SPACING.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.navyDeep,
    height: 280,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
  },
  badge3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 26, 80, 0.8)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.pill,
    gap: 6,
  },
  badge3DText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.regular,
  },

  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modelName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.sm,
    lineHeight: 28,
    fontFamily: FONTS.serifBold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.bgAccent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.navy,
  },
  categoryBadgeText: { fontSize: FONT_SIZES.xs, color: COLORS.navy, fontWeight: '600', fontFamily: FONTS.regular },
  uploadedBy: { fontSize: FONT_SIZES.xs + 1, color: COLORS.textMuted, fontFamily: FONTS.regular },

  view3DButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  view3DButtonText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600', fontFamily: FONTS.regular },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.bgTertiary,
    paddingTop: SPACING.sm,
  },
  actionBtn: { alignItems: 'center', gap: SPACING.xs },
  actionBtnText: { fontSize: FONT_SIZES.xs, color: COLORS.navy, fontWeight: '600', fontFamily: FONTS.regular },

  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.serifBold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xxs,
  },
  detailLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontFamily: FONTS.regular },
  detailValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600', fontFamily: FONTS.regular },
  detailDivider: { height: 1, backgroundColor: COLORS.bgTertiary, marginVertical: SPACING.xxs },

  bottomSpacing: { height: 40 },
});