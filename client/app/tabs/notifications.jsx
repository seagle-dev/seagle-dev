import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import EmptyState from '../components/EmptyState';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Book Available!',
    message: 'Anatomy and Physiology 2e is now in the library.',
    time: '2 hours ago',
    type: 'new_book',
    read: false,
  },
  {
    id: '2',
    title: 'Quiz Reminder',
    message: 'Don\'t forget your Anatomy quiz tomorrow at 9 AM.',
    time: '5 hours ago',
    type: 'reminder',
    read: true,
  },
  {
    id: '3',
    title: 'Course Updated',
    message: 'New slides have been added to Nursing 101.',
    time: '1 day ago',
    type: 'update',
    read: true,
  },
];

export default function NotificationsTab() {
  const router = useRouter();

  const handleGoToLibrary = () => {
    router.replace('/tabs/library');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconBg, { backgroundColor: getIconColor(item.type) }]}>
          <Ionicons name={getIconName(item.type)} size={20} color={COLORS.white} />
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity 
            style={styles.backToLibraryBtn} 
            onPress={handleGoToLibrary}
            activeOpacity={0.8}
          >
            <Ionicons name="library-outline" size={18} color={COLORS.navy} />
            <Text style={styles.backToLibraryText}>Explore Library</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.navy} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <EmptyState 
            icon="notifications-off-outline" 
            title="No Notifications" 
            subtitle="We'll notify you when something important happens."
          />
        }
      />
    </View>
  );
}

function getIconName(type) {
  switch (type) {
    case 'new_book': return 'book';
    case 'reminder': return 'alarm-outline';
    case 'update': return 'refresh-outline';
    default: return 'notifications-outline';
  }
}

function getIconColor(type) {
  switch (type) {
    case 'new_book': return COLORS.orange;
    case 'reminder': return COLORS.navy;
    case 'update': return COLORS.green || '#4CAF50';
    default: return COLORS.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  listContent: { padding: SPACING.lg, paddingBottom: 40 },
  
  backToLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    gap: 10,
    ...SHADOWS.small,
  },
  backToLibraryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  iconContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  time: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});