import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatAt } from '../utils/time';

export default function SuccessScreen({ candidate, lastSuccess, onBack }) {
  return (
    <View style={styles.card}>
      <View style={styles.successIcon}>
        <Text style={styles.successCheck}>✓</Text>
      </View>
      <Text style={styles.sectionTitle}>簽到完成</Text>
      <Text style={styles.subtitle}>
        {candidate?.name ? `${candidate.name} · ` : ''}
        {lastSuccess?.paper?.title || '報到完成'} · {formatAt(lastSuccess?.at || Date.now())}
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onBack}>
        <Text style={styles.primaryButtonText}>返回列表</Text>
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
  successIcon: {
    width: 86,
    height: 86,
    borderRadius: 100,
    backgroundColor: '#1f4c72',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12
  },
  successCheck: {
    color: '#f7fbfa',
    fontSize: 36,
    fontWeight: '700'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d2f39',
    marginBottom: 6,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6d76',
    marginBottom: 12,
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#3b7a57',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#f7fbfa',
    fontWeight: '700',
    fontSize: 16
  }
});
