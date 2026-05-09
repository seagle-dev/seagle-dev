import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { fetchProfile } from '../../services/api';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import CacheDebugPanel from '../components/CacheDebugPanel';
import { PLACEHOLDER_PROFILE_IMAGE } from '../../constants/placeholders';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user: authUser, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' or 'Settings'
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (err) {
        console.warn('Failed to fetch profile:', err.message);
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

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.navy }]}>
          <View style={styles.statIconContainer}>
            <Feather name="book-open" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Classes Enrolled</Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }]}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.navy }]}>
            <Feather name="check-circle" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: COLORS.navy }]}>3</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Classes Completed</Text>
          </View>
        </View>
      </View>

      {/* Personal Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal</Text>
        <Text style={styles.sectionSubtitle}>Manage your account identity. Note: Your registered email is permanent and cannot be edited.</Text>
      </View>

      <View style={styles.infoGrid}>
        <InfoItem label="First Name" value={user.firstName} />
        <InfoItem label="Last Name" value={user.lastName} />
        <InfoItem label="Username" value={user.username || user.email?.split('@')[0]} />
        <InfoItem label="Email Address" value={user.email} isLocked={true} />
      </View>

      {/* Academic Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <Text style={styles.sectionSubtitle}>Your official school records. These fields are read-only.</Text>
      </View>

      <View style={styles.infoGrid}>
        <InfoItem label="Department" value={user.department || 'Medicine'} isLocked={true} />
        <InfoItem label="Course" value={user.course || 'Anatomy'} isLocked={true} />
        <InfoItem label="Year Level" value={user.yearLevel || '1st Year'} isLocked={true} />
      </View>

      <TouchableOpacity 
        style={styles.editProfileButton}
        onPress={() => router.push('/screens/settings/EditProfileScreen')}
      >
        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.groupTitle}>Notifications</Text>
      <View style={styles.settingsGroup}>
        <SettingItem 
          icon="mail-outline" 
          title="Email Alerts" 
          subtitle="Toggle for new course materials or grade updates." 
          onPress={() => router.push('/screens/settings/NotificationsScreen')}
        />
        <SettingItem 
          icon="notifications-outline" 
          title="Activity Reminders" 
          subtitle="Alerts for upcoming class deadlines or events." 
          onPress={() => router.push('/screens/settings/NotificationsScreen')}
        />
        <SettingItem 
          icon="megaphone-outline" 
          title="System Announcements" 
          subtitle="Toggle for maintenance or platform updates." 
          onPress={() => router.push('/screens/settings/NotificationsScreen')}
        />
      </View>

      <Text style={styles.groupTitle}>Security</Text>
      <View style={styles.settingsGroup}>
        <SettingItem 
          icon="lock-closed-outline" 
          title="Password" 
          subtitle="Manage your password." 
          onPress={() => router.push('/screens/settings/SecurityScreen')}
        />
        <SettingItem 
          icon="shield-checkmark-outline" 
          title="Two-Factor Authentication" 
          subtitle="Enable extra security." 
          onPress={() => router.push('/screens/settings/SecurityScreen')}
        />
      </View>

      <Text style={styles.groupTitle}>Display Preferences</Text>
      <View style={styles.settingsGroup}>
        <SettingItem 
          icon="language-outline" 
          title="Language" 
          subtitle="Select the interface language." 
          onPress={() => router.push('/screens/settings/LanguageScreen')}
        />
        <SettingItem 
          icon="time-outline" 
          title="Time Zone" 
          subtitle="Select your local time zone here." 
          onPress={() => router.push('/screens/settings/AppearanceScreen')}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: user.profileImage || PLACEHOLDER_PROFILE_IMAGE }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.nameText}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.roleText}>{user.role?.toUpperCase() || 'STUDENT'}</Text>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Profile' && styles.activeTabItem]}
              onPress={() => setActiveTab('Profile')}
            >
              <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>Profile</Text>
              {activeTab === 'Profile' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'Settings' && styles.activeTabItem]}
              onPress={() => setActiveTab('Settings')}
            >
              <Text style={[styles.tabText, activeTab === 'Settings' && styles.activeTabText]}>Settings</Text>
              {activeTab === 'Settings' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'Profile' ? renderProfileTab() : renderSettingsTab()}

        <View style={styles.devSection}>
          <CacheDebugPanel />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value, isLocked }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label} {isLocked && <Ionicons name="lock-closed" size={10} color={COLORS.textTertiary} />}</Text>
      <View style={[styles.infoValueContainer, isLocked && styles.lockedValueContainer]}>
        <Text style={styles.infoValue}>{value || '---'}</Text>
      </View>
    </View>
  );
}

function SettingItem({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={COLORS.navy} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.navy,
    padding: 4,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.navy,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    fontFamily: FONTS.serifBold,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 1.5,
    marginTop: 4,
    marginBottom: SPACING.xl,
    opacity: 0.8,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    paddingVertical: SPACING.md,
    marginRight: SPACING.xxl,
    position: 'relative',
  },
  tabText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.navy,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.navy,
    borderRadius: 3,
  },
  tabContent: {
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    marginBottom: SPACING.lg,
  },
  infoItem: {
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 6,
  },
  infoValueContainer: {
    backgroundColor: COLORS.bgPrimary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockedValueContainer: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e0e0e0',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  editProfileButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  editProfileButtonText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
    gap: 8,
  },
  logoutText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '700',
  },
  devSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
});