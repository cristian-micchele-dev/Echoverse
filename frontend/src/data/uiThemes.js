// Sobreescribe las variables CSS de superficie/texto por personaje
// Solo los valores que difieren del default (dark base)

export const UI_THEMES = {
  default: {},

  // Darth Vader — vacío absoluto, negro puro
  void: {
    '--surface-base': '#000000',
    '--surface-1':    '#030303',
    '--surface-2':    '#070707',
    '--surface-3':    '#0c0c0c',
    '--surface-4':    '#121212',
    '--border-faint':   'rgba(255,255,255,0.04)',
    '--border-subtle':  'rgba(255,255,255,0.07)',
    '--border-default': 'rgba(255,255,255,0.11)',
    '--text-primary':   '#eedede',
    '--text-secondary': '#886666',
    '--text-muted':     '#442222',
    '--text-faint':     '#2a1010',
  },

  // Gollum — cueva oscura, verde enfermizo
  cave: {
    '--surface-base': '#010601',
    '--surface-1':    '#030a03',
    '--surface-2':    '#061006',
    '--surface-3':    '#0b180b',
    '--surface-4':    '#121f12',
    '--border-faint':   'rgba(60,140,60,0.07)',
    '--border-subtle':  'rgba(60,140,60,0.12)',
    '--border-default': 'rgba(60,140,60,0.18)',
    '--text-primary':   '#c8eac8',
    '--text-secondary': '#78a878',
    '--text-muted':     '#3d633d',
    '--text-faint':     '#22402a',
  },

  // John Wick — frío, azul noche, urbano
  cold: {
    '--surface-base': '#020208',
    '--surface-1':    '#04040e',
    '--surface-2':    '#080816',
    '--surface-3':    '#0d0d20',
    '--surface-4':    '#13132c',
    '--border-faint':   'rgba(90,100,180,0.07)',
    '--border-subtle':  'rgba(90,100,180,0.12)',
    '--border-default': 'rgba(90,100,180,0.18)',
    '--text-primary':   '#dde0f5',
    '--text-secondary': '#8088b0',
    '--text-muted':     '#404868',
    '--text-faint':     '#252d45',
  },

  // Walter White — clínico, verde laboratorio
  lab: {
    '--surface-base': '#020804',
    '--surface-1':    '#040f07',
    '--surface-2':    '#07180a',
    '--surface-3':    '#0c2210',
    '--surface-4':    '#122a16',
    '--border-faint':   'rgba(60,160,80,0.07)',
    '--border-subtle':  'rgba(60,160,80,0.11)',
    '--border-default': 'rgba(60,160,80,0.17)',
    '--text-primary':   '#e0f0e0',
    '--text-secondary': '#80aa80',
    '--text-muted':     '#3d6640',
    '--text-faint':     '#223828',
  },

  // Harry Potter — pergamino, cálido Hogwarts
  parchment: {
    '--surface-base': '#0d0600',
    '--surface-1':    '#170e00',
    '--surface-2':    '#221500',
    '--surface-3':    '#2e1c00',
    '--surface-4':    '#3c2400',
    '--border-faint':   'rgba(200,150,60,0.08)',
    '--border-subtle':  'rgba(200,150,60,0.14)',
    '--border-default': 'rgba(200,150,60,0.22)',
    '--text-primary':   '#f2e2b8',
    '--text-secondary': '#c09858',
    '--text-muted':     '#785e30',
    '--text-faint':     '#4a3a18',
  },

  // Gandalf — profundo, violeta antiguo, místico
  ancient: {
    '--surface-base': '#060408',
    '--surface-1':    '#0c0812',
    '--surface-2':    '#130f1e',
    '--surface-3':    '#1c1630',
    '--surface-4':    '#261e40',
    '--border-faint':   'rgba(140,100,220,0.07)',
    '--border-subtle':  'rgba(140,100,220,0.12)',
    '--border-default': 'rgba(140,100,220,0.19)',
    '--text-primary':   '#eae4f8',
    '--text-secondary': '#9880c8',
    '--text-muted':     '#504070',
    '--text-faint':     '#302448',
  },

  // Terminator — industrial, gris máquina
  machine: {
    '--surface-base': '#040404',
    '--surface-1':    '#090909',
    '--surface-2':    '#101010',
    '--surface-3':    '#181818',
    '--surface-4':    '#202020',
    '--border-faint':   'rgba(180,180,180,0.06)',
    '--border-subtle':  'rgba(180,180,180,0.10)',
    '--border-default': 'rgba(180,180,180,0.15)',
    '--text-primary':   '#cccccc',
    '--text-secondary': '#808080',
    '--text-muted':     '#444444',
    '--text-faint':     '#282828',
  },

  // Ragnar — acero nórdico, azul frío profundo
  norse: {
    '--surface-base': '#020408',
    '--surface-1':    '#040810',
    '--surface-2':    '#080e1c',
    '--surface-3':    '#0e1828',
    '--surface-4':    '#162134',
    '--border-faint':   'rgba(80,120,180,0.08)',
    '--border-subtle':  'rgba(80,120,180,0.13)',
    '--border-default': 'rgba(80,120,180,0.20)',
    '--text-primary':   '#d8e8f8',
    '--text-secondary': '#7898c0',
    '--text-muted':     '#405878',
    '--text-faint':     '#243448',
  },

  // Tony Stark — oscuro industrial con calidez naranja
  tech: {
    '--surface-base': '#0a0400',
    '--surface-1':    '#120800',
    '--surface-2':    '#1c0e00',
    '--surface-3':    '#281600',
    '--surface-4':    '#341e00',
    '--border-faint':   'rgba(200,100,20,0.07)',
    '--border-subtle':  'rgba(200,100,20,0.12)',
    '--border-default': 'rgba(200,100,20,0.18)',
    '--text-primary':   '#f5e0cc',
    '--text-secondary': '#c08060',
    '--text-muted':     '#784830',
    '--text-faint':     '#482a18',
  },
}
