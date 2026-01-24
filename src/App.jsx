import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import BarcodeScanner from './components/BarcodeScanner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const toneColors = {
  success: '#0db28b',
  warning: '#f9b234',
  danger: '#d43f3f',
  muted: '#5b6975'
};

const formatDate = (value) => {
  if (!value) return 'Not yet';
  const formatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return formatter.format(new Date(value));
};

function StatusBadge({ tone = 'muted', message }) {
  const color = toneColors[tone] || toneColors.muted;
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}1a`, borderColor: color }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{message}</Text>
    </View>
  );
}

function RecentCard({ item }) {
  return (
    <View style={styles.recentRow}>
      <View style={styles.recentMain}>
        <Text style={styles.recentBarcode}>{item.barcode}</Text>
        <Text style={styles.recentMeta}>{formatDate(item.lastCheckIn)}</Text>
      </View>
      <View style={styles.recentBadge}>
        <Text style={styles.recentCount}>×{item.checkInCount || 1}</Text>
        <Text style={styles.recentHint}>check-ins</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [status, setStatus] = useState({
    tone: 'muted',
    message: '請使用鏡頭或手動輸入條碼完成報到。'
  });
  const [recent, setRecent] = useState([]);
  const [lastHit, setLastHit] = useState({ code: '', at: 0 });
  const [loading, setLoading] = useState(false);

  const updateStatus = useCallback((tone, message) => setStatus({ tone, message }), []);

  const fetchRecent = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/check-ins`);
      setRecent(data);
    } catch (error) {
      updateStatus('warning', 'Unable to load recent check-ins from the server.');
    }
  }, [updateStatus]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleCheckIn = useCallback(
    async (code, meta = { source: 'manual' }) => {
      const normalized = code?.trim();
      if (!normalized) {
        updateStatus('warning', 'Barcode required to check in.');
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.post(`${API_BASE}/api/check-ins`, { barcode: normalized });
        const attendee = data.attendee || { barcode: normalized, lastCheckIn: new Date(), checkInCount: 1 };
        setRecent((prev) => {
          const filtered = prev.filter((item) => item._id !== attendee._id && item.barcode !== attendee.barcode);
          return [attendee, ...filtered].slice(0, 20);
        });
        setBarcodeInput('');
        updateStatus('success', `Checked in ${attendee.name || 'candidate'} (${normalized}) via ${meta.source}.`);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          'Could not check in right now. Confirm backend + MongoDB are running.';
        updateStatus('danger', message);
      } finally {
        setLoading(false);
      }
    },
    [updateStatus]
  );

  const handleDetected = useCallback(
    (code) => {
      const now = Date.now();
      if (!code) return;
      if (code === lastHit.code && now - lastHit.at < 3000) return;
      setLastHit({ code, at: now });
      handleCheckIn(code, { source: 'scanner' });
    },
    [handleCheckIn, lastHit]
  );

  const headline = useMemo(
    () => ({
      kicker: 'HKDES 報到易',
      title: '考生簽到',
      subtitle: '掃描或輸入條碼，立即完成簽到。'
    }),
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <View style={styles.navBar}>
          <Text style={styles.menuIcon}>≡</Text>
          <View style={styles.navCenter}>
            <Text style={styles.profileName}>li chi</Text>
            <Text style={styles.profileNo}>考生編號: {lastHit.code || '未掃描'}</Text>
          </View>
          <Text style={styles.avatar}>👤</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.kicker}>{headline.kicker}</Text>
          <Text style={styles.title}>{headline.title}</Text>
          <Text style={styles.subtitle}>{headline.subtitle}</Text>
        </View>

        {status.tone === 'success' && (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>簽到已完成</Text>
            <Text style={styles.successMeta}>自助簽到已完成</Text>
            <TouchableOpacity style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>返回主頁</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.tabLabel}>即將的考試</Text>
          <View style={styles.divider} />

          <View style={styles.sessionCard}>
            <View>
              <Text style={styles.sessionDate}>今日</Text>
              <Text style={styles.sessionTime}>立即報到</Text>
            </View>
            <Text style={styles.sessionTitle}>現場報到</Text>
          </View>

          <View style={styles.scannerBlock}>
            <BarcodeScanner onResult={handleDetected} />
          </View>

          <View style={styles.manualBlock}>
            <Text style={styles.fieldLabel}>或手動輸入條碼</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={barcodeInput}
                placeholder="輸入/貼上條碼"
                placeholderTextColor="#c7d4d9"
                onChangeText={setBarcodeInput}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryAction, (!barcodeInput || loading) && styles.buttonDisabled]}
              disabled={!barcodeInput || loading}
              onPress={() => handleCheckIn(barcodeInput, { source: 'manual' })}
            >
              <Text style={styles.primaryActionText}>{loading ? '處理中…' : '簽到'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.tabLabel}>最近的報到</Text>
          <View style={styles.divider} />
          <StatusBadge tone={status.tone} message={status.message} />
          <View style={styles.recentList}>
            {recent.length === 0 ? (
              <Text style={styles.emptyText}>尚未有報到紀錄，請先掃描條碼。</Text>
            ) : (
              recent.map((item) => <RecentCard key={item._id || item.barcode} item={item} />)
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#103b33'
  },
  shell: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center'
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 6
  },
  menuIcon: {
    fontSize: 22,
    color: '#f2f7f6'
  },
  navCenter: {
    alignItems: 'center'
  },
  avatar: {
    fontSize: 20,
    color: '#f2f7f6'
  },
  profileName: {
    color: '#f2f7f6',
    fontWeight: '700',
    fontSize: 16
  },
  profileNo: {
    color: '#d2e3df',
    fontSize: 12,
    marginTop: 2
  },
  header: {
    marginBottom: 12,
    alignItems: 'center'
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 1,
    color: '#c0ded2',
    fontWeight: '700',
    marginBottom: 4
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#d7e7df',
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    backgroundColor: 'rgba(244, 247, 245, 0.94)',
    padding: 18,
    borderRadius: 24,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 16
  },
  primaryCard: {
    flexBasis: 620,
    flexGrow: 2,
    minWidth: 360
  },
  sideCard: {
    flexBasis: 360,
    flexGrow: 1,
    minWidth: 320
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1f2a',
    marginBottom: 8
  },
  cardCopy: {
    fontSize: 14,
    color: '#5b6975',
    lineHeight: 20,
    marginBottom: 16
  },
  scannerBlock: {
    backgroundColor: '#0e2d28',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  manualBlock: {
    backgroundColor: 'rgba(16, 59, 51, 0.08)',
    borderRadius: 14,
    padding: 12
  },
  fieldLabel: {
    fontSize: 13,
    color: '#0e2d28',
    fontWeight: '600',
    marginBottom: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b6c9c3',
    backgroundColor: '#fdfdfd',
    color: '#0e2d28',
    fontSize: 15,
    marginRight: 10
  },
  button: {
    backgroundColor: '#0db28b',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.55
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  summaryTile: {
    backgroundColor: 'rgba(12, 141, 201, 0.08)',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginRight: 12
  },
  summaryLabel: {
    fontSize: 12,
    color: '#3b4b59',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  summaryValue: {
    fontSize: 18,
    color: '#0b1f2a',
    fontWeight: '700'
  },
  recentList: {},
  recentRow: {
    borderWidth: 1,
    borderColor: 'rgba(16,45,40,0.12)',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  recentMain: {
    flex: 1
  },
  recentBarcode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d3f'
  },
  recentMeta: {
    fontSize: 13,
    color: '#5b6975',
    marginTop: 4
  },
  recentBadge: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 70
  },
  recentCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0db28b'
  },
  recentHint: {
    fontSize: 12,
    color: '#5b6975'
  },
  emptyText: {
    color: '#5b6975',
    fontSize: 14,
    paddingVertical: 10
  },
  successCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24
  },
  successIcon: {
    width: 86,
    height: 86,
    borderRadius: 100,
    backgroundColor: '#0e2d28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  successCheck: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700'
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0e2d28'
  },
  successMeta: {
    fontSize: 14,
    color: '#4e5d58',
    marginTop: 4,
    marginBottom: 12
  },
  primaryAction: {
    backgroundColor: '#0e2d28',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  primaryActionText: {
    color: '#f4f7f5',
    fontWeight: '700',
    fontSize: 16
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(14,45,40,0.12)',
    marginVertical: 10
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e2d28'
  },
  sessionCard: {
    backgroundColor: '#eef3f2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(14,45,40,0.08)',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionDate: {
    color: '#0e2d28',
    fontWeight: '600'
  },
  sessionTime: {
    color: '#4e5d58',
    marginTop: 2
  },
  sessionTitle: {
    color: '#0e2d28',
    fontWeight: '700'
  }
});
