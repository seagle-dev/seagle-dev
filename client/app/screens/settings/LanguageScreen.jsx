import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { id: 'en', name: 'English (US)', sub: 'Default' },
  { id: 'en-gb', name: 'English (UK)', sub: 'British English' },
  { id: 'fil', name: 'Filipino', sub: 'Tagalog' },
  { id: 'es', name: 'Español', sub: 'Spanish' },
];

export default function LanguageScreen() {
  const [selectedLang, setSelectedLang] = useState('en');

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Language" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferred Language</Text>
          <Text style={styles.sectionSubtitle}>Select your interface language for the app.</Text>
        </View>

        <View style={styles.card}>
          {LANGUAGES.map((lang, index) => (
            <React.Fragment key={lang.id}>
              <TouchableOpacity 
                style={styles.row} 
                onPress={() => setSelectedLang(lang.id)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.langName, selectedLang === lang.id && styles.selectedText]}>{lang.name}</Text>
                  <Text style={styles.langSub}>{lang.sub}</Text>
                </View>
                {selectedLang === lang.id && (
                  <Ionicons name="radio-button-on" size={24} color={COLORS.orange} />
                ) || (
                  <Ionicons name="radio-button-off" size={24} color={COLORS.border} />
                )}
              </TouchableOpacity>
              {index < LANGUAGES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.lg 
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  langName: { fontSize: 16, color: COLORS.navy, fontWeight: '500' },
  langSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  selectedText: { fontWeight: '700' },
});