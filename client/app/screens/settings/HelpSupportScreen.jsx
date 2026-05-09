import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../../constants/theme';
import TopHeader from '../../components/TopHeader';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSupportScreen() {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@seagle.edu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopHeader showBackButton={true} title="Help & Support" showNotifications={false} showCart={false} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.sectionSubtitle}>Have questions or issues? We're here to help.</Text>
        </View>

        <TouchableOpacity style={styles.supportCard} onPress={handleEmailSupport} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={24} color={COLORS.white} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardSubtitle}>support@seagle.edu</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.navy + '30'} />
        </TouchableOpacity>

        <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>

        <View style={styles.card}>
          <FaqItem 
            question="How do I view 3D models?" 
            answer="Simply open any textbook and look for 3D icons. Tap them to enter the interactive viewer." 
          />
          <View style={styles.divider} />
          <FaqItem 
            question="Can I download books for offline?" 
            answer="Yes, Seagle automatically caches books you read so you can access them without an internet connection." 
          />
          <View style={styles.divider} />
          <FaqItem 
            question="How do I reset my password?" 
            answer="Go to Security settings or use the 'Forgot Password' link on the login screen." 
            isLast
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function FaqItem({ question, answer, isLast }) {
  return (
    <View style={[styles.faqItem, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Text style={styles.faqAnswer}>{answer}</Text>
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
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqItem: { paddingVertical: SPACING.md },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  faqAnswer: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  divider: { height: 1, backgroundColor: COLORS.border },
});