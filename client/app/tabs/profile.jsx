import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchProfile } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import CacheDebugPanel from '../components/CacheDebugPanel';
import { PLACEHOLDER_PROFILE_IMAGE } from '../../constants/placeholders';

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (err) {
        console.warn('Failed to fetch profile:', err.message);
        // Fallback to auth user if API fails or isn't implemented yet
        setProfile(authUser);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy} />
      </View>
    );
  }

  const user = profile || authUser;

  if (!user) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: user.profileImage || PLACEHOLDER_PROFILE_IMAGE }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageBadge}>
            <Ionicons name="camera" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role || 'Student'}</Text>
          </View>
        </View>
      </View>
      {/* ... rest of the component */}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <ProfileItem icon="person-outline" label="Edit Profile" />
        <ProfileItem icon="notifications-outline" label="Notifications" />
        <ProfileItem icon="shield-checkmark-outline" label="Security" />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <ProfileItem icon="color-palette-outline" label="Appearance" />
        <ProfileItem icon="language-outline" label="Language" />
        <ProfileItem icon="help-circle-outline" label="Help & Support" />
      </View>

      {/* Cache Debug Panel */}
      <View style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <CacheDebugPanel />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

function ProfileItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <View style={styles.iconBg}>
          <Ionicons name={icon} size={20} color={COLORS.navy} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...SHADOWS.small,
    marginBottom: SPACING.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.bgPrimary,
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.orange,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.navy,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.navy,
    fontWeight: '700',
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: 10,
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  logoutText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  bottomSpacing: { height: 40 },
});
