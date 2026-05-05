import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ReadingTab from '../components/Reading/ReadingTab';
import { COLORS } from '../../constants/theme';

export default function Reader() {
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book) : null;

  return (
    <View style={styles.container}>
      <ReadingTab book={book} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
});