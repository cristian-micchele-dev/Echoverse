/**
 * scenarioFamilies — familias de escenarios para el motor de preguntas.
 *
 * Tipos:
 *  - Pure scoring: el personaje con mayor score gana. Requiere desiredTraits[].
 *  - Override:     respuesta correcta fija (absurdo/humor). Usa correctOverride + optionPool.
 *
 * Cada familia tiene múltiples variants para mayor rejugabilidad.
 */
export const scenarioFamilies = [

  // ─── PURE SCORING ────────────────────────────────────────────────────────

  {
    id: 'crisis-nuclear',
    category: 'Estrategia',
    desiredTraits: ['planificacion', 'calma', 'inteligencia', 'estrategia'],
    variants: [
      'Solo tenés 12 horas para desactivar una bomba nuclear con pistas incompletas y sin apoyo externo. ¿Quién querés al lado?',
      'El código de lanzamiento de una ojiva fue robado. Hay tres sospechosos y el tiempo se acaba. ¿Quién lidera la investigación?',
      'Una central nuclear está a punto de colapsar. El equipo de ingeniería está muerto. ¿Quién improvisa la solución?',
    ],
  },

  {
    id: 'infiltracion-palacio',
    category: 'Sigilo',
    desiredTraits: ['sigilo', 'engano', 'adaptabilidad'],
    variants: [
      'Hay que infiltrarse en un palacio custodiado por 200 guardias sin disparar un solo tiro. ¿Quién va?',
      'Necesitás robar los planos del enemigo desde su cuartel general sin dejar rastro. ¿Quién entra primero?',
      'Una fiesta de gala con 50 agentes encubiertos. Tenés que pasar desapercibido toda la noche. ¿Quién lo logra?',
    ],
  },

  {
    id: 'negociacion-rehenes',
    category: 'Negociación',
    desiredTraits: ['negociacion', 'calma', 'carisma', 'inteligencia'],
    variants: [
      'Hay 30 rehenes. El negociador oficial falló. Tenés una sola llamada más. ¿Quién mandás entrar?',
      'Un secuestrador con una exigencia imposible. Sin armas, sin respaldo. Solo palabras. ¿Quién habla?',
      'El villano tiene el dedo en el botón. La única salida es convencerlo de que no lo apriete. ¿Quién negocia?',
    ],
  },

  {
    id: 'explorar-templo',
    category: 'Exploración',
    desiredTraits: ['supervivencia', 'adaptabilidad', 'precision'],
    variants: [
      'Un templo antiguo lleno de trampas sin mapa ni guía. ¿Quién abre la marcha?',
      'La expedición quedó varada en una selva sin GPS ni radio. ¿Quién lleva al grupo de vuelta?',
      'Cueva submarina, oxígeno para 40 minutos, dos salidas posibles — una real, una trampa. ¿Quién decide?',
    ],
  },

  {
    id: 'debate-publico',
    category: 'Persuasión',
    desiredTraits: ['oratoria', 'carisma', 'inteligencia'],
    variants: [
      'Tenés que convencer a una multitud hostil de cambiar de opinión en exactamente cinco minutos.',
      'Debate televisado ante millones de personas. El oponente tiene el doble de experiencia. ¿Quién es tu portavoz?',
      'Hay que justificar ante la ONU una decisión que el mundo entero rechaza. ¿Quién sube al podio?',
    ],
  },

  {
    id: 'mision-espionaje',
    category: 'Espionaje',
    desiredTraits: ['engano', 'sigilo', 'inteligencia', 'calma'],
    variants: [
      'Infiltrarse en la organización criminal más peligrosa del mundo. Identidad falsa, sin respaldo, sin red de seguridad.',
      'Extraer información de un genio criminal sin que se dé cuenta de que está siendo interrogado.',
      'Doble agente en el corazón del enemigo durante seis meses. Sin contacto con tu lado. ¿Quién aguanta?',
    ],
  },

  {
    id: 'liderar-ejercito',
    category: 'Liderazgo en batalla',
    desiredTraits: ['liderazgo', 'estrategia', 'valentia'],
    variants: [
      'Un ejército desmoralizado, superado en número tres a uno. ¿Quién lo lidera hacia la victoria?',
      'El comandante cayó en combate. La batalla está perdida a medias. ¿Quién toma el mando?',
      'Hay que defender una posición imposible durante 72 horas hasta que lleguen los refuerzos. ¿Quién organiza la defensa?',
    ],
  },

  {
    id: 'hackeo-sistema',
    category: 'Tecnología',
    desiredTraits: ['tecnologia', 'inteligencia', 'creatividad'],
    variants: [
      'El sistema de seguridad más sofisticado del mundo. Seis horas para penetrarlo desde adentro.',
      'Necesitás acceder a una base de datos clasificada en tiempo real sin dejar huella digital.',
      'El algoritmo de IA del enemigo controla todo. Hay que encontrar el bug que lo hace colapsar.',
    ],
  },

  {
    id: 'sobrevivir-desierto',
    category: 'Supervivencia',
    desiredTraits: ['supervivencia', 'resistencia', 'adaptabilidad'],
    variants: [
      'Avión caído en pleno Sahara. Sin agua, sin radio, cuatro días hasta el próximo punto habitado.',
      'Varado en una isla desierta con recursos mínimos. ¿Quién logra que el grupo sobreviva?',
      'Tormenta de nieve, temperatura bajo cero, el campamento base destruido. ¿Quién saca al grupo?',
    ],
  },

  {
    id: 'resolver-crimen',
    category: 'Deducción',
    desiredTraits: ['deduccion', 'inteligencia', 'observacion'],
    variants: [
      'Un crimen perfecto: sin pistas obvias, sin testigos, sin móvil aparente. ¿Quién lo resuelve?',
      'El sospechoso más inteligente que jamás existió. ¿Quién lo interroga?',
      'Doce pistas contradictorias, cuatro sospechosos, y 48 horas antes de que se pierda la evidencia. ¿Quién lidera?',
    ],
  },

  {
    id: 'proteger-lider',
    category: 'Combate',
    desiredTraits: ['combate', 'precision', 'valentia'],
    variants: [
      'Hay un intento de asesinato en progreso. El objetivo está en una sala cerrada con una sola salida. ¿Quién actúa?',
      'Emboscada en territorio desconocido. El equipo está herido. Solo hay un camino de salida. ¿Quién lo abre?',
      'Cinco atacantes armados, vos solo, terreno abierto. ¿Quién tiene mejor chance de salir?',
    ],
  },

  {
    id: 'improvisa-solucion',
    category: 'Ingenio',
    desiredTraits: ['creatividad', 'improvisa', 'tecnologia', 'inteligencia'],
    variants: [
      'Crear un dispositivo funcional con materiales de descarte en 20 minutos. Literalmente dependen vidas.',
      'El plan falló. No hay herramientas, no hay tiempo, no hay plan B. ¿Quién improvisa la solución?',
      'Missión en curso: el equipo esencial se rompió. ¿Quién lo reemplaza con lo que hay?',
    ],
  },

  {
    id: 'calmar-multitud',
    category: 'Carisma',
    desiredTraits: ['carisma', 'liderazgo', 'empatia', 'calma'],
    variants: [
      'Una multitud al borde del pánico colectivo. ¿Quién la tranquiliza?',
      'Ciudad en caos tras un desastre. La gente no sabe adónde ir. ¿Quién organiza la respuesta?',
      'Riot en progreso, miles de personas furiosas, un micrófono. ¿Quién habla?',
    ],
  },

  {
    id: 'descifrar-codigo',
    category: 'Inteligencia',
    desiredTraits: ['inteligencia', 'deduccion', 'planificacion'],
    variants: [
      'Un mensaje encriptado con una clave que nadie conoce. Dos horas para descifrarlo.',
      'El código más críptico en la historia del espionaje internacional. ¿Quién lo rompe?',
      'Acertijo que determina la ubicación de la amenaza. Las pistas son todas falsas salvo una. ¿Quién encuentra cuál?',
    ],
  },

  {
    id: 'atrapar-fugitivo',
    category: 'Persecución',
    desiredTraits: ['adaptabilidad', 'precision', 'estrategia', 'determinacion'],
    variants: [
      'El fugitivo más escurridizo del mundo lleva diez años libre. ¿Quién finalmente lo atrapa?',
      'Persecución en territorio enemigo con recursos limitados. ¿Quién dirige el operativo?',
      'El objetivo cambia de identidad cada 48 horas. ¿Quién lo encuentra antes del próximo cambio?',
    ],
  },

  {
    id: 'convencer-villano',
    category: 'Redención',
    desiredTraits: ['negociacion', 'empatia', 'carisma', 'sabiduria'],
    variants: [
      'Tenés que convencer a un villano de que abandone su plan destructivo. Sin armas, solo palabras.',
      'Un antagonista con razones comprensibles. ¿Quién logra que cambie de bando?',
      'El enemigo no es malvado, solo desesperado. ¿Quién le muestra otra salida?',
    ],
  },

  {
    id: 'entrenar-equipo',
    category: 'Mentoría',
    desiredTraits: ['liderazgo', 'paciencia', 'carisma', 'combate'],
    variants: [
      'Un grupo de civiles sin entrenamiento que deben convertirse en combatientes en una semana.',
      'Quince personas con habilidades dispersas que deben actuar como equipo en 48 horas.',
      'El último recruit antes de la batalla final. Tiene potencial pero cero experiencia. ¿Quién lo entrena?',
    ],
  },

  {
    id: 'escapar-prision',
    category: 'Ingenio',
    desiredTraits: ['planificacion', 'creatividad', 'adaptabilidad', 'sigilo'],
    variants: [
      'La prisión de máxima seguridad más moderna del mundo. Sin herramientas, sin aliados adentro. ¿Quién escapa?',
      'Capturado por el enemigo. Juicio en 24 horas. ¿Quién diseña la fuga?',
      'Encerrado en una celda con solo lo que tenés encima. Hay una ventana de 8 minutos. ¿Quién la aprovecha?',
    ],
  },

  {
    id: 'mision-kamikaze',
    category: 'Sacrificio',
    desiredTraits: ['valentia', 'determinacion', 'lealtad'],
    variants: [
      'Una misión de la que quizás nadie vuelve. ¿Quién se ofrece voluntario?',
      'Hay que alguien que quede atrás para que los demás escapen. ¿Quién da un paso al frente?',
      'El plan solo funciona si alguien asume el riesgo mayor. ¿Quién lo toma?',
    ],
  },

  {
    id: 'guerra-informacion',
    category: 'Estrategia',
    desiredTraits: ['estrategia', 'inteligencia', 'calma', 'engano'],
    variants: [
      'Guerra de información: sin disparos, solo movidas de ajedrez a escala global. ¿Quién gana?',
      'El oponente lleva veinte años de ventaja en inteligencia. ¿Quién diseña el contraataque?',
      'Desinformación masiva: el enemigo cree que ganó. ¿Quién armó esa trampa?',
    ],
  },

  // ─── OVERRIDE / ABSURDO ───────────────────────────────────────────────────

  {
    id: 'absurdo-primer-dia',
    category: 'Vida Cotidiana',
    correctOverride: 'spider-man',
    optionPool: ['spider-man', 'terminator', 'darth-vader', 'ip-man'],
    variants: [
      'Primer día en el trabajo nuevo. Llegás tarde, el café se derramó en tu camisa y el jefe ya te busca. ¿Quién maneja mejor este desastre?',
    ],
    explanationsOverride: {
      'spider-man':  'Peter Parker arranca todos los días así. Tiene un discurso de excusas perfeccionado desde el secundario — y además resulta simpático.',
      'terminator':  'Procesaría la situación como error de sistema, escanearia al jefe como amenaza potencial y esperaría órdenes. El jefe huye.',
      'darth-vader': 'Entró. El jefe empezó a hablar. Ahora el jefe ya no respira del todo bien.',
      'ip-man':      'Llegaría con el traje impecable y una inclinación de cabeza... pero genuinamente confundido sobre qué es una "empresa".',
    },
  },

  {
    id: 'absurdo-ikea',
    category: 'Vida Cotidiana',
    correctOverride: 'el-profesor',
    optionPool: ['el-profesor', 'gollum', 'spider-man', 'jack-sparrow'],
    variants: [
      'Llevan tres horas intentando armar un mueble de IKEA sin instrucciones y están peor que al principio. ¿A quién llaman?',
    ],
    explanationsOverride: {
      'el-profesor':   'Analizó el sistema de ensamblaje en diez minutos y tiene un diagrama alternativo más eficiente que el original.',
      'gollum':        'Querría el destornillador para él, "mi tesoro", y acusaría a los tornillos de ser ladrones de tiempo.',
      'spider-man':    'Pegaría las piezas con telaraña. El resultado sería estructuralmente estable pero visualmente inaceptable.',
      'jack-sparrow':  'Lo terminaría usando solo dos tornillos, prometería que "funciona igual, savvy?" y desaparecería con las instrucciones.',
    },
  },

  {
    id: 'absurdo-peor-cita',
    category: 'Romance Catastrófico',
    correctOverride: 'gollum',
    optionPool: ['gollum', 'sherlock', 'walter-white', 'darth-vader'],
    variants: [
      '¿Quién sería la peor cita romántica de la historia de la ficción?',
    ],
    explanationsOverride: {
      'gollum':        'Solo hablaría de "mi tesoro", describiría las cuevas como "muy románticas" y mordería el aperitivo de tu plato sin aviso.',
      'sherlock':      'Pasaría la cena enumerando tus inseguridades en voz alta y preguntando si el crimen que describís "es teórico o autobiográfico".',
      'walter-white':  'Llevaría la conversación inevitablemente hacia "mi legado" y pediría que no lo llames Heisenberg... pero lo es.',
      'darth-vader':   'La respiración. Solo la respiración. Durante toda la cena. Sin parar.',
    },
  },

  {
    id: 'absurdo-smartphone',
    category: 'Choque Cultural',
    correctOverride: 'ragnar-lothbrok',
    optionPool: ['ragnar-lothbrok', 'gandalf', 'ip-man', 'john-wick'],
    variants: [
      '¿A quién le explicarías cómo usar un smartphone por primera vez con peores consecuencias?',
    ],
    explanationsOverride: {
      'ragnar-lothbrok': 'Preguntaría si puede usarlo para hablar con Odín. Al no funcionar, lo arrojaría al mar como ofrenda a los dioses.',
      'gandalf':         'Diría "ya sabía que esto existiría" y empezaría a mandar mensajes crípticos a números al azar a las 3 de la madrugada.',
      'ip-man':          'Lo sostendría con ambas manos con absoluto respeto y preguntaría cuál es la forma honorable de inclinarse ante él.',
      'john-wick':       'Lo usaría para mandar exactamente un mensaje: "ya voy". Sin más contexto. A todos sus contactos.',
    },
  },

  {
    id: 'absurdo-brindis',
    category: 'Momento Incómodo',
    correctOverride: 'jack-sparrow',
    optionPool: ['jack-sparrow', 'terminator', 'walter-white', 'harry-potter'],
    variants: [
      'Hay que improvisar un brindis en la boda de alguien que apenas conocés, frente a 200 personas. ¿Quién lo hace mejor?',
    ],
    explanationsOverride: {
      'jack-sparrow':   'Empezaría con "La vida es como el mar..." y terminaría diez minutos después con todos llorando de emoción sin saber exactamente qué dijo.',
      'terminator':     '"Evento social detectado: boda. Iniciando protocolo de felicitación." Lo leería de una lista numerada.',
      'walter-white':   'Hablaría de sí mismo durante ocho de los diez minutos del brindis y terminaría con "y así es como se hace".',
      'harry-potter':   '"Ehm... bueno... esto es como cuando Hermione y yo..." Pausa larga. "¡Felicitaciones!" Aplausos por lástima.',
    },
  },

  {
    id: 'absurdo-fila-supermercado',
    category: 'Caos Urbano',
    correctOverride: 'sherlock',
    optionPool: ['sherlock', 'jack-sparrow', 'ragnar-lothbrok', 'darth-vader'],
    variants: [
      'Cola de 40 personas en el supermercado, abrieron una sola caja y el cajero no encuentra el código de barras del kiwi. ¿Quién resuelve esto?',
    ],
    explanationsOverride: {
      'sherlock':        'En 90 segundos reorganizó la fila por tiempo estimado de pago, identificó al empleado más eficiente y el gerente ya le tiene miedo.',
      'jack-sparrow':    'Distraería a mitad de la fila con una historia imposible, se colaría elegantemente y todos aplaudirían sin entender por qué.',
      'ragnar-lothbrok': 'Declararía a los de la fila sus hermanos de batalla y propondría invadir el supermercado de al lado juntos.',
      'darth-vader':     'Fuerza-estrangularía al cajero. Problema técnicamente resuelto. Nuevos problemas creados.',
    },
  },

  {
    id: 'absurdo-zoom',
    category: 'Tecnología Hostil',
    correctOverride: 'tony-stark',
    optionPool: ['tony-stark', 'gollum', 'terminator', 'ragnar-lothbrok'],
    variants: [
      'Son las 9 de la mañana, hay una reunión de Zoom obligatoria, el micrófono no anda y nadie sabe quién puso el fondo de playa virtual. ¿Quién resuelve esto?',
    ],
    explanationsOverride: {
      'tony-stark':      'Problema resuelto en 30 segundos, los demás conectados sin lag, y ya está aburrido para cuando empiece la reunión real.',
      'gollum':          '"¿La pantalla... nos mira? No nos gusta que la pantalla nos mire, no, no." Se desconecta a los dos minutos.',
      'terminator':      'Procesa la falla técnica como amenaza sistémica y empieza a escanear a cada participante como objetivo potencial.',
      'ragnar-lothbrok': 'Pregunta por qué los guerreros hablan en una caja mágica en lugar de reunirse como hombres alrededor de un fuego.',
    },
  },

  {
    id: 'absurdo-gato-arbol',
    category: 'Emergencia Doméstica',
    correctOverride: 'spider-man',
    optionPool: ['spider-man', 'darth-vader', 'gandalf', 'ip-man'],
    variants: [
      'Tu gato está trepado a un árbol de 15 metros y no baja. Los bomberos tardan dos horas. ¿Quién te ayuda ahora?',
    ],
    explanationsOverride: {
      'spider-man':  'Está ahí en cuatro segundos, hace un chiste mientras baja al gato, lo pone en tus brazos y ya está en otro edificio.',
      'darth-vader': 'Lo intenta con la Fuerza. El gato vuela hacia él. Funciona... pero el gato está claramente traumatizado.',
      'gandalf':     '"Un gato sabe bien cuándo bajar. Llegará cuando deba." Se sienta, saca la pipa y espera con absoluta calma.',
      'ip-man':      'Sube al árbol con gracia perfecta, sin decir una sola palabra, y baja con el gato en brazos como si fuera una lección de humildad.',
    },
  },
]
