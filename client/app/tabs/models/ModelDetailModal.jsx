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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import ModelModal from '../../components/Reading/ModelModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ModelDetailModal({ visible, model, onClose }) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const insets = useSafeAreaInsets();

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

        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
          {/* Header with Drag Handle and Close */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
            {/* Model Preview Image */}
            <View style={styles.previewContainer}>
              <Image source={{ uri: model.thumbnail }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.typeBadge}>
                <Ionicons name="cube-outline" size={14} color={COLORS.white} />
                <Text style={styles.typeBadgeText}>Interactive 3D</Text>
              </View>
            </View>

            {/* Model Info Section */}
            <View style={styles.contentSection}>
              <View style={styles.titleRow}>
                <View style={styles.titleInfo}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.authorText}>by {model.uploadedBy}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.likeButton, isLiked && styles.likeButtonActive]} 
                  onPress={() => setIsLiked(!isLiked)}
                >
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? COLORS.red : COLORS.navy} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaBadges}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{model.category}</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: COLORS.orangeLight, borderColor: COLORS.orange }]}>
                  <Text style={[styles.metaBadgeText, { color: COLORS.orange }]}>Medical</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* View in 3D Primary Action */}
              <TouchableOpacity style={styles.primaryActionButton} onPress={handleView3D} activeOpacity={0.8}>
                <Ionicons name="cube" size={22} color={COLORS.white} />
                <Text style={styles.primaryActionText}>View in 3D Space</Text>
              </TouchableOpacity>

              {/* Secondary Actions */}
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Ionicons name="share-social-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.secondaryActionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Ionicons name="download-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.secondaryActionText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Ionicons name="bookmark-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.secondaryActionText}>Save</Text>
                </TouchableOpacity>
              </View>

              {/* Details List */}
              <View style={styles.detailsBox}>
                <Text style={styles.sectionHeading}>Technical Details</Text>
                <DetailItem label="File Format" value=".glb (glTF)" />
                <DetailItem label="Dimensions" value="Unit Scale" />
                <DetailItem label="Created" value={model.createdAt ? new Date(model.createdAt).toLocaleDateString() : 'N/A'} />
              </View>
            </View>
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

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  overlayTouch: { flex: 1 },
  modalContainer: {
    backgroundColor: COLORS.bgWhite,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: SCREEN_HEIGHT * 0.9,
    ...SHADOWS.medium,
  },
  header: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 5,
    padding: 5,
  },
  previewContainer: {
    width: '100%',
    height: 260,
    backgroundColor: COLORS.bgPrimary,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  contentSection: {
    padding: SPACING.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    marginBottom: 4,
  },
  authorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: '#FFF0F0',
  },
  metaBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.navy,
  },
  metaBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.navy,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  primaryActionButton: {
    backgroundColor: COLORS.navy,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  secondaryAction: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.navy,
  },
  detailsBox: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  sectionHeading: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.navy,
  },
});