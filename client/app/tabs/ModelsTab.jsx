import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchModels, getToken } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import usePaginatedList from '../hooks/usePaginatedList';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import PaginatedListFooter from '../components/PaginatedListFooter';
import ModelModal from '../components/Reading/ModelModal';
import { PLACEHOLDER_MODEL_THUMBNAIL } from '../../constants/placeholders';

const getThumbnailUrl = (m) => {
  if (m.thumbnail) return m.thumbnail.startsWith('http') ? m.thumbnail : m.thumbnail;
  return PLACEHOLDER_MODEL_THUMBNAIL;
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
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    if (modalVisible) {
      getToken().then(setAuthToken);
    }
  }, [modalVisible]);

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

  const renderModelItem = useCallback(({ item }) => {
    const isPlaceholder = item.thumbnail === PLACEHOLDER_MODEL_THUMBNAIL;
    return (
    <TouchableOpacity style={styles.modelCard} onPress={() => handleModelPress(item)} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image 
          source={isPlaceholder ? require('../../assets/artboard.png') : { uri: item.thumbnail }} 
          style={styles.modelImage} 
          resizeMode="cover" 
        />
        <View style={styles.cardBadge}>
          <Ionicons name="cube" size={14} color={COLORS.white} />
        </View>
      </View>
      <View style={styles.modelInfo}>
        <View>
          <Text style={styles.modelName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.navy + '50'} />
      </View>
    </TouchableOpacity>
    );
  }, [handleModelPress]);

  const renderFooter = useCallback(() => (
    <PaginatedListFooter loading={loadingMore} />
  ), [loadingMore]);

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
      <ModelModal 
        visible={modalVisible} 
        model={selectedModel} 
        authToken={authToken} 
        onClose={handleCloseModal} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  listContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },

  modelCard: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.navyDark,
    position: 'relative',
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(255, 145, 77, 0.9)', // Seagle Orange
    padding: 6,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  modelInfo: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
    fontFamily: FONTS.serifBold,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.navy + '20',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
