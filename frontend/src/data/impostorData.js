export const IMPOSTOR_TOPICS = [
  // Traición y lealtad
  { id: 'traicion-dinero', text: 'Alguien cercano te traiciona por dinero. ¿Cuál es tu primera reacción?' },
  { id: 'lealtad-limite', text: '¿Cuál es el límite de tu lealtad hacia alguien que te falló?' },
  { id: 'secreto', text: 'Descubrís un secreto oscuro de tu mejor aliado. ¿Qué hacés con esa información?' },

  // Poder y control
  { id: 'poder-absoluto', text: 'Te ofrecen poder absoluto por exactamente 24 horas. ¿Qué hacés primero?' },
  { id: 'precio-victoria', text: '¿Cuánto estás dispuesto a sacrificar para ganar?' },
  { id: 'control', text: 'El caos te rodea. ¿Cómo mantenés el control cuando todo se derrumba?' },

  // Moral y dilemas
  { id: 'mentira-noble', text: 'A veces mentir es necesario. ¿Cuándo se justifica?' },
  { id: 'fin-medios', text: '¿El fin justifica los medios? Respondé con un ejemplo concreto de tu vida.' },
  { id: 'rojo-negro', text: 'Si tuvieras que elegir entre salvar a un inocente o a tu aliado, ¿qué hacés?' },

  // Miedo y valentía
  { id: 'miedo', text: '¿A qué le temés realmente? No lo que contás, sino lo que te quita el sueño.' },
  { id: 'valentia', text: '¿Cuál es la cosa más valiente que hiciste y de qué te arrepentís hoy?' },
  { id: 'derrota', text: 'Perdiste. Completamente. ¿Qué pasa dentro tuyo en ese momento?' },

  // Identidad
  { id: 'mejor-yo', text: '¿Cuál es la versión de vos mismo que más te orgullece? ¿Y la que más te avergüenza?' },
  { id: 'linea-roja', text: '¿Tenés una línea que jamás cruzarías? ¿Cuál es y por qué?' },
  { id: 'legado', text: 'Si mañana desaparecieras, ¿qué querés que recuerden de vos?' },

  // Relaciones
  { id: 'confianza', text: '¿Cómo sabés cuándo confiar en alguien? ¿Qué señales buscás?' },
  { id: 'amor-debilidad', text: '¿El amor es una fortaleza o una vulnerabilidad? Justificá tu respuesta.' },
  { id: 'perdon', text: 'Alguien que te lastimó profundamente pide perdón. ¿Qué hacés?' },

  // Filosofía de vida
  { id: 'muerte', text: 'Si supieras que vas a morir mañana, ¿cómo pasarías este último día?' },
  { id: 'exito', text: '¿Qué significa para vos tener éxito? ¿Lo lograste o todavía lo buscás?' },
]

export const DIFFICULTY_CONFIG = {
  easy:   { label: 'Fácil',  desc: 'Errores obvios. Ideal para empezar.',         color: '#4CAF50', points: 60  },
  medium: { label: 'Medio',  desc: 'Errores sutiles. El juego real.',             color: '#FF9800', points: 100 },
  hard:   { label: 'Difícil', desc: 'Casi imposible de detectar. Solo expertos.', color: '#F44336', points: 150 },
}

export const SCORE_RANKS = [
  { min: 0.9,  label: 'Detector Élite',  desc: '¡Nadie puede engañarte.' },
  { min: 0.7,  label: 'Agente Especial', desc: 'Muy buen ojo. Casi perfecto.' },
  { min: 0.5,  label: 'Investigador',    desc: 'Bien, pero el impostor te ganó algunas.' },
  { min: 0.3,  label: 'Novato',          desc: 'El impostor te superó. Estudiá más a los personajes.' },
  { min: 0,    label: 'Víctima',         desc: 'El impostor te engañó en cada ronda. Sin piedad.' },
]
