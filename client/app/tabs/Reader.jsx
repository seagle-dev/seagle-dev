import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopHeader from '../components/TopHeader';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Reader() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book) : null;

  const [selectedImage, setSelectedImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const sampleImages = [
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
  ];

  const handleImagePress = useCallback((imageUri) => {
    setSelectedImage(imageUri);
    setScale(1);
    setRotation(0);
  }, []);

  const closeViewer = useCallback(() => {
    setSelectedImage(null);
    setScale(1);
    setRotation(0);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.5, 1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleBackPress = useCallback(() => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/tabs/book/BookDetails',
      params: { book: JSON.stringify(book) },
    });
  }, [router, book]);


  if (!book) {
    return (
      <View style={styles.container}>
        <TopHeader 
          showBackButton={true}
          onBackPress={() => router.back()}
          backgroundColor={COLORS.bgPrimary}
          textColor={COLORS.navyDeep}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Book not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TopHeader 
        showBackButton={true}
        onBackPress={handleBackPress}
        title={book.title}
        backgroundColor={COLORS.bgPrimary}
        textColor={COLORS.navyDeep}
        showCart={false}
        showNotifications={false}
        showProfile={false}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Sample Reading Content */}
          <Text style={styles.paragraph}>
            Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Text>

          <Text style={styles.paragraph}>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet consectetur adipiscing elit.
          </Text>

          {/* Image Card */}
          <TouchableOpacity 
            style={styles.imageCard}
            onPress={() => handleImagePress(sampleImages[0])}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: sampleImages[0] }}
              style={styles.contentImage}
              resizeMode="cover"
            />
            <View style={styles.imageCaption}>
              <Ionicons name="expand-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.imageCaptionText}>Tap to view full size</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.paragraph}>
            Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris.
          </Text>

          <Text style={styles.paragraph}>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </Text>

          <Text style={styles.paragraph}>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </Text>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Floating Edit Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closeViewer}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Image with Transform */}
          <ScrollView
            contentContainerStyle={styles.imageScrollContainer}
            minimumZoomScale={1}
            maximumZoomScale={4}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: selectedImage }}
              style={[
                styles.fullImage,
                {
                  transform: [
                    { scale: scale },
                    { rotate: `${rotation}deg` }
                  ]
                }
              ]}
              resizeMode="contain"
            />
          </ScrollView>

          {/* Bottom Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={24} color="#fff" />
              <Text style={styles.toolButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toolButton}
              onPress={handleZoomOut}
              activeOpacity={0.7}
            >
              <Ionicons name="remove-circle-outline" size={24} color="#fff" />
              <Text style={styles.toolButtonText}>Zoom Out</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toolButton}
              onPress={handleZoomIn}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.toolButtonText}>Zoom In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toolButton}
              onPress={handleRotate}
              activeOpacity={0.7}
            >
              <Ionicons name="reload-outline" size={24} color="#fff" />
              <Text style={styles.toolButtonText}>Rotate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  content: {
    padding: SPACING.xl,
  },
  paragraph: {
    fontSize: FONT_SIZES.md,
    lineHeight: 26,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.light,
    textAlign: 'justify',
  },
  imageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    marginVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentImage: {
    width: '100%',
    height: 250,
    borderRadius: RADIUS.lg,
  },
  imageCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    gap: 6,
  },
  imageCaptionText: {
    fontSize: FONT_SIZES.xs + 3,
    color: COLORS.textLight,
    fontFamily: FONTS.light,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: SPACING.xl,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageScrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: SPACING.xl,
    paddingBottom: Platform.OS === 'web' ? 20 : 40,
  },
  toolButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  toolButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: FONTS.light,
  },
  bottomSpacing: {
    height: 40,
  },
});