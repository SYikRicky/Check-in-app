import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import Badge from "../shared/Badge";
import logo from "../img/Logo.png";

export default function LoginScreen({
  phone,
  setPhone,
  loading,
  status,
  onLogin,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.logoBox}>
        <Image source={logo} style={styles.logoImg} resizeMode="contain" />
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
        onPress={onLogin}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "檢查中…" : "登入"}
        </Text>
      </TouchableOpacity>
      {status.message ? (
        <Badge tone={status.tone} message={status.message} />
      ) : null}
      <View style={styles.footerLinks}>
        <Text style={styles.linkText}>Need help?</Text>
        <Text style={styles.linkText}>Terms · Privacy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(245, 249, 248, 0.96)",
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "rgba(0,0,0,0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
  },
  logoBox: {
    backgroundColor: "#e7f0ed",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  logoImg: { width: 280, height: 80 },
  logoTitle: {
    color: "#2e414b",
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1d2f39",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#5f6d76",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#2e414b",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5d3cf",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#1d2f39",
  },
  primaryButton: {
    backgroundColor: "#3b7a57",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryButtonText: {
    color: "#f7fbfa",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerLinks: {
    marginTop: 10,
    gap: 4,
  },
  linkText: {
    color: "#4a5a64",
    fontSize: 13,
  },
});
