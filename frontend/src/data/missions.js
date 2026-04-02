// Cada misión es un arco narrativo: una secuencia ordenada de situaciones
// que juntas cuentan una historia con principio, desarrollo y final.
// Agregar misión nueva = agregar objeto aquí. Sin tocar lógica.

export const missions = [
  {
    id: 'operacion-rescate',
    title: 'Operación: Rescate',
    description: 'Un rehén. Una chance. Sin margen de error.',
    emoji: '🛡',
    intro: 'La llamada llegó a las 2 AM. Un rehén. Ubicación confirmada. Tenés una ventana antes de que lo muevan.',
    steps: ['parking-ambush', 'hostage-room', 'final-escape'],
    pool: ['parking-ambush', 'hostage-room', 'final-escape', 'bridge-standoff', 'security-checkpoint'],
    stepCount: 3,
    failThreshold: 2,
    endings: {
      win:  { title: '✓ Misión completada', narrative: 'El rehén está a salvo. Desaparecés antes de que llegue la prensa.' },
      fail: { title: '✕ Operación comprometida', narrative: 'No era la noche. Pero aprendiste algo sobre tus límites.' }
    }
  },
  {
    id: 'infiltracion-torre',
    title: 'Infiltración en la Torre',
    description: 'Entrar, extraer la información, salir. En ese orden.',
    emoji: '🕵',
    intro: 'Veinte pisos. Seguridad máxima. Adentro hay algo que no debería existir. Vos sos el único que puede sacarlo.',
    steps: ['security-checkpoint', 'office-confrontation', 'server-room', 'rooftop-escape'],
    pool: ['security-checkpoint', 'office-confrontation', 'server-room', 'rooftop-escape', 'bridge-standoff', 'final-escape'],
    stepCount: 4,
    failThreshold: 2,
    endings: {
      win:  { title: '✓ Exfiltración exitosa', narrative: 'Los datos están seguros. La torre, comprometida. Nadie sabe quién fuiste.' },
      fail: { title: '✕ Cobertura quemada', narrative: 'Demasiadas variables sin controlar. La próxima vez, menos improvisación.' }
    }
  },
  {
    id: 'la-caceria',
    title: 'La Cacería',
    description: 'Te siguen. O sos vos quien sigue. No podés saber cuál.',
    emoji: '🎯',
    intro: 'Alguien te puso en el radar. No sabés quién. No sabés cuándo van a actuar. Pero ya es demasiado tarde para ignorarlo.',
    steps: ['parking-ambush', 'train-pursuit', 'bridge-standoff', 'rooftop-escape'],
    pool: ['parking-ambush', 'train-pursuit', 'bridge-standoff', 'rooftop-escape', 'final-escape', 'office-confrontation'],
    stepCount: 4,
    failThreshold: 2,
    endings: {
      win:  { title: '✓ Objetivo neutralizado', narrative: 'La cacería terminó. El cazador siempre fuiste vos.' },
      fail: { title: '✕ La presa escapó', narrative: 'Se fue. Esta vez ganó él. Pero sabés dónde va a estar.' }
    }
  },
  {
    id: 'el-golpe',
    title: 'El Golpe',
    description: 'Una sola oportunidad de entrar, tomar lo que importa y desaparecer.',
    emoji: '💼',
    intro: 'Años de planeamiento. Un solo punto de falla: vos. La ventana de seguridad dura tres minutos. Entrás solo.',
    steps: ['security-checkpoint', 'server-room', 'office-confrontation', 'final-escape'],
    pool: ['security-checkpoint', 'server-room', 'office-confrontation', 'final-escape', 'rooftop-escape', 'parking-ambush'],
    stepCount: 4,
    failThreshold: 2,
    endings: {
      win:  { title: '✓ Golpe perfecto', narrative: 'Tenés lo que querías. Sin testigos, sin rastros.' },
      fail: { title: '✕ El golpe salió mal', narrative: 'Algo falló. No era el plan, pero algo siempre falla.' }
    }
  }
]

export function getMissionById(id) {
  return missions.find(m => m.id === id) || null
}
