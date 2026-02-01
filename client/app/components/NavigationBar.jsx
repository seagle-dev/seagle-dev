import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookListing from './BookListing';

const { width } = Dimensions.get('window');

const NavigationBar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const tabs = [
    { id: 0, name: 'Home', icon: 'home' },
    { id: 1, name: 'Library', icon: 'book' },
    { id: 2, name: 'Classroom', icon: 'school' },
    { id: 3, name: 'Quizzes', icon: 'bulb' },
    { id: 4, name: 'Slides', icon: 'easel' },
  ];

  const itemWidth = width / tabs.length;

  const handleTabPress = (index) => {
    // Animate indicator
    Animated.spring(indicatorPosition, {
      toValue: index * itemWidth,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Animate icon scale
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(index);
  };

  return (
    <View style={styles.container}>
      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 0 ? (
          <BookListing />
        ) : (
          <>
            <Text style={styles.contentTitle}>{tabs[activeTab].name}</Text>
            <Text style={styles.contentDescription}>
              {getContentDescription(activeTab)}
            </Text>
          </>
        )}
      </View>

      {/* Navigation Bar */}
      <View style={styles.navigationBar}>
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: itemWidth,
              transform: [{ translateX: indicatorPosition }],
            },
          ]}
        />

        {/* Nav Items */}
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnims[index] }],
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={26}
                color={activeTab === index ? '#FFFFFF' : '#8B93C7'}
              />
            </Animated.View>
            <Text
              style={[
                styles.navLabel,
                activeTab === index && styles.navLabelActive,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getContentDescription = (index) => {
  const descriptions = [
    'Welcome to your dashboard! This is your central hub for all activities.',
    'Browse through your collection of resources and saved materials.',
    'Connect with your learning community and access your courses.',
    'Test your knowledge with interactive quizzes and track your progress.',
    'Create and present stunning slide decks for your presentations.',
  ];
  return descriptions[index];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  contentArea: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1F5C',
    marginBottom: 16,
    fontFamily: 'FunnelSans',
  },
  contentDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A5578',
    fontFamily: 'FunnelSans',
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1F5C',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  iconContainer: {
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B93C7',
    textAlign: 'center',
    fontFamily: 'FunnelSans',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default NavigationBar;