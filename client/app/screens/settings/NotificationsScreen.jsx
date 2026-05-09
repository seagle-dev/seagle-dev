import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';

export default function NotificationsScreen() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [activityReminders, setActivityReminders] = useState(true);
  const [announcements, setAnnouncements] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Notifications" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose how you want to be notified about updates.</Text>
        </View>

        <View style={styles.card}>
          <NotificationRow 
            title="Email Alerts" 
            subtitle="New course materials or grade updates" 
            value={emailAlerts} 
            onValueChange={setEmailAlerts} 
          />
          <View style={styles.divider} />
          <NotificationRow 
            title="Activity Reminders" 
            subtitle="Alerts for upcoming class deadlines" 
            value={activityReminders} 
            onValueChange={setActivityReminders} 
          />
          <View style={styles.divider} />
          <NotificationRow 
            title="System Announcements" 
            subtitle="Platform updates and maintenance" 
            value={announcements} 
            onValueChange={setAnnouncements} 
            isLast
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationRow({ title, subtitle, value, onValueChange, isLast }) {
  return (
    <View style={[styles.row, isLast && { paddingBottom: 0 }]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D1D6', true: COLORS.orange }}
        thumbColor={COLORS.white}
        ios_backgroundColor="#D1D1D6"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xl },
  sectionHeader: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.md 
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.navy, marginBottom: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
});