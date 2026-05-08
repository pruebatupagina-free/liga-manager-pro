import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import client from '../../src/api/client'
import { colors } from '../../src/theme'

export default function LigasTab() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ligas'],
    queryFn: () => client.get('/ligas').then(r => r.data),
  })

  const ligas = data?.ligas || data || []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={s.title}>LIGAS</Text>

      {isLoading && <Text style={s.muted}>Cargando...</Text>}

      {ligas.map(liga => (
        <TouchableOpacity
          key={liga._id}
          style={s.card}
          onPress={() => router.push({ pathname: '/liga/[id]', params: { id: liga._id, nombre: liga.nombre } })}
        >
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{liga.nombre}</Text>
            <View style={[s.badge, liga.estado === 'activa' ? s.badgeActive : s.badgeDone]}>
              <Text style={s.badgeText}>{liga.estado}</Text>
            </View>
          </View>
          <Text style={s.cardMeta}>Temporada: {liga.temporada}</Text>
          <Text style={s.cardMeta}>{liga.equipos?.length ?? 0} equipos registrados</Text>
          {liga.slug && <Text style={s.cardSlug}>/{liga.slug}</Text>}
        </TouchableOpacity>
      ))}

      {!isLoading && ligas.length === 0 && (
        <Text style={s.muted}>No hay ligas registradas</Text>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 56 },
  title: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cardSlug: { color: colors.border, fontSize: 11, marginTop: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeActive: { backgroundColor: '#14532d' },
  badgeDone: { backgroundColor: '#1e293b' },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
})
