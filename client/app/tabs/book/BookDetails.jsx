import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';

export default function BookDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const book = params.book ? JSON.parse(params.book) : null;

  const [isLiked, setIsLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  // NEW: local "owned" state — defaults to book.isOwned from params
  const [isOwned, setIsOwned] = useState(book?.isOwned ?? false);

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.replace('/tabs/library');
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out "${book.title}" on Seagle!` });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleStartReading = () => {
    router.push({
      pathname: '/tabs/Reader',
      params: {
        book: JSON.stringify({
          id: book.id,
          title: book.title,
          pdfUrl: book.pdfUrl,
        }),
      },
    });
  };

  const handleToggleLike = () => setIsLiked((prev) => !prev);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.navy} />
            <Text style={styles.backText}>Back to Library</Text>
          </TouchableOpacity>

          {/* Header Row: Title + Share */}
          <View style={styles.titleSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author || 'Unknown Author'}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconAction} onPress={handleToggleLike}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? COLORS.red : COLORS.navy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Top Row: Cover + Snippet */}
          <View style={styles.topRow}>
            <View style={styles.coverWrapper}>
              <Image source={{ uri: book.image }} style={styles.bookCover} resizeMode="cover" />
            </View>

            <View style={styles.infoColumn}>
              <View style={styles.libraryBadge}>
                <Ionicons name="book" size={12} color={COLORS.navy} />
                <Text style={styles.libraryBadgeText}>Digital Edition</Text>
              </View>

              <Text style={styles.snippetText} numberOfLines={6}>
                {book.description || 'Discover the intricacies of medical science with this comprehensive textbook.'}
              </Text>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <View style={styles.divider} />
            
            <View style={styles.progressRow}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Current Progress</Text>
                <Text style={styles.progressValue}>{book.readingProgress || 0}%</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${book.readingProgress || 0}%` }]} />
              </View>
            </View>

            <TouchableOpacity style={styles.mainReadButton} onPress={handleStartReading} activeOpacity={0.8}>
              <Ionicons name="book-open-outline" size={20} color={COLORS.navy} />
              <Text style={styles.mainReadText}>Start Reading</Text>
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>About this book</Text>
          <Text style={styles.descriptionText}>
            {book.description || 'No detailed description available for this textbook.'}
          </Text>

          {/* Categories */}
          {book.categories?.length > 0 && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoryRow}>
                {book.categories.map((cat, idx) => (
                  <View key={idx} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.cardBottomSpacing} />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scrollView: { flex: 1 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.lg, 
    gap: 4,
    alignSelf: 'flex-start'
  },
  backText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.navy, 
    fontFamily: FONTS.regular 
  },

  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    lineHeight: 28,
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topRow: { flexDirection: 'row', marginBottom: SPACING.xl },
  coverWrapper: { 
    width: 110, 
    height: 160, 
    borderRadius: RADIUS.md, 
    ...SHADOWS.medium,
    backgroundColor: COLORS.white,
    marginRight: SPACING.lg 
  },
  bookCover: { width: '100%', height: '100%', borderRadius: RADIUS.md },

  infoColumn: { flex: 1 },
  libraryBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgLight, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: COLORS.navy + '20', 
    alignSelf: 'flex-start', 
    marginBottom: SPACING.md 
  },
  libraryBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.navy },
  snippetText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, fontFamily: FONTS.regular },

  actionSection: { marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.lg },
  
  progressRow: {
    marginBottom: SPACING.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  barContainer: {
    height: 8,
    backgroundColor: COLORS.bgPrimary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.navy,
  },

  mainReadButton: { 
    backgroundColor: COLORS.orange, 
    flexDirection: 'row',
    height: 50, 
    borderRadius: RADIUS.lg, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.small,
  },
  mainReadText: { color: COLORS.navy, fontSize: 16, fontWeight: '700' },

  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.md, fontFamily: FONTS.serifBold },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: { 
    backgroundColor: COLORS.bgPrimary, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipText: { fontSize: 12, color: COLORS.navy, fontWeight: '600' },

  cardBottomSpacing: { height: SPACING.lg },
  bottomSpacing: { height: 30 },
});