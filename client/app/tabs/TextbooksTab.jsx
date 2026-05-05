import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchBooks, getBookCoverUrl } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import usePaginatedList from '../hooks/usePaginatedList';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';

const mapBook = (b) => ({
  id: String(b.id),
  title: b.title,
  description: b.description || '',
  author: b.uploadedBy || 'Unknown Author',
  category: b.category || 'General',
  image: b.coverImage
    ? getBookCoverUrl(b.id)
    : 'https://via.placeholder.com/200x300?text=No+Cover',
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
    <TouchableOpacity style={styles.bookRow} onPress={() => handleBookPress(item)} activeOpacity={0.7}>
      <Image source={{ uri: item.image }} style={styles.bookCover} resizeMode="cover" />
      <View style={styles.bookInfo}>
        <View>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
          <View style={styles.badgesRow}>
            <Badge label={item.category} color={COLORS.orange} />
          </View>
          <Badge label={`Php ${item.price}`} variant="outline" color={COLORS.navy} style={styles.priceBadge} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Ionicons name="cart-outline" size={13} color={COLORS.navy} />
            <Text style={styles.actionButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Ionicons name="heart-outline" size={13} color={COLORS.navy} />
            <Text style={styles.actionButtonText}>Add to Likes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleBookPress]);

  const renderSeparator = () => <View style={styles.separator} />;

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.navy} />
      </View>
    ) : null;

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
  container: { flex: 1, backgroundColor: COLORS.bgWhite },
  listContent: { paddingTop: SPACING.sm, paddingBottom: SPACING.xl },

  bookRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.body || 14,
    backgroundColor: COLORS.bgWhite,
  },
  bookCover: {
    width: 75,
    height: 110,
    borderRadius: RADIUS.md,
    marginRight: SPACING.body || 14,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: COLORS.navy,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: FONT_SIZES.regular,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: 20,
    marginBottom: 2,
    fontFamily: FONTS.serifBold,
  },
  bookAuthor: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.regular,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  priceBadge: {
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.navy,
    fontFamily: FONTS.medium,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
});