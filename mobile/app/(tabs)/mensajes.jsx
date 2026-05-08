import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import client from '../../src/api/client'
import { colors } from '../../src/theme'

export default function MensajesTab() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversaciones'],
    queryFn: () => client.get('/mensajes/conversaciones').then(r => r.data),
  })

  const convs = data?.conversaciones || data || []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <Text style={s.title}>MENSAJES</Text>

      {isLoading && <Text style={s.muted}>Cargando...</Text>}

      {convs.map(conv => (
        <TouchableOpacity
          key={conv._id}
          style={s.card}
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: conv._id } })}
        >
          <View style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {(conv.equipo_nombre || conv.vendedor_nombre || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.convName}>{conv.equipo_nombre || conv.vendedor_nombre || 'Conversación'}</Text>
              <Text style={s.convLast} numberOfLines={1}>
                {conv.ultimo_mensaje?.contenido || 'Sin mensajes aún'}
              </Text>
            </View>
            {conv.no_leidos > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{conv.no_leidos}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {!isLoading && convs.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyText}>Sin conversaciones aún</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 56 },
  title: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '700', fontSize: 18 },
  convName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  convLast: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  unreadBadge: {
    backgroundColor: colors.accent, borderRadius: 12,
    minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  muted: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
})
