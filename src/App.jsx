import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';

import LoginScreen from './screens/LoginScreen';
import ListScreen from './screens/ListScreen';
import ScanScreen from './screens/ScanScreen';
import SuccessScreen from './screens/SuccessScreen';
import StatsScreen from './screens/StatsScreen';
import { DEFAULT_PAPERS, parseTimeslot } from './utils/time';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function App() {
  const [screen, setScreen] = useState('login'); // login | list | scan | success | stats
  const [phone, setPhone] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentPaper, setCurrentPaper] = useState(null);
  const [status, setStatus] = useState({ tone: 'muted', message: '' });
  const [loading, setLoading] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [checkedPapers, setCheckedPapers] = useState({});
  const [scannerActive, setScannerActive] = useState(false);
  const [papers, setPapers] = useState(DEFAULT_PAPERS);

  const hero = useMemo(
    () => ({ title: 'Marco Wong HKDSE Chemistry Mock Examination 2026', subtitle: '天道酬勤' }),
    []
  );

  // Stop any video tracks when not on scan screen
  useEffect(() => {
    if (screen === 'scan') return;
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach((video) => {
      const stream = video.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    });
    setScannerActive(false);
  }, [screen]);

  const resetStatus = useCallback(() => setStatus({ tone: 'muted', message: '' }), []);
  const setTone = useCallback((tone, message) => setStatus({ tone, message }), []);

  const attemptLogin = useCallback(async () => {
    const trimmed = phone.trim();
    if (!/^[0-9]{6,}$/.test(trimmed)) {
      setTone('warning', '請輸入有效的電話號碼。');
      return;
    }
    // Admin shortcut
    if (trimmed === '88888888') {
      setScreen('stats');
      resetStatus();
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/check-ins`);
      const match = Array.isArray(data) ? data.find((item) => item.barcode === trimmed) : null;
      if (!match) {
        setTone('warning', '未找到此電話的考生，請確認號碼或稍後再試。');
        return;
      }
      resetStatus();
      setCandidate({
        name: match.name || '考生',
        phoneNumber: match.phoneNumber || trimmed,
        timeslot: match.timeslot || '',
        school: match.school || ''
      });
      setPapers(parseTimeslot(match.timeslot));
      setCheckedPapers(match.checkedPapers || {});
      setScreen('list');
    } catch {
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
        const msg = err?.response?.data?.message || '伺服器或資料庫無法回應，請稍後再試。';
        setTone('danger', msg);
      } finally {
        setLoading(false);
      }
    },
    [currentPaper, phone, setTone]
  );

  const renderBody = () => {
    switch (screen) {
      case 'login':
        return (
          <LoginScreen
            phone={phone}
            setPhone={setPhone}
            loading={loading}
            status={status}
            onLogin={attemptLogin}
            onGoStats={() => setScreen('stats')}
          />
        );
      case 'list':
        return (
          <ListScreen
            candidate={candidate}
            papers={papers}
            checkedPapers={checkedPapers}
            onStart={startPaper}
            onBack={() => {
              setCandidate(null);
              setCheckedPapers({});
              setScreen('login');
            }}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            phone={phone}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            status={status}
            loading={loading}
            scannerActive={scannerActive}
            onDetected={(val) => {
              setScannerActive(false);
              completeCheckIn(val, { source: 'scanner' });
            }}
            onSubmitManual={() => completeCheckIn(barcodeInput, { source: 'manual' })}
            onRestartScanner={() => setScannerActive(true)}
            onBack={() => {
              setScannerActive(false);
              setScreen('list');
            }}
          />
        );
      case 'success':
        return <SuccessScreen candidate={candidate} lastSuccess={lastSuccess} onBack={() => setScreen('list')} />;
      case 'stats':
        return <StatsScreen apiBase={API_BASE} onBack={() => setScreen('login')} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{hero.title}</Text>
          <Text style={styles.topSubtitle}>{hero.subtitle}</Text>
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
  }
});
