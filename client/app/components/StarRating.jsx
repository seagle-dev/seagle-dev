import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable star-rating display (read-only).
 *
 * @param {number} rating – decimal rating (e.g. 4.5)
 * @param {number} size   – icon size
 * @param {string} color  – star color
 */
export default function StarRating({ rating = 0, size = 12, color = '#FFA500' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Ionicons key={`f-${i}`} name="star" size={size} color={color} />);
  }
  if (hasHalf) {
    stars.push(<Ionicons key="h" name="star-half" size={size} color={color} />);
  }

  return <View style={styles.row}>{stars}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
});
