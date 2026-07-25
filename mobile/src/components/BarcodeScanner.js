import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, font, spacing, radius } from '../theme/theme';
import { GradientButton } from './ui';

// Barcode scanner using expo-camera. Resolves the barcode via the free
// Open Food Facts database WHEN ONLINE. Offline, it tells the user to log
// manually (barcode->nutrition lookup inherently needs a network DB).
export default function BarcodeScanner({ visible, onClose, onResolved }) {
  // Lazy-require so the app still builds/runs if expo-camera isn't linked yet.
  let CameraModule = null;
  try { CameraModule = require('expo-camera'); } catch { CameraModule = null; }

  const [permission, requestPermission] = CameraModule?.useCameraPermissions
    ? CameraModule.useCameraPermissions()
    : [null, () => {}];
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError('');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`, { signal: ctrl.signal });
      clearTimeout(t);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const n = json.product.nutriments || {};
        const food = {
          name: json.product.product_name || `Product ${data}`,
          unit: 'g',
          cal: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          p: Math.round((n.proteins_100g || 0) * 10) / 10,
          c: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
          f: Math.round((n.fat_100g || 0) * 10) / 10,
        };
        onResolved(food);
        onClose();
      } else {
        setError('Product not found in the database. Log it manually.');
        setTimeout(() => setScanned(false), 1500);
      }
    } catch {
      setError('Offline or lookup failed. Barcode lookup needs internet — log manually for now.');
      setTimeout(() => setScanned(false), 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!CameraModule?.CameraView) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.fallback}>
          <View style={styles.fallbackCard}>
            <MaterialCommunityIcons name="barcode-off" size={40} color={colors.textMuted} />
            <Text style={styles.fallbackText}>Camera module not available in this build. Install expo-camera and rebuild to enable barcode scanning.</Text>
            <GradientButton title="Close" onPress={onClose} style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
          </View>
        </View>
      </Modal>
    );
  }

  const { CameraView } = CameraModule;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="camera-outline" size={48} color={colors.purpleLight} />
            <Text style={styles.permText}>Camera permission is needed to scan barcodes.</Text>
            <GradientButton title="Grant Permission" onPress={requestPermission} style={{ marginTop: spacing.md }} />
            <TouchableOpacity onPress={onClose} style={{ marginTop: spacing.md }}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={scanned ? undefined : handleScan}
            />
            <View style={styles.overlay} pointerEvents="box-none">
              <View style={styles.frame} />
              <Text style={styles.hint}>Point at a product barcode</Text>
              {loading && <ActivityIndicator color={colors.white} style={{ marginTop: spacing.md }} />}
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={28} color={colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  permText: { color: colors.textDim, textAlign: 'center', marginTop: spacing.md, fontSize: font.body },
  cancel: { color: colors.textMuted, fontSize: font.small },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 260, height: 160, borderWidth: 2, borderColor: colors.purpleLight, borderRadius: radius.lg, backgroundColor: 'transparent' },
  hint: { color: colors.white, marginTop: spacing.lg, fontSize: font.body },
  error: { color: colors.orange, marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.xl },
  closeBtn: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  fallback: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.xl },
  fallbackCard: { backgroundColor: colors.panel, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  fallbackText: { color: colors.textDim, textAlign: 'center', marginTop: spacing.md, fontSize: font.small },
});
