import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Book Card */}
        <View style={styles.bookCard}>

          {/* Back Button */}
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.cardBackButton} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color="#111A50" />
              <Text style={styles.cardBackText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Cover + Info Row */}
          <View style={styles.bookCardContent}>
            <View style={styles.coverContainer}>
              <Image source={{ uri: book.image }} style={styles.bookCover} resizeMode="cover" />
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle} numberOfLines={3}>
                {book.title}
              </Text>
              <Text style={styles.bookAuthor} numberOfLines={2}>
                {book.author}
              </Text>

              {book.isOwned ? (
                <>
                  <View style={styles.ownedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#111A50" />
                    <Text style={styles.ownedText}>Owned</Text>
                  </View>
                  <View style={styles.chapterContainer}>
                    <Ionicons name="book-outline" size={14} color="#666" />
                    <Text style={styles.chapterText}>{book.currentChapter ?? ''}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.priceContainer}>
                  {book.originalPrice ? (
                    <Text style={styles.originalPrice}>
                      Php {Number(book.originalPrice).toFixed(0)}
                    </Text>
                  ) : null}
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceLabel}>Php</Text>
                    <Text style={styles.priceText}>{Number(book.price).toFixed(0)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Owned vs Not Owned */}
          {book.isOwned ? (
            <View style={styles.ownedRow}>
              {/* Left: Progress */}
              <View style={styles.progressColumn}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${book.progress ?? 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{book.progress ?? 0}%</Text>
                </View>
              </View>

              {/* Right: Start Reading */}
              <TouchableOpacity
                style={styles.startReadingButtonInline}
                onPress={handleStartReading}
                activeOpacity={0.8}
              >
                <Ionicons name="book-outline" size={18} color="#fff" />
                <Text style={styles.startReadingText}>Start Reading</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              {/* Buy Now */}
              <TouchableOpacity style={styles.actionCol} onPress={handleBuyNow} activeOpacity={0.8}>
                <View style={styles.actionBtnPrimary}>
                  <Ionicons name="cart" size={14} color="#fff" />
                  <Text style={styles.actionBtnPrimaryText}>Buy Now</Text>
                </View>
              </TouchableOpacity>

              {/* Add to Likes */}
              <TouchableOpacity style={styles.actionCol} onPress={handleAddToLikes} activeOpacity={0.8}>
                <View style={[styles.actionBtnSecondary, isLiked && styles.actionBtnLiked]}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={14}
                    color={isLiked ? '#FF4444' : '#111A50'}
                  />
                  <Text style={[styles.actionBtnSecondaryText, isLiked && { color: '#FF4444' }]}>
                    Add to Likes
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Add to Cart */}
              <TouchableOpacity
                style={styles.actionCol}
                onPress={handleAddToCart}
                activeOpacity={0.8}
                disabled={addedToCart}
              >
                <View style={[styles.actionBtnSecondary, addedToCart && styles.actionBtnAdded]}>
                  <Ionicons
                    name={addedToCart ? 'checkmark-circle' : 'cart-outline'}
                    size={14}
                    color="#111A50"
                  />
                  <Text style={styles.actionBtnSecondaryText}>
                    {addedToCart ? 'Added!' : 'Add to Cart'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {book.description ||
              'Explore the comprehensive guide to human anatomy with detailed illustrations and expert insights.'}
          </Text>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryChips}>
            {(book.categories || (book.category ? [book.category] : ['General'])).map((category, index) => (
              <View key={`${category}-${index}`} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About the Author */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Author</Text>
          <View style={styles.authorContainer}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={24} color="#111A50" />
            </View>
            <Text style={styles.authorName}>{book.author}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#666', fontFamily: 'FunnelSans-Regular' },

  bookCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCardContent: { flexDirection: 'row', marginBottom: 16 },
  coverContainer: { marginRight: 20 },
  bookCover: { width: 120, height: 180, borderRadius: 12 },

  bookInfo: { flex: 1, justifyContent: 'flex-start' },
  bookTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 26,
    fontFamily: 'STIXTwoText-Bold',
  },
  bookAuthor: { fontSize: 14, color: '#666', marginBottom: 12, fontFamily: 'FunnelSans-Regular' },

  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#111A50',
  },
  ownedText: { fontSize: 13, fontWeight: '600', color: '#111A50', marginLeft: 4, fontFamily: 'FunnelSans-Regular' },

  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', fontFamily: 'FunnelSans-Regular' },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCECDD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  priceLabel: { fontSize: 13, fontWeight: '600', color: '#111A50', marginRight: 4, fontFamily: 'FunnelSans-Regular' },
  priceText: { fontSize: 14, fontWeight: '800', color: '#111A50', fontFamily: 'FunnelSans-Regular' },

  progressSection: { marginBottom: 16, gap: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center' },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#111A50', borderRadius: 5 },
  progressText: { fontSize: 14, fontWeight: '700', color: '#111A50', width: 45, fontFamily: 'FunnelSans-Regular' },

  chapterContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  chapterText: { fontSize: 13, color: '#666', fontFamily: 'FunnelSans-Light' },

  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },

  actionCol: {
    width: 112,
    alignItems: 'center',
  },

  actionBtnPrimary: {
    width: 112,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    gap: 4,
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'FunnelSans-Regular',
  },

  actionBtnSecondary: {
    width: 112,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#111A50',
    gap: 4,
  },
  actionBtnSecondaryText: {
    color: '#111A50',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'FunnelSans-Regular',
  },
  actionBtnLiked: {
    borderColor: '#FF4444',
    backgroundColor: '#fff5f5',
  },
  actionBtnAdded: {
    borderColor: '#111A50',
    backgroundColor: '#f1f8f4',
  },

  startReadingText: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: 'FunnelSans-Regular' },

  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, fontFamily: 'STIXTwoText-Bold' },
  descriptionText: { fontSize: 14, color: '#666', lineHeight: 22, fontFamily: 'FunnelSans-Light' },

  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#111A50',
  },
  categoryChipText: { fontSize: 13, color: '#111A50', fontWeight: '600', fontFamily: 'FunnelSans-Regular' },

  authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: { fontSize: 16, color: '#1a1a1a', fontWeight: '600', fontFamily: 'FunnelSans-Regular' },

  bottomSpacing: { height: 30 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },

  cardBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },

  cardBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111A50',
    fontFamily: 'FunnelSans-Light',
  },

  ownedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },

  progressColumn: {
    flex: 1,
  },

  startReadingButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111A50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
  },
});