import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MOCK_CLASSES = [
  { id: '1', title: 'Human Anatomy 101', instructor: 'Dr. Sarah Wilson', schedule: 'Mon, Wed 9:00 AM', status: 'In Progress', students: 45 },
  { id: '2', title: 'Medical Physiology', instructor: 'Prof. Michael Chen', schedule: 'Tue, Thu 11:30 AM', status: 'Upcoming', students: 38 },
  { id: '3', title: 'Clinical Microbiology', instructor: 'Dr. Elena Rodriguez', schedule: 'Fri 1:00 PM', status: 'In Progress', students: 52 },
];

export default function ClassroomTab() {
  const renderClassItem = ({ item }) => (
    <TouchableOpacity style={styles.classCard} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Feather name="book-open" size={20} color={COLORS.white} />
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.classTitle}>{item.title}</Text>
      
      <View style={styles.infoRow}>
        <Feather name="user" size={14} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{item.instructor}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Feather name="clock" size={14} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>{item.schedule}</Text>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.studentCount}>
          <Ionicons name="people-outline" size={16} color={COLORS.navy} />
          <Text style={styles.studentText}>{item.students} Students</Text>
        </View>
        <TouchableOpacity style={styles.enterButton}>
          <Text style={styles.enterButtonText}>Enter Class</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.navy} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_CLASSES}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Enrolled Classes</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Ionicons name="add" size={20} color={COLORS.navy} />
              <Text style={styles.joinButtonText}>Join Class</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  listContent: { padding: SPACING.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 4,
    ...SHADOWS.small,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  classCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.navy + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.navy,
    textTransform: 'uppercase',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentText: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '600',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
});