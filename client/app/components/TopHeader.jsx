import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { PLACEHOLDER_AVATAR } from '../../constants/placeholders';

const TopHeader = ({
  showBackButton = false,
  onBackPress,
  title = '',
  rightIcon = null,
  onRightIconPress,
  backgroundColor = COLORS.navyDark,
  textColor = COLORS.white,
  showProfile = true,
  showNotifications = true,
  showCart = false,
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const insets = useSafeAreaInsets();

  const cartCount = 2;
  const notificationCount = 3;
  const hasTitle = Boolean(title);
  const showHeaderCart = false; // Disabled per request
  const showHeaderNotifications = showNotifications && !showBackButton;
  const showHeaderProfile = showProfile && !showBackButton;

  const handleBackPress = useCallback(() => {
    if (onBackPress) return onBackPress();
    router.back();
  }, [onBackPress, router]);

  const handleCartPress = useCallback(() => router.push('/tabs/cart'), [router]);
  const handleNotificationPress = useCallback(() => router.push('/tabs/notifications'), [router]);

  const handleProfileNavigation = useCallback(() => {
    setShowProfileMenu(false);
    router.push('/tabs/profile');
  }, [router]);

  const handleLogout = useCallback(async () => {
    setShowProfileMenu(false);
    await signOut();
    router.replace('/auth/Auth');
  }, [signOut, router]);

  return (
    <View style={[styles.wrapper, { backgroundColor, paddingTop: insets.top }]}>
      <View style={[styles.container, hasTitle && styles.titledContainer]}>
        <View style={[styles.leftSection, hasTitle && styles.sideSection]}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={textColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/logo/Seagle_Logomark V1_03.svg')} style={styles.logo} resizeMode="contain" />
            </View>
          )}
        </View>

        {hasTitle ? (
          <View style={styles.centerSection}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : null}

        <View style={[styles.rightSection, hasTitle && styles.sideSection, hasTitle && styles.rightSideSection]}>
          {rightIcon && onRightIconPress ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={24} color={textColor} />
            </TouchableOpacity>
          ) : (
            <>
              {showHeaderCart && (
                <TouchableOpacity style={styles.iconButton} onPress={handleCartPress} activeOpacity={0.7}>
                  <Ionicons name="cart-outline" size={24} color={textColor} />
                  {cartCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cartCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {showHeaderNotifications && (
                <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress} activeOpacity={0.7}>
                  <Ionicons name="notifications-outline" size={24} color={textColor} />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {showHeaderProfile && (
                <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.7}>
                  <Image source={{ uri: PLACEHOLDER_AVATAR }} style={styles.profileImage} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <Modal
        visible={showProfileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleProfileNavigation} activeOpacity={0.7}>
              <Ionicons name="person-outline" size={20} color="#1a2647" />
              <Text style={styles.dropdownText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
              <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingLeft: 0,
    paddingRight: SPACING.lg,
    paddingVertical: 6,
  },
  titledContainer: {
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
  },
  leftSection: { flexDirection: 'row', flex: 1 },
  sideSection: {
    flex: 0,
    width: 96,
    zIndex: 1,
  },
  centerSection: {
    position: 'absolute',
    left: 104,
    right: 104,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  rightSideSection: { justifyContent: 'flex-end' },
  backButton: { padding: 5 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -20 },
  logo: { width: 160, height: 56 },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.white, fontFamily: FONTS.serifBold },
  iconButton: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navyDark,
  },
  badgeText: { color: COLORS.navy, fontSize: 10, fontWeight: '800' },
  profileImage: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: COLORS.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: SPACING.lg,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    minWidth: 180,
    marginTop: 4,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  },
  dropdownText: { fontSize: 14, color: COLORS.navy, marginLeft: SPACING.md, fontWeight: '600' },
  logoutText: { color: COLORS.red },
  dropdownDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
});

export default TopHeader;
