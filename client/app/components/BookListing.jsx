import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchBooks, getBookCoverUrl } from '../../services/api';

export default function BookListing() {
  const [addedToCart, setAddedToCart] = useState({});
  const [recentBooks, setRecentBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const [newestRes, trendingRes] = await Promise.all([
        fetchBooks({ sort: 'newest', limit: 5 }),
        fetchBooks({ sort: 'trending', limit: 5 }),
      ]);
      setRecentBooks(newestRes.data || []);
      setTrendingBooks(trendingRes.data || []);
    } catch (err) {
      console.error('Failed to load books:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = (book) => {
    if (book.coverImage) return getBookCoverUrl(book.id);
    return 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200';
  };

  const handleBookPress = (book) => {
    const normalizedBook = {
      id: book.id,
      title: book.title,
      author: book.uploadedBy || '',
      image: getImageUri(book),
      description: book.description,
      category: book.category,
      isOwned: false,
      readCount: book.readCount || 0,
    };

    router.push({
      pathname: '/tabs/book/BookDetails',
      params: { book: JSON.stringify(normalizedBook) },
    });
  };

  const handleAddToCart = (book) => {
    console.log('Add to cart:', book.title);
    setAddedToCart(prev => ({ ...prev, [book.id]: true }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [book.id]: false }));
    }, 2000);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={`star-${i}`} name="star" size={12} color="#FFA500" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="star-half" name="star-half" size={12} color="#FFA500" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#111A50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Recent Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          {recentBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.recentCard}
              onPress={() => handleBookPress(book)}
              activeOpacity={0.95}
            >
              <View style={styles.recentCardContent}>
                {/* Book Cover */}
                <View style={styles.bookCoverContainer}>
                  <View style={[styles.bookCoverBg]}>
                    <Image
                      source={{ uri: getImageUri(book) }}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Book Info */}
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {book.category || ''}
                  </Text>

                  {/* Read count indicator */}
                  <View style={styles.chapterContainer}>
                    <Ionicons name="book-outline" size={12} color="#999" />
                    <Text style={styles.chapterText}>
                      {book.readCount || 0} reads
                    </Text>
                  </View>
                </View>

                {/* Arrow Button */}
                <View style={styles.arrowButtonContainer}>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => handleBookPress(book)}
                  >
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trending Books Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Books</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          {trendingBooks.map((book) => (
            <View key={book.id} style={styles.trendingCard}>
              <TouchableOpacity
                style={styles.trendingCardContent}
                onPress={() => handleBookPress(book)}
                activeOpacity={0.95}
              >
                {/* Book Cover */}
                <View style={styles.trendingCoverContainer}>
                  <Image
                    source={{ uri: getImageUri(book) }}
                    style={styles.trendingCover}
                    resizeMode="cover"
                  />
                </View>

                {/* Book Info */}
                <View style={styles.trendingBookInfo}>
                  <View>
                    <Text style={styles.trendingBookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.trendingBookAuthor} numberOfLines={1}>
                      {book.category || ''}
                    </Text>

                    {/* Reads Badge */}
                    <View style={styles.priceBadge}>
                      <Ionicons name="trending-up" size={12} color="#111A50" />
                      <Text style={styles.priceText}> {book.readCount || 0} reads</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Add to Cart Button */}
              <View style={styles.addToCartContainer}>
                <TouchableOpacity
                  style={[
                    styles.addToCartButton,
                    addedToCart[book.id] && styles.addedToCartButton
                  ]}
                  onPress={() => handleAddToCart(book)}
                  activeOpacity={0.8}
                  disabled={addedToCart[book.id]}
                >
                  <Ionicons
                    name={addedToCart[book.id] ? "checkmark-circle" : "cart-outline"}
                    size={18}
                    color="#111A50"
                  />
                  <Text style={[
                    styles.addToCartText,
                    addedToCart[book.id] && styles.addedToCartText
                  ]}>
                    {addedToCart[book.id] ? 'Added!' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  sectionContainer: {
    marginTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    borderRadius: 10,
    paddingTop: 16,
  },
  
  section: {
    paddingHorizontal: 8,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    fontFamily: 'STIXTwoText-Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111A50',
    fontFamily: 'FunnelSans-Light',
  },
  
  // Recent Card Styles - MODIFIED LAYOUT
  recentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 20,
  },
  recentCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  bookCoverContainer: {
    position: 'relative',
    marginRight: 16,
  },
  bookCoverBg: {
    width: 110, 
    height: 180, 
    borderRadius: 3,
    overflow: 'hidden',
  },
  bookCover: {
    width: 100, 
    height: 150,
    borderRadius: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 24,
    fontFamily: 'STIXTwoText-Bold',
  },
  bookAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'FunnelSans-Regular',
  },
  progressSection: {
    gap: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    width: 40,
    fontFamily: 'FunnelSans-Light',
  },
  chapterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'FunnelSans-Light',
  },
  

  arrowButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 41,
    height: 27,
    borderRadius: 26,
    backgroundColor: '#111A50',
  },
  arrowButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Trending Card Styles - MODIFIED LAYOUT
  trendingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'visible',
  },
  trendingCardContent: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  trendingCoverContainer: {
    position: 'relative',
    marginRight: 16,
  },
  trendingCover: {
    width: 100, 
    height: 150, 
    borderRadius: 12,
  },
  trendingBookInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  trendingBookTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 22,
    fontFamily: 'STIXTwoText-Bold',
  },
  trendingBookAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'FunnelSans-Light',
  },


  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCECDD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 26,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#111A50',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111A50',
    marginRight: 4,
    fontFamily: 'FunnelSans-Regular',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111A50',
    fontFamily: 'FunnelSans-Regular',
  },
  
  addToCartContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16, 
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#111A50',
    backgroundColor: '#fff',
    minWidth: 140,
    fontFamily: 'FunnelSans-Light',
  },
  addedToCartButton: {
    borderColor: '#111A50',
    backgroundColor: '#f1f8f4',
  },
  addToCartText: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#1a2b52',
    marginLeft: 6,
    fontFamily: 'FunnelSans-Regular',
  },
  addedToCartText: {
    color: '#111A50',
  },
  bottomSpacing: {
    height: 20,
  },
});
