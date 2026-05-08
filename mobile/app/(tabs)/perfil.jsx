import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme'

function InfoRow({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || '—'}</Text>
    </View>
  )
}

export default function PerfilTab() {
  const { user, logout } = useAuth()

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <View style={s.container}>
      <View style={s.avatarWrap}>
        <Text style={s.avatarEmoji}>👤</Text>
      </View>
      <Text style={s.name}>{user?.nombre || user?.email}</Text>
      <Text style={s.role}>{user?.rol}</Text>

      <View style={s.card}>
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Rol" value={user?.rol} />
        <InfoRow label="ID" value={user?._id?.substring(0, 12) + '...'} />
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, paddingTop: 64 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 12, borderWidth: 2, borderColor: colors.accent,
  },
  avatarEmoji: { fontSize: 36 },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  role: { color: colors.accent, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 24, textTransform: 'capitalize' },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 24,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 14 },
  value: { color: colors.text, fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  logoutBtn: {
    backgroundColor: '#450a0a', borderWidth: 1, borderColor: colors.danger,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
})
