import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

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
  showCart = true,
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const insets = useSafeAreaInsets();

  const cartCount = 2;
  const notificationCount = 3;

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
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={textColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/logo-icon-top.png')} style={styles.logo} resizeMode="contain" />
            </View>
          )}
        </View>

        {title ? (
          <View style={styles.centerSection}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : null}

        <View style={styles.rightSection}>
          {rightIcon && onRightIconPress ? (
            <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name={rightIcon} size={24} color={textColor} />
            </TouchableOpacity>
          ) : (
            <>
              {showCart && (
                <TouchableOpacity style={styles.iconButton} onPress={handleCartPress} activeOpacity={0.7}>
                  <Ionicons name="cart-outline" size={24} color={textColor} />
                  {cartCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cartCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {showNotifications && (
                <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress} activeOpacity={0.7}>
                  <Ionicons name="notifications-outline" size={24} color={textColor} />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {showProfile && (
                <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.7}>
                  <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.profileImage} />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  leftSection: { flexDirection: 'row', flex: 1 },
  centerSection: { flex: 1, alignItems: 'center', marginHorizontal: SPACING.md },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  backButton: { padding: 5 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 100, height: 36 },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold' },
  iconButton: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.red,
    borderRadius: RADIUS.md,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: 'bold' },
  profileImage: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: SPACING.lg,
  },
  dropdownMenu: {
    backgroundColor: COLORS.bgWhite,
    borderRadius: SPACING.md,
    padding: SPACING.sm,
    minWidth: 160,
    ...SHADOWS.medium,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  dropdownText: { fontSize: FONT_SIZES.lg, color: COLORS.navyDark, marginLeft: SPACING.md, fontWeight: '500' },
  logoutText: { color: COLORS.red },
  dropdownDivider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: SPACING.xs },
});

export default TopHeader;
