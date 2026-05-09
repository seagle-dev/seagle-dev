import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import EmptyState from '../components/EmptyState';
import { PLACEHOLDER_CART_IMAGE } from '../../constants/placeholders';

const MOCK_CART_ITEMS = [
  {
    id: '1',
    title: 'Anatomy and Physiology 2e',
    author: 'J. Gordon Betts',
    price: 1250,
    image: PLACEHOLDER_CART_IMAGE,
  },
  {
    id: '2',
    title: 'Microbiology',
    author: 'Nina Parker',
    price: 950,
    image: PLACEHOLDER_CART_IMAGE,
  },
];

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_CART_ITEMS);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartCard}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.bookImage} />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <Text style={styles.bookPrice}>Php {item.price.toLocaleString()}</Text>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color={COLORS.red} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState 
          icon="cart-outline" 
          title="Your cart is empty" 
          subtitle="Browse our library to add some books!"
        />
        <TouchableOpacity 
          style={styles.browseBtn} 
          onPress={() => router.push('/tabs/library')}
        >
          <Text style={styles.browseBtnText}>Browse Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <SummaryRow label="Subtotal" value={`Php ${subtotal.toLocaleString()}`} />
            <SummaryRow label="Tax (12%)" value={`Php ${tax.toLocaleString()}`} />
            <View style={styles.summaryDivider} />
            <SummaryRow label="Total" value={`Php ${total.toLocaleString()}`} isTotal />
            
            <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.8}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function SummaryRow({ label, value, isTotal }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, isTotal && styles.totalValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  emptyContainer: { flex: 1, backgroundColor: COLORS.bgPrimary, justifyContent: 'center' },
  listContent: { padding: SPACING.lg, paddingBottom: 40 },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  imageWrapper: {
    ...SHADOWS.small,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
  },
  bookImage: {
    width: 65,
    height: 90,
    borderRadius: RADIUS.sm,
  },
  bookInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
    fontFamily: FONTS.serifBold,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  bookPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.orange,
  },
  removeBtn: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  checkoutBtn: {
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    gap: 12,
    ...SHADOWS.small,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  browseBtn: {
    backgroundColor: COLORS.orange,
    marginHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.small,
  },
  browseBtnText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});
