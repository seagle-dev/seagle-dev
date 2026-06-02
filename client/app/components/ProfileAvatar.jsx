import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../constants/theme';

/**
 * ProfileAvatar component for the navigation header.
 * Displays user profile picture or initials fallback.
 * 
 * @param {Object} props
 * @param {Object} props.user - User object { firstName, lastName, profilePictureUrl }
 * @param {Function} props.onPress - Optional override for the tap handler
 * @param {number} props.size - Optional size for the avatar (default 42)
 * @param {boolean} props.disabled - If true, renders without TouchableOpacity
 */
const ProfileAvatar = ({ user, onPress, size = 42, disabled = false }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const { firstName = '', lastName = '', profilePictureUrl = null } = user || {};
  
  const getInitials = () => {
    const f = (firstName || '').trim().charAt(0).toUpperCase();
    const l = (lastName || '').trim().charAt(0).toUpperCase();
    const combined = `${f}${l}`;
    return combined || '?';
  };

  const initials = getInitials();
  const showImage = profilePictureUrl && profilePictureUrl.trim() !== '' && !imageError;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/tabs/profile');
    }
  };

  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 }
  ];

  const content = showImage ? (
    <Image 
      source={{ uri: profilePictureUrl }} 
      style={avatarStyle} 
      onError={() => setImageError(true)}
    />
  ) : (
    <View style={[avatarStyle, styles.initialsContainer]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );

  if (disabled) {
    return content;
  }

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.7}
      accessibilityLabel="View Profile"
      accessibilityRole="button"
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1.5,
    borderColor: COLORS.white,
    overflow: 'hidden',
  },
  initialsContainer: {
    backgroundColor: '#1B2A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.bold,
  },
});

export default ProfileAvatar;
