import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import EmptyState from '../components/EmptyState';

const MOCK_CART_ITEMS = [
  {
    id: '1',
    title: 'Anatomy and Physiology 2e',
    author: 'J. Gordon Betts',
    price: 1250,
    image: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    title: 'Microbiology',
    author: 'Nina Parker',
    price: 950,
    image: 'https://via.placeholder.com/150',
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
      <Image source={{ uri: item.image }} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <Text style={styles.bookPrice}>Php {item.price.toLocaleString()}</Text>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={20} color={COLORS.red} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
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
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
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
  listContent: { padding: SPACING.lg },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    alignItems: 'center',
  },
  bookImage: {
    width: 70,
    height: 100,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bookPrice: {
    fontSize: FONT_SIZES.md,
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
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.navy,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.navy,
  },
  checkoutBtn: {
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xl,
    gap: 12,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  browseBtn: {
    backgroundColor: COLORS.orange,
    marginHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  browseBtnText: {
    color: COLORS.navy,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
});
