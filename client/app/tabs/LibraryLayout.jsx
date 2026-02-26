import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextbooksTab from './TextbooksTab';
import ModelsTab from './ModelsTab';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All Categories', 'Anatomy', 'Physiology', 'Surgery', 'Medicine', 'Nursing'];

export default function LibraryLayout() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  const tabs = ['Books', '3D Models'];

  const handleTabPress = (index) => {
    setActiveTab(index);
    Animated.spring(indicatorPosition, {
      toValue: index * (width / 2),
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const searchPlaceholder = activeTab === 0
    ? 'Search in books library'
    : 'Search in 3D models library';

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Dropdown */}
        <TouchableOpacity
          style={styles.categoryDropdown}
          onPress={() => setShowCategoryDropdown(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryDropdownText}>
            {selectedCategory === 'All Categories' ? 'Category' : selectedCategory}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === index && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 0 ? (
          <TextbooksTab
            search={search}
            category={selectedCategory === 'All Categories' ? null : selectedCategory}
          />
        ) : (
          <ModelsTab
            search={search}
            category={selectedCategory === 'All Categories' ? null : selectedCategory}
          />
        )}
      </View>

      {/* Category Dropdown Modal */}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedCategory === item && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleCategorySelect(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === item && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedCategory === item && (
                    <Ionicons name="checkmark" size={20} color={COLORS.navy} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Search Section
  searchSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 46,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },

  // Category Dropdown
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 46,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    marginTop: SPACING.sm,
  },
  categoryDropdownText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontFamily: FONTS.regular,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    position: 'relative',
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: FONTS.regular,
  },
  tabTextActive: {
    color: COLORS.navy,
    fontFamily: FONTS.bold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: COLORS.navy,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  dropdownModal: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    width: '100%',
    maxHeight: 400,
  },
  dropdownTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: FONTS.serifBold,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 2,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.bgAccent,
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  dropdownItemTextActive: {
    color: COLORS.navy,
    fontWeight: '700',
  },
});