import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import Badge from '../../components/Badge';

export default function BookDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const book = params.book ? JSON.parse(params.book) : null;

  const [isLiked, setIsLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!book) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Book not found</Text>
        </View>
      </View>
    );
  }

  const handleBack = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/tabs');
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out "${book.title}" on Seagle!` });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const handleStartReading = () => {
    router.push({
      pathname: '/tabs/Reader',
      params: { book: JSON.stringify(book) },
    });
  };

  const handleBuyNow = () => {
    console.log('Buy Now clicked for:', book.title);
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

        {/* Single continuous card */}
        <View style={styles.card}>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="#111A50" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* ===== TOP ROW: Cover + Info ===== */}
          <View style={styles.topRow}>
            {/* Cover with border */}
            <View style={styles.coverWrapper}>
              <Image source={{ uri: book.image }} style={styles.bookCover} resizeMode="cover" />
            </View>

            {/* Right side info */}
            <View style={styles.infoColumn}>
              {/* Title + Share icon row */}
              <View style={styles.titleRow}>
                <Text style={styles.bookTitle} numberOfLines={3}>{book.title}</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton} activeOpacity={0.7}>
                  <Ionicons name="share-social-outline" size={20} color="#111A50" />
                </TouchableOpacity>
              </View>

              <Text style={styles.bookAuthor} numberOfLines={2}>{book.author}</Text>

              {/* Badge */}
              {book.isOwned ? (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedBadgeText}>Owned</Text>
                </View>
              ) : isFreeLibraryBook ? (
                <View style={styles.libraryBadge}>
                  <Text style={styles.libraryBadgeText}>Free</Text>
                </View>
              ) : (
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>Php {Number(book.price || 0).toFixed(0)}</Text>
                </View>
              )}

              {/* Description snippet next to cover */}
              <Text style={styles.snippetText} numberOfLines={4}>
                {book.description ||
                  'Lorem ipsum dolor sit amet consectetur adipiscing eli mattis sit phasellus mollis sit aliquam sit nullam.'}
              </Text>
            </View>
          </View>

          {/* ===== ACTIONS ===== */}
          {book.isOwned ? (
            /* OWNED: Progress bar + Start Reading */
            <View style={styles.ownedActions}>
              <View style={styles.progressRow}>
                <View style={styles.progressDot} />
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${book.progress ?? 0}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{book.progress ?? 0}%</Text>

                <TouchableOpacity
                  style={styles.startReadingButton}
                  onPress={handleStartReading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="book-outline" size={16} color="#fff" />
                  <Text style={styles.startReadingText}>Start Reading</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isFreeLibraryBook ? (
            <View style={styles.actionSection}>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.startReadingButtonFull}
                onPress={handleStartReading}
                activeOpacity={0.8}
              >
                <Ionicons name="book-outline" size={18} color="#fff" />
                <Text style={styles.startReadingTextFull}>Start Reading</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* NOT OWNED: Divider + Buy Now, Add to Likes, Add to Cart */
            <View style={styles.actionSection}>
              <View style={styles.divider} />
              <View style={styles.purchaseActions}>
                <TouchableOpacity
                  style={styles.buyNowButton}
                  onPress={handleBuyNow}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineButton, isLiked && styles.outlineButtonLiked]}
                  onPress={handleAddToLikes}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={14}
                    color={isLiked ? '#FF4444' : '#111A50'}
                  />
                  <Text style={[styles.outlineButtonText, isLiked && { color: '#FF4444' }]}>
                    Add to Likes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineButton, addedToCart && styles.outlineButtonAdded]}
                  onPress={handleAddToCart}
                  activeOpacity={0.8}
                  disabled={addedToCart}
                >
                  <Ionicons
                    name={addedToCart ? 'checkmark-circle' : 'cart-outline'}
                    size={14}
                    color="#111A50"
                  />
                  <Text style={styles.outlineButtonText}>
                    {addedToCart ? 'Added!' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ===== DESCRIPTION SECTION ===== */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {book.description ||
              'Anatomy 101 provides a clear and engaging introduction to the human body, covering everything from the chemical composition of cells to the complex functions of organ systems. With easy-to-follow explanations, detailed charts, and illustrations, this book simplifies anatomy without leaving out essential details. It\'s designed for students, educators, or anyone curious about how the body works, making even the most complex systems understandable.'}
          </Text>

          {/* ===== CATEGORY SECTION ===== */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryRow}>
            {(book.categories || ['Medicine', 'Anatomy']).map((cat, index) => (
              <View key={`${cat}-${index}`} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat}</Text>
              </View>
            ))}
          </View>

          {/* ===== ABOUT THE AUTHOR ===== */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>About the Author</Text>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.authorName}>{book.author}</Text>
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
  coverWrapper: { width: 120, height: 175, borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.orange, overflow: 'hidden', marginRight: SPACING.lg },
  bookCover: { width: '100%', height: '100%' },

  infoColumn: { flex: 1, paddingTop: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookTitle: { flex: 1, fontSize: FONT_SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 26, marginBottom: 2, marginRight: SPACING.sm, fontFamily: FONTS.serifBold },
  shareButton: { padding: SPACING.xs, marginTop: 2 },
  bookAuthor: { fontSize: FONT_SIZES.body, color: COLORS.textSecondary, marginBottom: SPACING.md, fontFamily: FONTS.regular },

  priceBadge: { borderWidth: 1.5, borderColor: COLORS.navy, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', marginBottom: SPACING.md },
  priceBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.navy, fontFamily: FONTS.regular },
  ownedBadge: { backgroundColor: COLORS.orangeBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.orange, marginBottom: SPACING.md },
  ownedBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.orange, fontFamily: FONTS.regular },
  libraryBadge: { backgroundColor: COLORS.bgLight, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.xl, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.navy, marginBottom: SPACING.md },
  libraryBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.navy, fontFamily: FONTS.regular },
  snippetText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 18, fontFamily: FONTS.light },

  actionSection: { marginTop: SPACING.xs },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.lg },
  purchaseActions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm },
  buyNowButton: { backgroundColor: COLORS.orange, paddingHorizontal: 22, paddingVertical: 10, borderRadius: RADIUS.xl },
  buyNowText: { fontSize: 13, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.regular },
  outlineButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.navy, paddingHorizontal: SPACING.md, paddingVertical: 9, borderRadius: RADIUS.xl, gap: 5 },
  outlineButtonText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.navy, fontFamily: FONTS.regular },
  outlineButtonLiked: { borderColor: COLORS.red, backgroundColor: '#fff5f5' },
  outlineButtonAdded: { borderColor: COLORS.navy, backgroundColor: '#f1f8f4' },

  ownedActions: { marginTop: SPACING.xs, marginBottom: SPACING.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.navy },
  progressBarContainer: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.sm, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.navy, borderRadius: RADIUS.sm },
  progressPercent: { fontSize: 13, fontWeight: '700', color: COLORS.navy, minWidth: 32, fontFamily: FONTS.regular },
  startReadingButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orange, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.xl, gap: 6 },
  startReadingText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.regular },
  startReadingButtonFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: RADIUS.pill, gap: SPACING.sm, marginBottom: SPACING.sm },
  startReadingTextFull: { color: COLORS.white, fontSize: FONT_SIZES.regular, fontWeight: '700', fontFamily: FONTS.regular },

  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.navy, marginBottom: SPACING.md, fontFamily: FONTS.serifBold },
  descriptionText: { fontSize: FONT_SIZES.body, color: '#444', lineHeight: 22, fontFamily: FONTS.light },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  categoryChip: { backgroundColor: COLORS.orange, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl },
  categoryChipText: { fontSize: 13, color: COLORS.white, fontWeight: '600', fontFamily: FONTS.regular },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  authorAvatar: { width: 48, height: 48, borderRadius: RADIUS.pill, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  authorName: { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontWeight: '600', fontFamily: FONTS.regular },

  cardBottomSpacing: { height: SPACING.xxl },
  bottomSpacing: { height: 30 },
});