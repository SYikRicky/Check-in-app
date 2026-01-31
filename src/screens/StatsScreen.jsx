import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import axios from 'axios';
import { formatAt } from '../utils/time';

export default function StatsScreen({ apiBase, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyDelete, setBusyDelete] = useState(false);
  const [gate, setGate] = useState(true);
  const [busyGate, setBusyGate] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, status] = await Promise.all([
          axios.get(`${apiBase}/api/check-ins`),
          axios.get(`${apiBase}/api/check-ins/status`)
        ]);
        setData(list.data || []);
        setGate(status.data?.enabled !== false);
      } catch (e) {
        setError('無法載入統計，請稍後再試。');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase]);

  const total = data.length;
  const checked = data.filter((c) => c.checkInCount > 0).length;

  const recent = useMemo(
    () =>
      data
        .filter((c) => c.lastCheckIn)
        .sort((a, b) => new Date(b.lastCheckIn) - new Date(a.lastCheckIn))
        .slice(0, 10),
    [data]
  );

  const dateKey = (timeslot) => {
    if (!timeslot) return 'Unknown';
    const m = timeslot.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/);
    if (!m) return 'Unknown';
    const [, d, mo, y] = m;
    return `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${y}`;
  };

  const grouped = useMemo(() => {
    const groups = {};
    const cutoff = new Date(2026, 1, 15); // 15/02/2026
    data.forEach((c) => {
      const key = dateKey(c.timeslot);
      if (key === 'Unknown') return;
      const parts = key.split('/');
      if (parts.length === 3) {
        const d = new Date(parts[2], Number(parts[1]) - 1, parts[0]);
        if (d > cutoff) return;
      }
      if (!groups[key]) groups[key] = { total: 0, paper1: 0, paper2: 0 };
      groups[key].total += 1;
      (c.checkIns || []).forEach((ci) => {
        if (ci.paperId === 'paper1') groups[key].paper1 += 1;
        if (ci.paperId === 'paper2') groups[key].paper2 += 1;
      });
    });
    // Ensure stable order
    return Object.entries(groups).sort(
      ([a], [b]) =>
        (a === 'Unknown') - (b === 'Unknown') ||
        new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
    );
  }, [data]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return (
      data.find(
        (c) =>
          (c.phoneNumber && c.phoneNumber.toString().includes(q)) ||
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.barcode && c.barcode.toString().includes(q))
      ) || null
    );
  }, [data, search]);

  const handleDelete = async (barcode, paperId) => {
    if (busyDelete) return;
    setBusyDelete(true);
    try {
      await axios.delete(`${apiBase}/api/check-ins`, { data: { barcode, paperId } });
      // refresh data after delete
      const res = await axios.get(`${apiBase}/api/check-ins`);
      setData(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || '刪除失敗，請稍後再試。');
    } finally {
      setBusyDelete(false);
    }
  };

  const toggleGate = async () => {
    if (busyGate) return;
    setBusyGate(true);
    try {
      const next = !gate;
      const res = await axios.post(`${apiBase}/api/check-ins/status`, { enabled: next });
      setGate(res.data?.enabled);
    } catch (e) {
      setError('無法切換簽到狀態，請稍後再試。');
    } finally {
      setBusyGate(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>簽到統計</Text>
      {loading ? <Text style={styles.meta}>載入中…</Text> : null}
      {error ? <Text style={[styles.meta, styles.error]}>{error}</Text> : null}
      {!loading && !error ? (
        <>
          <Text style={styles.meta}>總考生：{total}</Text>
          <Text style={styles.meta}>已簽到：{checked}</Text>
          <View style={{ marginVertical: 8 }}>
            <Text style={styles.meta}>簽到入口：{gate ? '開啟' : '已關閉'}</Text>
            <Text style={[styles.meta, styles.link]} onPress={toggleGate}>
              {busyGate ? '處理中…' : gate ? '關閉入口' : '開啟入口'}
            </Text>
          </View>
          <Text style={[styles.meta, styles.section]}>依日期與卷別</Text>
          {grouped.map(([date, vals]) => (
            <View key={date} style={styles.row}>
              <View>
                <Text style={styles.name}>{date}</Text>
                <Text style={styles.sub}>總數 {vals.total}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.time}>卷一：{vals.paper1}</Text>
                <Text style={styles.time}>卷二：{vals.paper2}</Text>
              </View>
            </View>
          ))}
          <Text style={[styles.meta, styles.section]}>查詢考生</Text>
          <TextInput
            style={styles.search}
            placeholder="輸入電話或姓名"
            placeholderTextColor="#9aa3ab"
            value={search}
            onChangeText={setSearch}
          />
          {searched ? (
            <View style={styles.searchCard}>
              <Text style={styles.name}>{searched.name || '未命名'}</Text>
              <Text style={styles.sub}>{searched.phoneNumber || searched.barcode}</Text>
              <Text style={styles.sub}>簽到次數：{searched.checkInCount || 0}</Text>
              {(searched.checkIns || []).map((ci) => (
                <View key={ci.paperId} style={styles.row}>
                  <Text style={styles.sub}>{ci.paperId}</Text>
                  <Text style={styles.time}>{formatAt(ci.at)}</Text>
                  <Text
                    style={[styles.meta, styles.link]}
                    onPress={() => handleDelete(searched.barcode || searched.phoneNumber, ci.paperId)}
                  >
                    刪除
                  </Text>
                </View>
              ))}
            </View>
          ) : search ? (
            <Text style={styles.sub}>未找到符合的考生</Text>
          ) : null}
          <Text style={[styles.meta, styles.section]}>最近簽到</Text>
          {recent.map((c) => (
            <View key={c._id} style={styles.row}>
              <View>
                <Text style={styles.name}>{c.name || '未命名'}</Text>
                <Text style={styles.sub}>{c.phoneNumber || c.barcode}</Text>
              </View>
              <Text style={styles.time}>{formatAt(c.lastCheckIn)}</Text>
            </View>
          ))}
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={[styles.meta, styles.link]} onPress={onBack}>
              返回登入
            </Text>
          </View>
        </>
      ) : null}
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d2f39',
    marginBottom: 8
  },
  meta: {
    color: '#5f6d76',
    marginBottom: 6
  },
  error: {
    color: '#c44545'
  },
  section: {
    marginTop: 8,
    fontWeight: '700',
    color: '#1d2f39'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)'
  },
  name: {
    color: '#1f4c72',
    fontWeight: '700'
  },
  sub: {
    color: '#6a707a'
  },
  time: {
    color: '#3b7a57',
    fontWeight: '600'
  },
  link: {
    color: '#1f4c72',
    fontWeight: '700'
  },
  search: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c5d3cf',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#1d2f39',
    marginBottom: 8
  },
  searchCard: {
    backgroundColor: '#eef3f2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  }
});
