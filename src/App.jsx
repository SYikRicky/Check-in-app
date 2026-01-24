import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import BarcodeScanner from './components/BarcodeScanner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PAPERS = [
  { id: 'paper1', title: 'Chemistry Paper 1', time: '03-Apr-2025 · 08:30 AM' },
  { id: 'paper2', title: 'Chemistry Paper 2', time: '03-Apr-2025 · 11:00 AM' }
];

const formatAt = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const tones = {
  success: '#3b7a57',
  warning: '#d0a03f',
  danger: '#c44545',
  muted: '#6a707a'
};

const Badge = ({ tone = 'muted', message }) => {
  const color = tones[tone] || tones.muted;
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}14` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{message}</Text>
    </View>
  );
};

export default function App() {
  const [screen, setScreen] = useState('login'); // login | list | scan | success
  const [phone, setPhone] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentPaper, setCurrentPaper] = useState(null);
  const [status, setStatus] = useState({ tone: 'muted', message: '' });
  const [loading, setLoading] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [checkedPapers, setCheckedPapers] = useState({});
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    if (screen === 'scan') return;
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach((video) => {
      const stream = video.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    });
  }, [screen]);

  const resetStatus = useCallback(() => setStatus({ tone: 'muted', message: '' }), []);
  const setTone = useCallback((tone, message) => setStatus({ tone, message }), []);

  const attemptLogin = useCallback(async () => {
    const trimmed = phone.trim();
    if (!/^[0-9]{6,}$/.test(trimmed)) {
      setTone('warning', '請輸入有效的電話號碼。');
      return;
    }
    setLoading(true);
    try {
      // Lightweight existence check by pulling recent attendees and matching barcode = phone.
      const { data } = await axios.get(`${API_BASE}/api/check-ins`);
      const match = Array.isArray(data) ? data.find((item) => item.barcode === trimmed) : null;
      if (!match) {
        setTone('warning', '未找到此電話的考生，請確認號碼或稍後再試。');
        setLoading(false);
        return;
      }
      resetStatus();
      setCandidate({
        name: match.name || '考生',
        phoneNumber: match.phoneNumber || trimmed,
        timeslot: match.timeslot || ''
      });
      setCheckedPapers(match.checkedPapers || {});
      setScreen('list');
    } catch (err) {
      setTone('danger', '無法連線伺服器，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, [phone, resetStatus, setTone]);

  const startPaper = useCallback(
    (paper) => {
      setCurrentPaper(paper);
      setBarcodeInput('');
      resetStatus();
      setScreen('scan');
      setScannerActive(true);
    },
    [resetStatus]
  );

  const completeCheckIn = useCallback(
    async (code, meta = { source: 'manual' }) => {
      const trimmed = code?.trim();
      if (!trimmed) return setTone('warning', '請輸入或掃描條碼。');
      if (trimmed !== phone.trim()) {
        setTone('danger', '條碼與電話號碼不符，請重新掃描。');
        return;
      }

      setLoading(true);
      try {
        const payload = {
          barcode: trimmed,
          notes: currentPaper?.title || '',
          paperId: currentPaper?.id,
          paperTitle: currentPaper?.title
        };
        const { data } = await axios.post(`${API_BASE}/api/check-ins`, payload);
        setLastSuccess({
          paper: currentPaper,
          at: data.attendee?.lastCheckIn || new Date().toISOString()
        });
        const at = data.attendee?.checkIns?.find((e) => e.paperId === currentPaper?.id)?.at;
        setCheckedPapers((prev) => ({ ...prev, [currentPaper?.id]: at || new Date().toISOString() }));
        setScreen('success');
        setTone('success', '簽到完成！');
      } catch (err) {
        const msg =
          err?.response?.data?.message || '伺服器或資料庫無法回應，請稍後再試。';
        setTone('danger', msg);
      } finally {
        setLoading(false);
      }
    },
    [currentPaper, phone, setTone]
  );

  const handleDetected = useCallback(
    (value) => {
      if (!value) return;
      setScannerActive(false);
      completeCheckIn(value, { source: 'scanner' });
    },
    [completeCheckIn]
  );

  const hero = useMemo(
    () => ({
      title: 'HKDSE Chemistry Mock',
      subtitle: '溫和柔和的配色，為考生帶來平靜的簽到體驗。',
      logoText: 'Mock Exam Portal'
    }),
    []
  );

  const renderLogin = () => (
    <View style={styles.card}>
      <View style={styles.logoBox}>
        <Text style={styles.logoMark}>✸</Text>
        <Text style={styles.logoTitle}>{hero.logoText}</Text>
      </View>
      <Text style={styles.title}>歡迎登入</Text>
      <Text style={styles.subtitle}>輸入註冊電話號碼進行身份確認。</Text>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>電話號碼</Text>
        <TextInput
          style={styles.input}
          placeholder="例如：91234567"
          placeholderTextColor="#9aa3ab"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        disabled={loading}
        onPress={attemptLogin}
      >
        <Text style={styles.primaryButtonText}>{loading ? '檢查中…' : '登入'}</Text>
      </TouchableOpacity>
      {status.message ? <Badge tone={status.tone} message={status.message} /> : null}
      <View style={styles.footerLinks}>
        <Text style={styles.linkText}>Need help?</Text>
        <Text style={styles.linkText}>Terms · Privacy</Text>
      </View>
    </View>
  );

  const renderList = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {candidate?.name ? `${candidate.name}，選擇考卷簽到` : '選擇考卷簽到'}
      </Text>
      {candidate?.phoneNumber ? (
        <Text style={styles.subtitle}>電話：{candidate.phoneNumber}</Text>
      ) : null}
      {PAPERS.map((paper) => (
        <View key={paper.id} style={styles.paperRow}>
          <View>
            <Text style={styles.paperTitle}>{paper.title}</Text>
            <Text style={styles.paperTime}>{paper.time}</Text>
            {checkedPapers[paper.id] ? (
              <Text style={styles.paperChecked}>已簽到 · {formatAt(checkedPapers[paper.id])}</Text>
            ) : (
              <Text style={styles.paperStatus}>尚未簽到</Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              checkedPapers[paper.id] ? styles.buttonDisabled : null
            ]}
            disabled={!!checkedPapers[paper.id]}
            onPress={() => startPaper(paper)}
          >
            <Text style={styles.secondaryButtonText}>
              {checkedPapers[paper.id] ? 'Checked' : 'Check-in'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderScan = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>掃描條碼</Text>
      <Text style={styles.subtitle}>
        請使用鏡頭掃描條碼（應等於電話號碼 {phone}），或手動輸入。
      </Text>
      <View style={styles.scannerBox}>
        <BarcodeScanner onResult={handleDetected} active={screen === 'scan' && scannerActive} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>手動輸入條碼</Text>
        <TextInput
          style={styles.input}
          placeholder="輸入/貼上條碼"
          placeholderTextColor="#9aa3ab"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
        />
      </View>
      <TouchableOpacity
        style={[styles.primaryButton, (!barcodeInput || loading) && styles.buttonDisabled]}
        disabled={!barcodeInput || loading}
        onPress={() => completeCheckIn(barcodeInput, { source: 'manual' })}
      >
        <Text style={styles.primaryButtonText}>{loading ? '送出中…' : '確認簽到'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => setScannerActive(true)}>
        <Text style={styles.linkButtonText}>重新啟動掃描</Text>
      </TouchableOpacity>
      {status.message ? <Badge tone={status.tone} message={status.message} /> : null}
      <TouchableOpacity style={styles.linkButton} onPress={() => setScreen('list')}>
        <Text style={styles.linkButtonText}>返回考卷列表</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.card}>
      <View style={styles.successIcon}>
        <Text style={styles.successCheck}>✓</Text>
      </View>
      <Text style={styles.sectionTitle}>簽到完成</Text>
      <Text style={styles.subtitle}>
        {candidate?.name ? `${candidate.name} · ` : ''}
        {lastSuccess?.paper?.title || '報到完成'} ·{' '}
        {formatAt(lastSuccess?.at || Date.now())}
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('list')}>
        <Text style={styles.primaryButtonText}>返回列表</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBody = () => {
    if (screen === 'login') return renderLogin();
    if (screen === 'list') return renderList();
    if (screen === 'scan') return renderScan();
    if (screen === 'success') return renderSuccess();
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{hero.title}</Text>
          <Text style={styles.topSubtitle}>平靜 · 專注 · 安心</Text>
        </View>
        {renderBody()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#0b1e26'
  },
  shell: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 14
  },
  topBar: {
    alignItems: 'center',
    paddingVertical: 10
  },
  topTitle: {
    color: '#f2f6f5',
    fontSize: 18,
    fontWeight: '700'
  },
  topSubtitle: {
    color: '#c8d5d2',
    fontSize: 13
  },
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
  logoBox: {
    backgroundColor: '#e7f0ed',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10
  },
  logoMark: {
    fontSize: 32,
    color: '#37505c',
    marginBottom: 4
  },
  logoTitle: {
    color: '#2e414b',
    fontWeight: '700'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d2f39',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6d76',
    marginBottom: 12
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
    color: '#1d2f39'
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
  secondaryButton: {
    backgroundColor: '#e3ecf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  secondaryButtonText: {
    color: '#1f4c72',
    fontWeight: '700'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  footerLinks: {
    marginTop: 10,
    gap: 4
  },
  linkText: {
    color: '#4a5a64',
    fontSize: 13
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d2f39',
    marginBottom: 10
  },
  paperRow: {
    backgroundColor: '#f1f6f4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d7e2de',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paperTitle: {
    color: '#1f4c72',
    fontWeight: '700'
  },
  paperTime: {
    color: '#6a707a',
    marginTop: 2
  },
  paperStatus: {
    color: '#8a939b',
    marginTop: 4
  },
  paperChecked: {
    color: '#3b7a57',
    marginTop: 4,
    fontWeight: '600'
  },
  scannerBox: {
    backgroundColor: '#122a33',
    borderRadius: 18,
    padding: 10,
    marginBottom: 10
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 8
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 99
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600'
  },
  linkButton: {
    marginTop: 8,
    alignItems: 'center'
  },
  linkButtonText: {
    color: '#1f4c72',
    fontWeight: '700'
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
  }
});
