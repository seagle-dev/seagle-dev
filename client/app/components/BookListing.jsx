import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import LoadingView from './LoadingView';
import { fetchHome, getBookCoverUrl } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { PLACEHOLDER_BOOK_COVER } from '../../constants/placeholders';

const mapRecentBook = (b) => ({
  id: String(b.id),
  title: b.title,
  author: '',
  progress: 50,
  chapter: '',
  image: b.coverImage ? getBookCoverUrl(b.id) : PLACEHOLDER_BOOK_COVER,
  coverColor: '#4A90E2',
  pdfUrl: b.pdfUrl,
});

const mapTrendingBook = (b) => ({
  id: String(b.id),
  title: b.title,
  author: '',
  price: 0,
  originalPrice: null,
  image: b.coverImage ? getBookCoverUrl(b.id) : PLACEHOLDER_BOOK_COVER,
  rating: 4.5,
  reviews: b.readCount || 0,
  pdfUrl: b.pdfUrl,
});

export default function BookListing() {
  const router = useRouter();
  const [recentBooks, setRecentBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchHome();
        setRecentBooks((data.recentlyRead || []).map(mapRecentBook));
        setTrendingBooks((data.trending || []).map(mapTrendingBook));
      } catch (err) {
        console.warn('Failed to load home data:', err.message);
        setRecentBooks([]);
        setTrendingBooks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBookPress = useCallback((book) => {
    const normalizedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      image: book.image,
      pdfUrl: book.pdfUrl,
      isOwned: book.progress !== undefined,
      ...(book.progress !== undefined
        ? { progress: book.progress, currentChapter: book.chapter }
        : { price: book.price, originalPrice: book.originalPrice, rating: book.rating, reviews: book.reviews }),
    };
    router.push({
      pathname: '/tabs/book/BookDetails',
      params: { book: JSON.stringify(normalizedBook) },
    });
  }, [router]);

  if (loading) return <LoadingView message="" color={COLORS.navy} backgroundColor={COLORS.bgPrimary} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Recent Section */}
      <SectionHeader title="Recent" />
      <View style={styles.section}>
        {recentBooks.length === 0 ? (
          <Text style={styles.emptyText}>No recently read books</Text>
        ) : (
          recentBooks.map((book) => (
            <TouchableOpacity key={book.id} style={styles.recentCard} onPress={() => handleBookPress(book)} activeOpacity={0.95}>
              <View style={styles.recentCardContent}>
                <View style={styles.bookCoverBg}>
                  <Image source={{ uri: book.image }} style={styles.bookCover} resizeMode="cover" />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                  <View style={styles.progressSection}>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${book.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{book.progress}%</Text>
                    </View>
                    <View style={styles.chapterContainer}>
                      <Ionicons name="book-outline" size={12} color={COLORS.textTertiary} />
                      <Text style={styles.chapterText}>{book.chapter}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Trending Section */}
      <SectionHeader title="Trending" />
      <View style={styles.section}>
        {trendingBooks.length === 0 ? (
          <Text style={styles.emptyText}>No trending books yet</Text>
        ) : (
          trendingBooks.map((book) => (
            <TouchableOpacity key={book.id} style={styles.trendingCard} onPress={() => handleBookPress(book)} activeOpacity={0.95}>
              <View style={styles.trendingCardContent}>
                <Image source={{ uri: book.image }} style={styles.trendingCover} resizeMode="cover" />
                <View style={styles.trendingBookInfo}>
                  <Text style={styles.trendingBookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.trendingBookAuthor} numberOfLines={1}>{book.author}</Text>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceLabel}>Reads</Text>
                    <Text style={styles.priceText}>{book.reviews}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

/** Inline sub-component for section header with "See All" */
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollContent: { paddingBottom: SPACING.xl },
  emptyText: { textAlign: 'center', color: COLORS.textTertiary, padding: SPACING.xl },

  sectionContainer: { marginTop: SPACING.xxl, paddingBottom: SPACING.lg, backgroundColor: COLORS.bgWhite, marginHorizontal: SPACING.sm, borderRadius: RADIUS.md, paddingTop: SPACING.lg },
  section: { paddingHorizontal: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, fontFamily: FONTS.serifBold },
  seeAllText: { fontSize: FONT_SIZES.body, fontWeight: '600', color: COLORS.navy, fontFamily: FONTS.light },

  // Recent card
  recentCard: { backgroundColor: COLORS.bgWhite, marginHorizontal: SPACING.sm, marginBottom: SPACING.md, borderRadius: RADIUS.xl },
  recentCardContent: { flexDirection: 'row', padding: SPACING.lg, alignItems: 'center', gap: SPACING.md },
  bookCoverBg: { width: 110, height: 180, borderRadius: 3, overflow: 'hidden' },
  bookCover: { width: 100, height: 150, borderRadius: SPACING.md, borderWidth: 1, borderColor: COLORS.navy },
  bookInfo: { flex: 1, justifyContent: 'flex-start', paddingTop: SPACING.xs },
  bookTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs, lineHeight: 24, fontFamily: FONTS.serifBold },
  bookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md, fontFamily: FONTS.regular },

  progressSection: { gap: SPACING.sm },
  progressContainer: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { flex: 1, height: 8, backgroundColor: '#e8f5e9', borderRadius: RADIUS.sm, overflow: 'hidden', marginRight: 10 },
  progressFill: { height: '100%', borderRadius: RADIUS.sm, backgroundColor: COLORS.navy },
  progressText: { fontSize: 13, fontWeight: '700', width: 40, fontFamily: FONTS.light, color: COLORS.navy },
  chapterContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chapterText: { fontSize: FONT_SIZES.md, color: COLORS.textTertiary, fontFamily: FONTS.light },

  // Trending card
  trendingCard: { backgroundColor: COLORS.bgWhite, marginHorizontal: SPACING.sm, marginBottom: SPACING.md, borderRadius: RADIUS.xl, overflow: 'visible' },
  trendingCardContent: { flexDirection: 'row', padding: SPACING.lg, paddingBottom: SPACING.md },
  trendingCover: { width: 100, height: 150, borderRadius: SPACING.md, marginRight: SPACING.lg, borderWidth: 1, borderColor: COLORS.navy },
  trendingBookInfo: { flex: 1, justifyContent: 'flex-start', paddingTop: SPACING.xs },
  trendingBookTitle: { fontSize: 17, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.xs, lineHeight: 22, fontFamily: FONTS.serifBold },
  trendingBookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md, fontFamily: FONTS.light },

  priceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orangeLight, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.pill, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.navy },
  priceLabel: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.navy, marginRight: SPACING.xs, fontFamily: FONTS.medium },
  priceText: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.navy, fontFamily: FONTS.bold },

  bottomSpacing: { height: SPACING.xl },
});
