export function usernameColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#7B9B4A','#4A9B7B','#9B4A7B','#4A7B9B','#9B7B4A','#C9954A','#6D4AFF','#4AFFB0']
  return colors[Math.abs(hash) % colors.length]
}

export const PRESET_EVENTS = [
  'Se apaga la luz de repente',
  'Un extraño entra sin avisar',
  'Suena una alarma estridente',
  'Empieza una tormenta feroz',
  'Alguien grita en la distancia',
  'Un objeto cae y se rompe',
]
