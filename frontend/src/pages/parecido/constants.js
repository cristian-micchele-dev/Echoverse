import { characters } from '../../data/characters'

export const OPTION_LETTERS = ['A', 'B', 'C', 'D']

export const DIM_CONFIG = [
  { key: 'moral',   label: 'Moralidad', lo: 'Héroe puro',   hi: 'Oscuro / Villano' },
  { key: 'metodo',  label: 'Método',    lo: 'Cerebral',     hi: 'Caos / Fuerza' },
  { key: 'social',  label: 'Social',    lo: 'Solitario',    hi: 'Líder / Poder' },
  { key: 'emocion', label: 'Emoción',   lo: 'Frío',         hi: 'Impulsivo' },
  { key: 'mundo',   label: 'Mundo',     lo: 'Fantasía',     hi: 'Tecnología' },
]

// Duplicados para loop sin cortes en el fondo animado
export const BG_CHARS = [...characters, ...characters].filter(c => c.image)
