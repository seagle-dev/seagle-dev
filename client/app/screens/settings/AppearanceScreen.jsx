import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';

const THEMES = ['Light', 'Dark', 'System Default'];
const TIMEZONES = ['(GMT+08:00) Manila', '(GMT-08:00) Pacific Time', '(GMT+00:00) UTC'];

export default function AppearanceScreen() {
  const [selectedTheme, setSelectedTheme] = useState('Light');
  const [selectedTZ, setSelectedTZ] = useState('(GMT+08:00) Manila');

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Appearance" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Theme</Text>
          <Text style={styles.sectionSubtitle}>Choose how Seagle looks on your device.</Text>
        </View>

        <View style={styles.card}>
          {THEMES.map((theme, index) => (
            <React.Fragment key={theme}>
              <TouchableOpacity 
                style={styles.row} 
                onPress={() => setSelectedTheme(theme)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, selectedTheme === theme && styles.selectedText]}>{theme}</Text>
                {selectedTheme === theme && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.orange} />
                )}
              </TouchableOpacity>
              {index < THEMES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
          <Text style={styles.sectionTitle}>Region & Time</Text>
          <Text style={styles.sectionSubtitle}>Set your local preferences for scheduling.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Time Zone</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedTZ}</Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.navy} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
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
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  optionText: { fontSize: 15, color: COLORS.navy, fontWeight: '500' },
  selectedText: { fontWeight: '700', color: COLORS.navy },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownText: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
});