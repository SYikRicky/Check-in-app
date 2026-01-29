import { View, Text, StyleSheet } from 'react-native';

const tones = {
  success: '#3b7a57',
  warning: '#d0a03f',
  danger: '#c44545',
  muted: '#6a707a'
};

export default function Badge({ tone = 'muted', message }) {
  const color = tones[tone] || tones.muted;
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}14` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  }
});
