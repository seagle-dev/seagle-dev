import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../../constants/theme';

const BUTTON_SIZE = 56;
const MINI_BUTTON_SIZE = 48;
const EDGE_GUTTER = 16;
const INITIAL_BOTTOM = 100;
const TAP_DRAG_THRESHOLD = 5;

const TOOLS = [
  { key: 'pen', icon: 'pencil', label: 'Pen', type: 'ion' },
  { key: 'highlighter', icon: 'brush', label: 'Highlighter', type: 'ion' },
  { key: 'eraser', icon: 'eraser', label: 'Eraser', type: 'mci' },
  { key: 'text', icon: 'text', label: 'Text', type: 'ion' },
  { key: 'undo', icon: 'arrow-undo', label: 'Undo', type: 'ion', action: true },
  { key: 'cancel', icon: 'close-circle', label: 'Cancel', type: 'ion', action: true },
];

export default function FloatingAnnotationToolbar({
  activeTool,
  expanded,
  onToggleExpanded,
  onSelectTool,
  onUndo,
  onRedo,
  onClear,
  onCancel,
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const startOffset = useMemo(
    () => ({
      x: windowWidth - BUTTON_SIZE - EDGE_GUTTER,
      y: windowHeight - BUTTON_SIZE - INITIAL_BOTTOM,
    }),
    [windowWidth, windowHeight],
  );

  const pan = useRef(new Animated.ValueXY(startOffset)).current;
  const lastPosition = useRef(startOffset);
  const [side, setSide] = useState('right');
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [expanded]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > TAP_DRAG_THRESHOLD || Math.abs(gesture.dy) > TAP_DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        pan.setOffset(lastPosition.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        const isTap =
          Math.abs(gesture.dx) < TAP_DRAG_THRESHOLD && Math.abs(gesture.dy) < TAP_DRAG_THRESHOLD;

        pan.flattenOffset();

        if (isTap) {
          onToggleExpanded();
          return;
        }

        const nextX = lastPosition.current.x + gesture.dx;
        const nextY = lastPosition.current.y + gesture.dy;
        
        // Boundaries
        const maxX = windowWidth - BUTTON_SIZE - EDGE_GUTTER;
        const maxY = windowHeight - BUTTON_SIZE - (Platform.OS === 'ios' ? 100 : 80);
        const minY = Platform.OS === 'ios' ? 120 : 100;

        let clampedX = Math.max(EDGE_GUTTER, Math.min(nextX, maxX));
        const clampedY = Math.max(minY, Math.min(nextY, maxY));

        // Snap to sides
        const nextSide = clampedX + BUTTON_SIZE / 2 < windowWidth / 2 ? 'left' : 'right';
        clampedX = nextSide === 'left' ? EDGE_GUTTER : maxX;

        setSide(nextSide);
        lastPosition.current = { x: clampedX, y: clampedY };
        
        Animated.spring(pan, {
          toValue: lastPosition.current,
          useNativeDriver: false,
          friction: 7,
          tension: 80,
        }).start();
      },
    }),
  ).current;

  const renderIcon = (tool, isActive) => {
    const color = isActive ? COLORS.orange : COLORS.navy;
    const name = isActive ? tool.icon : (tool.inactiveIcon || `${tool.icon}-outline`);
    
    if (tool.type === 'mci') {
      return <MaterialCommunityIcons name={isActive ? tool.icon : (tool.inactiveIcon || tool.icon)} size={22} color={color} />;
    }
    return <Ionicons name={name} size={22} color={color} />;
  };

  const getToolStyle = (index) => {
    // Spread tools evenly across an arc, starting from vertical.
    const angleStep = 0.55; 
    const angle = side === 'right' 
      ? (Math.PI * 1.5) - (index * angleStep) 
      : (Math.PI * 1.5) + (index * angleStep); 
    
    const radius = 110;
    
    const translateX = expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.cos(angle) * radius],
    });
    
    const translateY = expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.sin(angle) * radius],
    });

    const opacity = expandAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    const scale = expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  };

  const renderMainIcon = () => {
    if (expanded) {
      return <Ionicons name="close" size={26} color={COLORS.white} />;
    }
    
    const active = TOOLS.find((t) => t.key === activeTool);
    const iconColor = activeTool ? COLORS.white : COLORS.navy;
    
    if (active) {
      if (active.type === 'mci') {
        return <MaterialCommunityIcons name={active.icon} size={24} color={iconColor} />;
      }
      return <Ionicons name={active.icon} size={24} color={iconColor} />;
    }
    
    return <Ionicons name="pencil" size={26} color={iconColor} />;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.wrapper,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Expanded Tools */}
        <View style={styles.toolCluster} pointerEvents="box-none">
          {TOOLS.map((tool, index) => (
            <Animated.View
              key={tool.key}
              style={[styles.miniButtonWrapper, getToolStyle(index)]}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={[
                  styles.miniButton,
                  activeTool === tool.key && styles.activeMiniButton,
                ]}
                onPress={() => {
                  if (tool.key === 'cancel') {
                    onCancel?.();
                    onToggleExpanded();
                    return;
                  }

                  if (tool.key === 'undo') onUndo?.();
                  else if (tool.key === 'redo') onRedo?.();
                  else if (tool.key === 'clear') onClear?.();
                  else onSelectTool(tool.key);
                  
                  if (tool.action) {
                    // Don't deselect current tool for actions like undo/redo/clear
                  } else {
                    onToggleExpanded();
                  }
                }}
                activeOpacity={0.8}
              >
                {renderIcon(tool, activeTool === tool.key)}
              </TouchableOpacity>
              <Animated.Text style={[styles.toolLabel, { opacity: expandAnim }]}>
                {tool.label}
              </Animated.Text>
            </Animated.View>
          ))}
        </View>

        {/* Main Floating Button */}
        <View {...panResponder.panHandlers} style={styles.mainButtonTouchTarget}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onToggleExpanded}
            style={[
              styles.mainButton, 
              (expanded || activeTool) && styles.mainButtonActive
            ]}
          >
            {renderMainIcon()}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  wrapper: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  mainButtonTouchTarget: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  mainButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E6DFF3',
    ...SHADOWS.medium,
  },
  mainButtonActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  toolCluster: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniButtonWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  miniButton: {
    width: MINI_BUTTON_SIZE,
    height: MINI_BUTTON_SIZE,
    borderRadius: MINI_BUTTON_SIZE / 2,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#EDE6F6',
    ...SHADOWS.small,
  },
  activeMiniButton: {
    borderColor: COLORS.orange,
    backgroundColor: '#FFF7F0',
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: RADIUS.medium, // Using RADIUS as a placeholder for font if FONTS is not available here, but actually FONTS should be used.
    color: COLORS.navy,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
