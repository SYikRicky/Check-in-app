import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatAt } from '../utils/time';

export default function ListScreen({ candidate, papers, checkedPapers, onStart, onBack }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {candidate?.name ? `${candidate.name}，選擇考卷簽到` : '選擇考卷簽到'}
      </Text>
      {candidate?.phoneNumber ? <Text style={styles.subtitle}>電話：{candidate.phoneNumber}</Text> : null}
      {candidate?.school ? <Text style={styles.subtitle}>學校：{candidate.school}</Text> : null}
      <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
        <Text style={styles.link} onPress={onBack}>
          返回登入
        </Text>
      </View>
      {papers.map((paper) => (
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
            style={[styles.secondaryButton, checkedPapers[paper.id] ? styles.buttonDisabled : null]}
            disabled={!!checkedPapers[paper.id]}
            onPress={() => onStart(paper)}
          >
            <Text style={styles.secondaryButtonText}>{checkedPapers[paper.id] ? 'Checked' : 'Check-in'}</Text>
          </TouchableOpacity>
        </View>
      ))}
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
    marginBottom: 8
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
  link: {
    color: '#1f4c72',
    fontWeight: '700'
  }
});
