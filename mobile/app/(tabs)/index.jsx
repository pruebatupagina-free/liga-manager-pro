import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import client from '../../src/api/client'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme'

function StatCard({ label, value }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function LigaRow({ liga }) {
  return (
    <TouchableOpacity
      style={s.ligaRow}
      onPress={() => router.push({ pathname: '/liga/[id]', params: { id: liga._id, nombre: liga.nombre } })}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.ligaNombre}>{liga.nombre}</Text>
        <Text style={s.ligaMeta}>{liga.temporada} · {liga.equipos?.length ?? 0} equipos</Text>
      </View>
      <View style={[s.badge, liga.estado === 'activa' ? s.badgeActive : s.badgeDone]}>
        <Text style={s.badgeText}>{liga.estado}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function DashboardTab() {
  const { user } = useAuth()
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ligas'],
    queryFn: () => client.get('/ligas').then(r => r.data),
  })

  const ligas = data?.ligas || data || []
  const activas = ligas.filter(l => l.estado === 'activa').length

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={s.greeting}>Bienvenido</Text>
      <Text style={s.username}>{user?.nombre || user?.email}</Text>

      <View style={s.statsRow}>
        <StatCard label="Ligas activas" value={activas} />
        <StatCard label="Total ligas" value={ligas.length} />
      </View>

      <Text style={s.sectionTitle}>MIS LIGAS</Text>

      {isLoading
        ? <Text style={s.muted}>Cargando...</Text>
        : ligas.length === 0
          ? <Text style={s.muted}>Sin ligas registradas</Text>
          : ligas.map(l => <LigaRow key={l._id} liga={l} />)
      }
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 56 },
  greeting: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  username: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  statValue: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  ligaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  ligaNombre: { color: colors.text, fontSize: 15, fontWeight: '600' },
  ligaMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#14532d' },
  badgeDone: { backgroundColor: '#1e293b' },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
})
