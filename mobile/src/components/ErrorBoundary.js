import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, font, spacing, radius } from '../theme/theme';

// Catches any JS render error so the app shows a readable message instead of
// crashing to a blank screen. (Native crashes can't be caught here.)
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>The app hit an error. Details below help fix it:</Text>
          <View style={styles.box}>
            <Text style={styles.err}>{String(this.state.error?.message || this.state.error)}</Text>
            {this.state.info?.componentStack ? (
              <Text style={styles.stack}>{this.state.info.componentStack.slice(0, 800)}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>If it keeps happening, screenshot this and send it.</Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { color: colors.red, fontSize: font.h2, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: font.small, textAlign: 'center', marginTop: spacing.sm },
  box: { backgroundColor: colors.panel, borderWidth: 1, borderColor: `${colors.red}44`, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  err: { color: colors.orange, fontSize: font.small, fontWeight: '700' },
  stack: { color: colors.textMuted, fontSize: font.tiny, marginTop: spacing.sm },
  btn: { backgroundColor: colors.purple, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  btnText: { color: colors.white, fontWeight: '700', fontSize: font.body },
  hint: { color: colors.textMuted, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.md },
});
