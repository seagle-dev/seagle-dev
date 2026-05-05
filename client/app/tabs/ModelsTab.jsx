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
import { Ionicons } from '@expo/vector-icons';
import { fetchModels, getToken } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import usePaginatedList from '../hooks/usePaginatedList';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import ModelModal from '../components/Reading/ModelModal';

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

  const renderModelItem = useCallback(({ item }) => (
    <TouchableOpacity style={styles.modelCard} onPress={() => handleModelPress(item)} activeOpacity={0.95}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.modelImage} resizeMode="cover" />
        <View style={styles.cardBadge}>
          <Ionicons name="cube-outline" size={14} color={COLORS.white} />
        </View>
      </View>
      <View style={styles.modelInfo}>
        <Text style={styles.modelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.modelCategory} numberOfLines={1}>{item.category}</Text>
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
    backgroundColor: COLORS.bgWhite,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: '100%',
    height: 200,
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
    backgroundColor: 'rgba(17, 26, 80, 0.6)',
    padding: 6,
    borderRadius: 8,
  },
  modelInfo: {
    padding: SPACING.lg,
  },
  modelName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
    fontFamily: FONTS.serifBold,
  },
  modelCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});