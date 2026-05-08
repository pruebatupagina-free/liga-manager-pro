import { Redirect } from 'expo-router'
import { useAuth } from '../src/hooks/useAuth'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '../src/theme'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return <Redirect href={user ? '/(tabs)' : '/login'} />
}
