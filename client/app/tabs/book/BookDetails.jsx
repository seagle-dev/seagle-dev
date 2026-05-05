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
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/tabs/library');
    }
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

  // NEW: "Buy Now" just flips the local owned state
  const handleBuyNow = () => {
    setIsOwned(true);
  };

  const handleAddToLikes = () => setIsLiked((prev) => !prev);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const isFreeLibraryBook = !!book.pdfUrl && (!book.price || book.price === 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color={COLORS.navy} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Top Row: Cover + Info */}
          <View style={styles.topRow}>
            <View style={styles.coverWrapper}>
              <Image source={{ uri: book.image }} style={styles.bookCover} resizeMode="cover" />
            </View>

            <View style={styles.infoColumn}>
              <View style={styles.titleRow}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={22} color={COLORS.navy} />
                </TouchableOpacity>
              </View>

              <Text style={styles.bookAuthor}>{book.author || 'Unknown Author'}</Text>

              {/* Price / Owned / Free Badge */}
              {isOwned ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>✓ Owned</Text>
                </View>
              ) : isFreeLibraryBook ? (
                <View style={styles.libraryBadge}>
                  <Text style={styles.libraryBadgeText}>📚 Free Library Book</Text>
                </View>
              ) : (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>Php {book.price || 0}</Text>
                </View>
              )}

              <Text style={styles.snippetText} numberOfLines={3}>
                {book.description || 'No description available.'}
              </Text>
            </View>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <View style={styles.divider} />

            {isOwned || isFreeLibraryBook ? (
              /* ---------- OWNED / FREE: Show progress bar + reading button ---------- */
              <View style={styles.ownedActions}>
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Reading Progress</Text>
                    <Text style={styles.progressPercent}>{book.readingProgress || 0}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${book.readingProgress || 0}%` }]} />
                  </View>
                </View>

                <TouchableOpacity style={styles.startReadingButton} onPress={handleStartReading} activeOpacity={0.8}>
                  <Text style={styles.startReadingText}>
                    {isOwned ? 'Continue' : 'Start'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ---------- NOT OWNED: Show purchase controls in 3 columns ---------- */
              <View style={styles.purchaseActions}>
                <TouchableOpacity style={[styles.actionButton, styles.buyNowButton]} onPress={handleBuyNow} activeOpacity={0.8}>
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.outlineButton, isLiked && styles.outlineButtonLiked]}
                  onPress={handleAddToLikes}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={12} color={isLiked ? COLORS.red : COLORS.navy} />
                  <Text style={[styles.outlineButtonText, isLiked && { color: COLORS.red }]}>
                    {isLiked ? 'Liked' : 'Add to Likes'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.outlineButton, addedToCart && styles.outlineButtonAdded]}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                >
                  <Ionicons name={addedToCart ? 'checkmark-circle' : 'cart-outline'} size={12} color={COLORS.navy} />
                  <Text style={styles.outlineButtonText}>{addedToCart ? 'Added!' : 'Add to Cart'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Description Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {book.description || 'No description available for this book.'}
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

          {/* Author Section */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Author</Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
            <Text style={styles.authorName}>{book.author || 'Unknown Author'}</Text>
          </View>

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
  errorText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontFamily: FONTS.regular },

  card: {
    backgroundColor: COLORS.bgWhite,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    ...SHADOWS.small,
  },

  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.xs },
  backText: { fontSize: FONT_SIZES.regular, fontWeight: '600', color: COLORS.navy, fontFamily: FONTS.regular },

  topRow: { flexDirection: 'row', marginBottom: SPACING.lg },
  coverWrapper: { width: 120, height: 175, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.navy, overflow: 'hidden', marginRight: SPACING.lg },
  bookCover: { width: '100%', height: '100%' },

  infoColumn: { flex: 1, paddingTop: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookTitle: { flex: 1, fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.navy, lineHeight: 26, marginBottom: 2, marginRight: SPACING.sm, fontFamily: FONTS.serifBold },
  shareButton: { padding: SPACING.xs, marginTop: 2 },
  bookAuthor: { fontSize: FONT_SIZES.body, color: COLORS.textSecondary, marginBottom: SPACING.md, fontFamily: FONTS.regular },

  priceBadge: { borderWidth: 1.5, borderColor: COLORS.navy, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', marginBottom: SPACING.md },
  priceBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.navy, fontFamily: FONTS.regular },
  ownedBadge: { backgroundColor: COLORS.orangeBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.orange, marginBottom: SPACING.md },
  ownedBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.orange, fontFamily: FONTS.regular },
  libraryBadge: { backgroundColor: '#f0f4ff', paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.navy, marginBottom: SPACING.md },
  libraryBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.navy, fontFamily: FONTS.regular },
  snippetText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 18, fontFamily: FONTS.light },

  actionSection: { marginTop: SPACING.xs },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.lg },
  
  // 3-Column Purchase Actions
  purchaseActions: { flexDirection: 'row', gap: 6, marginBottom: SPACING.sm },
  actionButton: { 
    flex: 1, 
    height: 30, 
    borderRadius: RADIUS.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 4,
  },
  buyNowButton: { backgroundColor: COLORS.navy },
  buyNowText: { fontSize: 10, fontWeight: '700', color: COLORS.orange, fontFamily: FONTS.bold },
  
  outlineButton: { borderWidth: 1, borderColor: COLORS.navy },
  outlineButtonText: { fontSize: 10, fontWeight: '600', color: COLORS.navy, fontFamily: FONTS.regular },
  outlineButtonLiked: { borderColor: COLORS.red, backgroundColor: '#fff5f5' },
  outlineButtonAdded: { borderColor: COLORS.navy, backgroundColor: '#f1f8f4' },

  // Progress + Start Reading Row
  ownedActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SPACING.xs, 
    marginBottom: SPACING.sm,
    gap: SPACING.lg 
  },
  progressSection: { flex: 1 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  progressPercent: { fontSize: 11, fontWeight: '700', color: COLORS.navy, fontFamily: FONTS.bold },
  progressBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.navy },
  
  startReadingButton: { 
    backgroundColor: COLORS.orange, 
    height: 30, 
    paddingHorizontal: SPACING.lg, 
    borderRadius: RADIUS.md, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  startReadingText: { color: COLORS.navy, fontSize: 12, fontWeight: '700', fontFamily: FONTS.bold },

  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.md, fontFamily: FONTS.serifBold },
  descriptionText: { fontSize: FONT_SIZES.body, color: '#444', lineHeight: 22, fontFamily: FONTS.light },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  categoryChip: { backgroundColor: COLORS.orange, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl },
  categoryChipText: { fontSize: 13, color: COLORS.navy, fontWeight: '600', fontFamily: FONTS.medium },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  authorAvatar: { width: 48, height: 48, borderRadius: RADIUS.pill, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  authorName: { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontWeight: '600', fontFamily: FONTS.regular },

  cardBottomSpacing: { height: SPACING.xxl },
  bottomSpacing: { height: 30 },
});