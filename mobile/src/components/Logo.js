import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polygon, Polyline, Circle } from 'react-native-svg';
import { colors, font } from '../theme/theme';

// The "Arise" mark rendered as crisp SVG — matches the app icon.
// Hexagon gate + upward level-up chevrons + monarch spark.
export function Logo({ size = 96, glow = true }) {
  const hex = '50,17 78.6,33.5 78.6,66.5 50,83 21.4,66.5 21.4,33.5';
  const chevron1 = '35.4,56.8 50,40.7 64.6,56.8';
  const chevron2 = '35.4,68 50,52 64.6,68';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="ariseGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.purple} />
          <Stop offset="1" stopColor={colors.blue} />
        </LinearGradient>
      </Defs>

      {/* soft glow layer (approximation) */}
      {glow && (
        <>
          <Polyline points={chevron1} fill="none" stroke="url(#ariseGrad)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} />
          <Polyline points={chevron2} fill="none" stroke="url(#ariseGrad)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.1} />
          <Polygon points={hex} fill="none" stroke="url(#ariseGrad)" strokeWidth={3} opacity={0.12} />
        </>
      )}

      {/* hexagon gate */}
      <Polygon points={hex} fill="none" stroke="url(#ariseGrad)" strokeWidth={1} opacity={0.55} strokeLinejoin="round" />

      {/* chevrons */}
      <Polyline points={chevron2} fill="none" stroke="url(#ariseGrad)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Polyline points={chevron1} fill="none" stroke="url(#ariseGrad)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

      {/* monarch spark */}
      <Circle cx={50} cy={35.4} r={2.4} fill={colors.purpleLight} />
      {glow && <Circle cx={50} cy={35.4} r={5} fill={colors.purpleLight} opacity={0.25} />}
    </Svg>
  );
}

// Logo + "ARISE" wordmark, vertical.
export function BrandMark({ size = 96, tagline }) {
  return (
    <View style={styles.wrap}>
      <Logo size={size} />
      <Text style={styles.word}>ARISE</Text>
      {tagline ? <Text style={styles.tag}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  word: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: 8, marginTop: 10, marginLeft: 8 },
  tag: { color: colors.textDim, fontSize: font.small, letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },
});

export default Logo;
