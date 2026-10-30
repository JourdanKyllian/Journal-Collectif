import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerSkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function ShimmerSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 10,
  style,
}: ShimmerSkeletonProps) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      false,
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerProgress.value, [0, 1], [-150, 150]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.55)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: 'rgba(142, 134, 113, 0.16)',
    overflow: 'hidden',
    position: 'relative',
  },
});
