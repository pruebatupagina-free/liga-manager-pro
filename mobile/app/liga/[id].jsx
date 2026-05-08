import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import client from '../../src/api/client'
import { colors } from '../../src/theme'

function EquipoCard({ equipo }) {
  return (
    <View style={s.equipoCard}>
      <Text style={s.equipoNombre}>{equipo.nombre}</Text>
      <Text style={s.equipoMeta}>{equipo.jugadores?.length ?? 0} jugadores</Text>
    </View>
  )
}

export default function LigaDetail() {
  const { id, nombre } = useLocalSearchParams()

  const { data: equipos, isLoading: loadEq, refetch, isRefetching } = useQuery({
    queryKey: ['equipos', id],
    queryFn: () => client.get(`/equipos?liga_id=${id}`).then(r => r.data),
    enabled: !!id,
  })

  const { data: jornadas, isLoading: loadJorn } = useQuery({
    queryKey: ['jornadas', id],
    queryFn: () => client.get(`/jornadas?liga_id=${id}`).then(r => r.data),
    enabled: !!id,
  })

  const eqs = equipos?.equipos || equipos || []
  const jorns = jornadas?.jornadas || jornadas || []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={s.title}>{nombre || 'Liga'}</Text>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{eqs.length}</Text>
          <Text style={s.statLbl}>Equipos</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{jorns.length}</Text>
          <Text style={s.statLbl}>Jornadas</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{jorns.filter(j => j.estado === 'jugada').length}</Text>
          <Text style={s.statLbl}>Jugadas</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>EQUIPOS</Text>
      {loadEq
        ? <Text style={s.muted}>Cargando...</Text>
        : eqs.length === 0
          ? <Text style={s.muted}>Sin equipos</Text>
          : eqs.map(eq => <EquipoCard key={eq._id} equipo={eq} />)
      }

      <Text style={[s.sectionTitle, { marginTop: 24 }]}>JORNADAS</Text>
      {loadJorn
        ? <Text style={s.muted}>Cargando...</Text>
        : jorns.length === 0
          ? <Text style={s.muted}>Sin jornadas</Text>
          : jorns.map(j => {
            const isLive = j.estado === 'en_curso'
            return (
              <View key={j._id} style={s.jornadaRow}>
                <Text style={s.jornadaNombre}>{j.nombre || `Jornada ${j.numero}`}</Text>
                <View style={[s.badge, isLive ? s.badgeLive : j.estado === 'jugada' ? s.badgeDone : s.badgePend]}>
                  <Text style={[s.badgeText, isLive && { color: '#EF4444' }]}>
                    {isLive ? '● EN VIVO' : j.estado}
                  </Text>
                </View>
              </View>
            )
          })
      }
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 56 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statNum: { color: colors.accent, fontSize: 26, fontWeight: '800' },
  statLbl: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  equipoCard: {
    backgroundColor: colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  equipoNombre: { color: colors.text, fontWeight: '600', fontSize: 14 },
  equipoMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  jornadaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  jornadaNombre: { color: colors.text, fontSize: 14, fontWeight: '500' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeDone: { backgroundColor: '#14532d' },
  badgePend: { backgroundColor: '#1e293b' },
  badgeLive: { backgroundColor: '#3f1212' },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  muted: { color: colors.textMuted, marginTop: 8 },
})
