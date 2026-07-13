import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type DimensionValue } from "react-native";
import { useTheme } from "../theme";

export function Skeleton({ width = "100%", height = 16 }: { width?: DimensionValue; height?: number }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width, height, backgroundColor: theme.muted, borderRadius: theme.radius * 0.5, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  base: {},
});
