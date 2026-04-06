// Temas de mesa disponibles para la Última Cena.
// Cada tema define el contexto narrativo, el flujo de escena,
// las reglas de tono y un pool de eventos aleatorios.
export const MESA_TEMAS = [
  {
    id: 'libre',
    label: 'Sin tema',
    desc: 'Mesa abierta',
    prompt: '',
    sceneFlow: 'Libre — sin estructura fija. La conversación va donde va.',
    dialogueRules: '',
    eventos: [
      'Se rompe el silencio cuando alguien deja caer su copa. Todos se miran.',
      'Alguien mencionó sin querer algo que todos sabían pero nadie decía.',
      'La luz parpadea un momento. Cuando vuelve, el ambiente cambió.',
      'Un mensaje llega para alguien. No dicen qué dice, pero su expresión lo hace.',
      'Alguien ríe. Solo. Sin explicación. El resto no sabe si unirse o preguntar.',
      'Una pregunta se queda flotando en el aire sin que nadie se anime a responderla todavía.',
      'El silencio se hace tan incómodo que alguien tiene que romperlo.',
      'Alguien se levanta un momento. Cuando vuelve, algo cambió en cómo lo miran los demás.',
    ]
  },
  {
    id: 'ultima-noche',
    label: 'La última noche',
    desc: 'Antes de algo que lo cambia todo',
    prompt: 'Es la última noche antes de algo que cambiará todo. Cada uno lo sabe. Nadie lo dice abiertamente.',
    sceneFlow: '1. Cada personaje refleja algo que no dijo antes. 2. Alguien dice la verdad que todos evitaban. 3. Se toma una decisión que no tiene vuelta atrás. 4. Cierre: lo que queda entre ellos después de eso.',
    dialogueRules: 'Frases cortas. Referencias al pasado compartido o a lo que viene. Urgencia latente. Nada de resoluciones fáciles.',
    eventos: [
      'Alguien menciona el nombre de alguien que no está. El silencio que sigue dice todo.',
      'Queda poco tiempo. Todos lo saben. Nadie lo dice.',
      'Alguien mira su copa sin beberla. Algo lo tiene en otro lugar.',
      'Una pregunta se hace por primera vez después de mucho tiempo de no hacerse.',
      "Alguien dice: 'No íbamos a terminar así.' Nadie responde enseguida.",
      'El ambiente cambia cuando alguien dice algo que no debería haber dicho. Pero ya está.',
      'Alguien necesita decir algo. Todos lo ven. Nadie lo apura.',
      'La noche avanza. Hay algo que todavía no se dijo y el tiempo se acorta.',
    ]
  },
  {
    id: 'rivales',
    label: 'Reunión de rivales',
    desc: 'Enemigos en la misma mesa',
    prompt: 'Los presentes no siempre se han llevado bien. Algo esta noche los obligó a estar juntos. La tensión es palpable.',
    sceneFlow: '1. Tensión establecida desde el primer momento. 2. Alguien provoca directamente. 3. Confrontación abierta — desacuerdo sin filtros. 4. Tregua forzada o ruptura definitiva.',
    dialogueRules: "Más interrupciones directas: 'No.', 'Eso es mentira.', 'Callate.' Menos cortesía. Frases cortantes. El Opositor domina y fuerza reacciones. Nadie cede fácil.",
    eventos: [
      'Alguien pone algo sobre la mesa que no debería estar ahí. Una provocación directa.',
      'Una acusación sin pruebas. Nadie la refuta todavía.',
      'Alguien ríe de algo que los demás no encuentran gracioso.',
      'Dos de los presentes se miran fijo durante demasiado tiempo.',
      'Se menciona algo del pasado que todos querían enterrado.',
      'Alguien dice exactamente lo que piensa. Sin filtros. Sin disculpas.',
      'La mesa se queda en silencio. Pero es un silencio de antes de algo, no de después.',
      'Una pregunta directa que exige respuesta. Sin escapatoria posible.',
    ]
  },
  {
    id: 'confesiones',
    label: 'Noche de confesiones',
    desc: 'Lo que no se dice en voz alta',
    prompt: 'Esta noche es para decir lo que normalmente se calla. El ambiente lo permite. El silencio pesa más que de costumbre.',
    sceneFlow: '1. Silencio inicial — el peso del momento. 2. Alguien hace una revelación personal. 3. Los demás reaccionan — cada uno desde su verdad. 4. Reconocimiento: lo que cambia entre ellos después de esto.',
    dialogueRules: 'Revelaciones graduales — no todo de golpe. Reacciones genuinas, no comentarios. Pausas implícitas entre intervenciones. El Mediador conecta las verdades. Nada de respuestas rápidas o superficiales.',
    eventos: [
      'Alguien dice algo que nunca había dicho en voz alta. Ni siquiera para sí mismo.',
      'Una pregunta que nadie esperaba. Demasiado directa para ignorarla.',
      'Alguien confiesa algo menor. Pero todos entienden que es la versión corta de algo mayor.',
      'El silencio después de algo dicho dura más de lo que debería.',
      'Alguien escucha con una atención que no es normal. Algo en esa historia le pertenece.',
      'Una risa incómoda. No es de alegría — es de reconocimiento.',
      "Alguien dice: 'Nunca le conté esto a nadie.' Y lo dice en serio.",
      'La conversación cambia de tono. De lo superficial a algo que importa.',
    ]
  },
]
