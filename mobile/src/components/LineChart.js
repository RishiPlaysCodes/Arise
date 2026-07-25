import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, font, spacing } from '../theme/theme';

// Lightweight line chart using react-native-svg. Offline, no deps.
// series: [{ points: [{x:number,y:number}], color }], plus raw x labels.
export default function LineChart({
  data = [],           // [{ label, value }]
  secondary = null,    // optional [{ label, value }] overlaid (e.g. EMA)
  height = 160,
  color = colors.purple,
  secondaryColor = colors.cyan,
  unit = '',
  title,
}) {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Not enough data yet — keep logging to see your trend.</Text>
      </View>
    );
  }

  const W = 300;
  const H = height;
  const padL = 34, padR = 10, padT = 12, padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = [...data.map((d) => d.value), ...(secondary ? secondary.map((d) => d.value) : [])];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const pad = range * 0.1;
  const yMin = min - pad;
  const yMax = max + pad;

  const xFor = (i, len) => padL + (len === 1 ? plotW / 2 : (i / (len - 1)) * plotW);
  const yFor = (v) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const pathFor = (arr) => arr.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i, arr.length).toFixed(1)} ${yFor(d.value).toFixed(1)}`).join(' ');

  const gridLines = 3;
  const gridVals = Array.from({ length: gridLines + 1 }, (_, i) => yMin + (i / gridLines) * (yMax - yMin));

  return (
    <View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {gridVals.map((gv, i) => {
          const y = yFor(gv);
          return (
            <React.Fragment key={i}>
              <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke={colors.border} strokeWidth={0.5} />
              <SvgText x={4} y={y + 3} fill={colors.textMuted} fontSize={8}>{gv.toFixed(gv >= 100 ? 0 : 1)}</SvgText>
            </React.Fragment>
          );
        })}
        {secondary && <Path d={pathFor(secondary)} stroke={secondaryColor} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />}
        <Path d={pathFor(data)} stroke={color} strokeWidth={2} fill="none" />
        {data.map((d, i) => (
          <Circle key={i} cx={xFor(i, data.length)} cy={yFor(d.value)} r={2.2} fill={color} />
        ))}
        {/* first + last x labels */}
        <SvgText x={padL} y={H - 6} fill={colors.textMuted} fontSize={8}>{data[0].label}</SvgText>
        <SvgText x={W - padR} y={H - 6} fill={colors.textMuted} fontSize={8} textAnchor="end">{data[data.length - 1].label}</SvgText>
      </Svg>
      {secondary && (
        <View style={styles.legend}>
          <Legend color={color} label={`Actual${unit ? ` (${unit})` : ''}`} />
          <Legend color={secondaryColor} label="Trend (smoothed)" dashed />
        </View>
      )}
    </View>
  );
}

function Legend({ color, label, dashed }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDash, { backgroundColor: color, opacity: dashed ? 0.7 : 1 }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textDim, fontSize: font.small, fontWeight: '700', marginBottom: spacing.sm },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textMuted, fontSize: font.tiny, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDash: { width: 14, height: 3, borderRadius: 2 },
  legendText: { color: colors.textMuted, fontSize: font.tiny },
});
