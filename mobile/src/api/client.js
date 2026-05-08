import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://liga-manager-pro-production.up.railway.app/api'

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
