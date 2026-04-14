import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TopHeader from '../components/TopHeader';
import ReadingTab from '../components/Reading/ReadingTab';
import { COLORS } from '../../constants/theme';

export default function Reader() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const book = params.book ? JSON.parse(params.book) : null;

  const handleBackPress = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else if (book) {
      router.replace({
        pathname: '/tabs/book/BookDetails',
        params: { book: JSON.stringify(book) },
      });
    } else {
      router.replace('/tabs/library');
    }
  };

  return (
    <View style={styles.container}>
      <TopHeader
        showBackButton
        onBackPress={handleBackPress}
        title={book?.title || 'Reader'}
        backgroundColor={COLORS.bgPrimary}
        textColor={COLORS.navyDeep}
        showCart={false}
        showNotifications={false}
        showProfile={false}
      />
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