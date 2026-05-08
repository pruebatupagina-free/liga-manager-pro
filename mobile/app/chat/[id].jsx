import { useState, useRef, useEffect } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../src/api/client'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme'

export default function ChatScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const listRef = useRef(null)

  const { data } = useQuery({
    queryKey: ['mensajes', id],
    queryFn: () => client.get(`/mensajes/${id}`).then(r => r.data),
    refetchInterval: 5000,
  })

  const msgs = data?.mensajes || data || []

  useEffect(() => {
    if (msgs.length > 0) listRef.current?.scrollToEnd({ animated: false })
  }, [msgs.length])

  const send = useMutation({
    mutationFn: contenido => client.post(`/mensajes/${id}`, { contenido }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mensajes', id] })
      setText('')
    },
  })

  function handleSend() {
    const t = text.trim()
    if (!t) return
    send.mutate(t)
  }

  function renderMsg({ item }) {
    const mine = item.remitente_id === user?._id || item.remitente === user?._id
    return (
      <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
        <Text style={[s.bubbleText, mine ? s.textMine : s.textOther]}>
          {item.contenido}
        </Text>
        <Text style={s.bubbleTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mensajes</Text>
      </View>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={m => m._id}
        renderItem={renderMsg}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, !text.trim() && s.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || send.isPending}
        >
          <Text style={s.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: { color: colors.accent, fontSize: 24 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12, marginBottom: 6 },
  bubbleMine: { backgroundColor: colors.accent, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15 },
  textMine: { color: '#fff' },
  textOther: { color: colors.text },
  bubbleTime: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.bg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: colors.text,
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.accent, width: 42, height: 42,
    borderRadius: 21, justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: { backgroundColor: colors.border },
  sendIcon: { color: '#fff', fontSize: 16 },
})
