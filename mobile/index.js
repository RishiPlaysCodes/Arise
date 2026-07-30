import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { UIManager, Platform } from 'react-native';
import App from './App';

// PATCH: React Navigation v6 + RN 0.74 crash on `accessibilityState` prop.
// Monkey-patches UIManager.updateView to convert the legacy prop format to
// aria-* props that the new RN runtime expects, instead of crashing.
if (Platform.OS === 'android') {
  const orig = UIManager.updateView;
  if (orig) {
    UIManager.updateView = function (tag, className, props) {
      if (props && props.accessibilityState && typeof props.accessibilityState === 'object') {
        const state = props.accessibilityState;
        if (state.selected !== undefined) props['aria-selected'] = state.selected;
        if (state.disabled !== undefined) props['aria-disabled'] = state.disabled;
        if (state.busy !== undefined) props['aria-busy'] = state.busy;
        if (state.expanded !== undefined) props['aria-expanded'] = state.expanded;
        delete props.accessibilityState;
      }
      return orig.call(this, tag, className, props);
    };
  }
}

registerRootComponent(App);
