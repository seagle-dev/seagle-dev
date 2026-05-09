import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MOCK_QUIZZES = [
  { id: '1', title: 'Skeletal System Review', duration: '20 mins', questions: 25, score: '85%', status: 'Completed' },
  { id: '2', title: 'Muscular Physiology Quiz', duration: '15 mins', questions: 20, score: null, status: 'Not Started' },
  { id: '3', title: 'Cardiovascular System', duration: '30 mins', questions: 40, score: '92%', status: 'Completed' },
  { id: '4', title: 'Digestive Processes', duration: '25 mins', questions: 30, score: null, status: 'Not Started' },
];

export default function QuizzesTab() {
  const renderQuizItem = ({ item }) => {
    const isCompleted = item.status === 'Completed';
    
    return (
      <TouchableOpacity style={styles.quizCard} activeOpacity={0.9}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: isCompleted ? COLORS.green + '20' : COLORS.orange + '20' }]}>
            <MaterialCommunityIcons 
              name={isCompleted ? "clipboard-check-outline" : "clipboard-text-outline"} 
              size={24} 
              color={isCompleted ? COLORS.green : COLORS.orange} 
            />
          </View>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="list-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{item.questions} Qs</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.cardRight}>
          {isCompleted ? (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{item.score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_QUIZZES}
        keyExtractor={(item) => item.id}
        renderItem={renderQuizItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Available Assessments</Text>
            <Text style={styles.headerSubtitle}>Track your progress and test your knowledge.</Text>
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
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.green + '30',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.green,
  },
  scoreLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});