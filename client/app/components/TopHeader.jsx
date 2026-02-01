// TopHeader.jsx Enhancement Guide
// Update your existing TopHeader component to support the new screens

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TopHeader = ({ 
  showBackButton = false,
  onBackPress,
  title = '',
  rightIcon = null,
  onRightIconPress,
  backgroundColor = '#1a2647',
  textColor = '#fff',
  showProfile = true,
  showNotifications = true,
  showCart = true,
}) => {
  const navigation = useNavigation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Your existing state for cart count, notifications, etc.
  const cartCount = 2;
  const notificationCount = 3;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleCartPress = () => {
    // Navigate to cart screen
    navigation.navigate('Cart');
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen
    navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    setShowProfileMenu(true);
  };

  const handleProfileNavigation = () => {
    setShowProfileMenu(false);
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    // Implement your logout logic here
    // Then navigate to Auth screen
    navigation.navigate('Auth');
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Ionicons name="book" size={28} color={textColor} />
            <Text style={[styles.logo, { color: textColor }]}>Seagle</Text>
          </View>
        )}
      </View>

      {/* Center Title (shown when title prop is provided) */}
      {title ? (
        <View style={styles.centerSection}>
          <Text 
            style={[styles.title, { color: textColor }]} 
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      ) : null}

      <View style={styles.rightSection}>
        {/* Right Icon (custom) */}
        {rightIcon && onRightIconPress ? (
          <TouchableOpacity 
            onPress={onRightIconPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon} size={24} color={textColor} />
          </TouchableOpacity>
        ) : (
          <>
            {/* Cart Icon */}
            {showCart && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleCartPress}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={24} color={textColor} />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Notifications Icon */}
            {showNotifications && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={24} color={textColor} />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Profile Icon with Dropdown */}
            {showProfile && (
              <TouchableOpacity 
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: 'https://via.placeholder.com/40' }} 
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Profile Dropdown Menu */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={handleProfileNavigation}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={20} color="#1a2647" />
              <Text style={styles.dropdownText}>Profile</Text>
            </TouchableOpacity>
            
            <View style={styles.dropdownDivider} />
            
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 20,
  },
  backButton: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a2647',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF4444',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
});

export default TopHeader;

// ============================================
// USAGE EXAMPLES
// ============================================

/*
1. Default Header (Home Screen):
   <TopHeader />

2. Header with Back Button (BookDetails Screen):
   <TopHeader 
     showBackButton={true}
     onBackPress={() => navigation.goBack()}
   />

3. Header with Title (BookDetails Screen):
   <TopHeader 
     showBackButton={true}
     title="Anatomy 101"
   />

4. Header with Custom Right Icon (Reader Screen):
   <TopHeader 
     showBackButton={true}
     title={book.title}
     rightIcon="ellipsis-horizontal"
     onRightIconPress={handleMenuPress}
     backgroundColor="#fef9f3"
     textColor="#1a2647"
     showCart={false}
     showNotifications={false}
     showProfile={false}
   />

5. Minimal Header (Reader Screen - cleaner):
   <TopHeader 
     showBackButton={true}
     title={book.title}
     backgroundColor="#fef9f3"
     textColor="#1a2647"
     showCart={false}
     showNotifications={false}
     showProfile={false}
   />
*/