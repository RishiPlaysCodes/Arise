import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, rankColors, font, spacing, radius } from '../theme/theme';
import { GradientButton } from './ui';

export default function LevelUpModal({ level, rank, onClose }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.container, { transform: [{ scale }], opacity }]}>
          <LinearGradient colors={[colors.purple, colors.blue]} style={styles.iconRing}>
            <MaterialCommunityIcons name="arrow-up-bold-hexagon-outline" size={48} color={colors.white} />
          </LinearGradient>
          <Text style={styles.title}>LEVEL UP</Text>
          <Text style={styles.level}>Level {level}</Text>
          <Text style={[styles.rank, { color: rankColors[rank] }]}>{rank}-Rank Hunter</Text>
          <Text style={styles.note}>+3 stat points awarded. Allocate them in your Profile.</Text>
          <GradientButton title="Continue" onPress={onClose} style={{ marginTop: spacing.lg, alignSelf: 'stretch' }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  container: { backgroundColor: colors.panel, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.purple, padding: spacing.xl, alignItems: 'center', width: '100%' },
  iconRing: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { color: colors.purpleLight, fontSize: font.h2, fontWeight: '900', letterSpacing: 3 },
  level: { color: colors.white, fontSize: 40, fontWeight: '900', marginTop: spacing.sm },
  rank: { fontSize: font.h3, fontWeight: '800', marginTop: 4 },
  note: { color: colors.textDim, fontSize: font.small, textAlign: 'center', marginTop: spacing.md },
});
