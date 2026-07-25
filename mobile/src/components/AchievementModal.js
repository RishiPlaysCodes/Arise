import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, font, spacing, radius } from '../theme/theme';
import { GradientButton } from './ui';

// Shows one or more newly-unlocked achievements.
export default function AchievementModal({ achievements, onClose }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scale]);

  if (!achievements || achievements.length === 0) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
          <LinearGradient colors={[colors.gold, colors.orange]} style={styles.ring}>
            <MaterialCommunityIcons name="medal" size={44} color={colors.white} />
          </LinearGradient>
          <Text style={styles.title}>ACHIEVEMENT{achievements.length > 1 ? 'S' : ''} UNLOCKED</Text>
          {achievements.map((a) => (
            <View key={a.id} style={styles.item}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.desc}>{a.desc}</Text>
            </View>
          ))}
          <GradientButton title="Claim" colors={[colors.gold, colors.orange]} onPress={onClose} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  container: { backgroundColor: colors.panel, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.gold, padding: spacing.xl, alignItems: 'center', width: '100%' },
  ring: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { color: colors.gold, fontSize: font.h3, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  item: { alignItems: 'center', marginTop: spacing.md },
  name: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  desc: { color: colors.textDim, fontSize: font.small, marginTop: 2, textAlign: 'center' },
});
