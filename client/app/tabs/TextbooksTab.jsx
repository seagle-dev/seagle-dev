import React, { useEffect, useCallback, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { fetchBooks, getBookCoverUrl } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import usePaginatedList from '../hooks/usePaginatedList';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import PaginatedListFooter from '../components/PaginatedListFooter';
import { PLACEHOLDER_BOOK_COVER } from '../../constants/placeholders';

const mapBook = (b) => ({
  id: String(b.id),
  title: b.title,
  description: b.description || '',
  author: b.uploadedBy || 'Unknown Author',
  category: b.category || 'General',
  image: b.coverImage
    ? getBookCoverUrl(b.id)
    : PLACEHOLDER_BOOK_COVER,
  readCount: b.readCount || 0,
  createdAt: b.createdAt,
  pdfUrl: b.pdfUrl,
  price: b.price || 1000,
});

export default function TextbooksTab({ search = '', category = null }) {
  const router = useRouter();

  const filters = useMemo(() => ({
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category ? { category } : {}),
    sort: 'newest',
  }), [search, category]);

  const {
    items: books,
    loading,
    refreshing,
    loadingMore,
    refresh,
    loadMore,
  } = usePaginatedList(fetchBooks, mapBook, filters);

  const handleBookPress = useCallback((book) => {
    router.push({
      pathname: '/tabs/book/BookDetails',
      params: {
        book: JSON.stringify({
          id: book.id,
          title: book.title,
          author: book.author,
          image: book.image,
          description: book.description,
          categories: [book.category],
          isOwned: false,
          price: book.price,
          originalPrice: null,
          rating: 0,
          reviews: book.readCount,
          pdfUrl: book.pdfUrl,
        }),
      },
    });
  }, [router]);

  const renderBookItem = useCallback(({ item }) => (
    <TouchableOpacity style={styles.bookCard} onPress={() => handleBookPress(item)} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.bookCover} resizeMode="cover" />
      </View>
      <View style={styles.bookInfo}>
        <View>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <View style={styles.readBadge}>
              <Ionicons name="eye-outline" size={10} color={COLORS.navy} />
              <Text style={styles.readBadgeText}>{item.readCount} Reads</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.readButton} activeOpacity={0.8}>
            <Ionicons name="book" size={14} color={COLORS.navy} />
            <Text style={styles.readButtonText}>Read Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
            <Ionicons name="heart-outline" size={18} color={COLORS.navy} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleBookPress]);

  const renderSeparator = () => <View style={{ height: SPACING.md }} />;

  const renderFooter = useCallback(() => (
    <PaginatedListFooter loading={loadingMore} />
  ), [loadingMore]);

  if (loading) return <LoadingView message="Loading books..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBookItem}
        ItemSeparatorComponent={renderSeparator}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState icon="book-outline" title="No textbooks found" subtitle="Try a different search or category" />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.navy} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  listContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },

  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    ...SHADOWS.medium,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
  },
  bookCover: {
    width: 85,
    height: 120,
    borderRadius: RADIUS.md,
    backgroundColor: '#f0f0f0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: SPACING.lg,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: 22,
    marginBottom: 4,
    fontFamily: FONTS.serifBold,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.regular,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.navy + '30',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.navy,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readBadgeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    gap: 8,
    ...SHADOWS.small,
  },
  readButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  favoriteButton: {
    padding: 6,
  },
});
