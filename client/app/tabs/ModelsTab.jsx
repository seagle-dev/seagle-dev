import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { fetchModels } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import usePaginatedList from '../hooks/usePaginatedList';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ModelDetailModal from './models/ModelDetailModal';

const { width } = Dimensions.get('window');

const getThumbnailUrl = (m) => {
  if (m.thumbnail) return m.thumbnail.startsWith('http') ? m.thumbnail : m.thumbnail;
  return 'https://via.placeholder.com/400x400?text=3D+Model';
};

const mapModel = (m) => ({
  id: String(m.id),
  name: m.name,
  category: m.category || 'General',
  categories: m.categories || [m.category || 'Anatomy', 'Medical'],
  thumbnail: getThumbnailUrl(m),
  fileUrl: m.fileUrl,
  uploadedBy: m.uploadedBy || 'Unknown',
  createdAt: m.createdAt,
});

export default function ModelsTab({ search = '', category = null }) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filters = useMemo(() => ({
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category ? { category } : {}),
  }), [search, category]);

  const {
    items: models,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
  } = usePaginatedList(fetchModels, mapModel, filters);

  const handleModelPress = useCallback((model) => {
    setSelectedModel(model);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedModel(null);
  }, []);

  const renderModelItem = useCallback(({ item }) => (
    <TouchableOpacity style={styles.modelCard} onPress={() => handleModelPress(item)} activeOpacity={0.95}>
      <Image source={{ uri: item.thumbnail }} style={styles.modelImage} resizeMode="cover" />
      <View style={styles.modelInfo}>
        <Text style={styles.modelName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.badgeRow}>
          <Badge label={item.category} color={COLORS.navy} />
          <Badge label="Medical" variant="outline" color={COLORS.orange} />
        </View>
      </View>
    </TouchableOpacity>
  ), [handleModelPress]);

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.navy} />
      </View>
    ) : null;

  if (loading) return <LoadingView message="Loading 3D models..." backgroundColor={COLORS.bgPrimary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={renderModelItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState icon="cube-outline" title="No 3D models found" subtitle="Try a different search or category" />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.navy} />}
      />
      <ModelDetailModal visible={modalVisible} model={selectedModel} onClose={handleCloseModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  listContent: { paddingTop: SPACING.md, paddingBottom: SPACING.xl },

  modelCard: {
    backgroundColor: COLORS.bgWhite,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.navy,
    ...SHADOWS.small,
  },
  modelImage: {
    width: '100%',
    height: width - 32 - 20,
    backgroundColor: '#2a2a2a',
  },
  modelInfo: {
    padding: SPACING.lg,
  },
  modelName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 24,
    fontFamily: FONTS.serifBold,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});