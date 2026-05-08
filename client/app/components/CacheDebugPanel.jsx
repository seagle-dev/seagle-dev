// client/app/components/CacheDebugPanel.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { clearOfflineCache } from '../../services/offlineLibraryCache';

export default function CacheDebugPanel() {
  const [loading, setLoading] = useState(false);

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will delete all offline book data and models. You will need to re-download them.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Clear Cache',
          onPress: async () => {
            setLoading(true);
            try {
              await clearOfflineCache();
              Alert.alert(
                'Success',
                '✓ All offline cache has been cleared.\n\nYou can now access fresh data from the server.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              Alert.alert('Error', `Failed to clear cache: ${err.message}`);
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="cog" size={24} color={COLORS.navy} />
        <Text style={styles.title}>Cache & Debug</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Cache Management</Text>

        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Ionicons name="trash-outline" size={20} color={COLORS.navy} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Clear All Cache</Text>
              <Text style={styles.cardDesc}>
                Delete all downloaded books, models, and mappings
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearCache}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Clear</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={COLORS.navy} />
          <Text style={styles.infoText}>
            Use this after moving to a new storage bucket (e.g., Firebase → Supabase). The app will re-download fresh data on next use.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Reset</Text>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>To reset database file paths:</Text>
          <Text style={styles.instructionText}>
            Run on your server:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>node script/resetFileCache.js</Text>
          </View>

          <Text style={styles.instructionText}>
            To delete all data:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>node script/resetFileCache.js --delete-all</Text>
          </View>

          <Text style={styles.disclaimerText}>
            ⚠️ This permanently deletes all books, models, and annotations.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.serifBold,
    color: COLORS.navy,
    marginLeft: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
    color: COLORS.navy,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: FONTS.sansBold,
    color: COLORS.navy,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  button: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONTS.sansBold,
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.navy,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.navy,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
  instructionBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionTitle: {
    fontSize: 13,
    fontFamily: FONTS.sansBold,
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.navy,
  },
  code: {
    fontFamily: 'Courier New',
    fontSize: 11,
    color: '#333',
    letterSpacing: 0.3,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#dc3545',
    fontFamily: FONTS.sansBold,
    marginTop: SPACING.md,
  },
});
