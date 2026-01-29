import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BarcodeScanner from '../components/BarcodeScanner';
import Badge from '../shared/Badge';

export default function ScanScreen({
  phone,
  barcodeInput,
  setBarcodeInput,
  status,
  loading,
  scannerActive,
  onDetected,
  onSubmitManual,
  onRestartScanner,
  onBack
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>掃描條碼</Text>
      <Text style={styles.subtitle}>請使用鏡頭掃描條碼（應等於電話號碼 {phone}），或手動輸入。</Text>
      <View style={styles.scannerBox}>
        <BarcodeScanner onResult={onDetected} active={scannerActive} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>手動輸入條碼</Text>
        <TextInput
          style={styles.input}
          placeholder="輸入/貼上條碼"
          placeholderTextColor="#9aa3ab"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          keyboardType="number-pad"
          inputMode="numeric"
        />
      </View>
      <TouchableOpacity
        style={[styles.primaryButton, (!barcodeInput || loading) && styles.buttonDisabled]}
        disabled={!barcodeInput || loading}
        onPress={onSubmitManual}
      >
        <Text style={styles.primaryButtonText}>{loading ? '送出中…' : '確認簽到'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={onRestartScanner}>
        <Text style={styles.linkButtonText}>重新啟動掃描</Text>
      </TouchableOpacity>
      {status.message ? <Badge tone={status.tone} message={status.message} /> : null}
      <TouchableOpacity style={styles.linkButton} onPress={onBack}>
        <Text style={styles.linkButtonText}>返回考卷列表</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(245, 249, 248, 0.96)',
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d2f39',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6d76',
    marginBottom: 10
  },
  scannerBox: {
    backgroundColor: '#122a33',
    borderRadius: 18,
    padding: 10,
    marginBottom: 10
  },
  formGroup: {
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 13,
    color: '#2e414b',
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5d3cf',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#1d2f39',
    fontSize: 16 // avoid iOS zoom on focus
  },
  primaryButton: {
    backgroundColor: '#3b7a57',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8
  },
  primaryButtonText: {
    color: '#f7fbfa',
    fontWeight: '700',
    fontSize: 16
  },
  buttonDisabled: {
    opacity: 0.6
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center'
  },
  linkButtonText: {
    color: '#1f4c72',
    fontWeight: '700'
  }
});
