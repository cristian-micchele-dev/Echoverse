/**
 * Interrogation mode data
 * 12 characters in the pool — 5 picked randomly each session
 * Each scenario includes suggestedQuestions + confrontations
 */

export const INTERROGATION_CHAR_IDS = [
  'walter-white', 'hannibal', 'sherlock', 'jack-sparrow', 'el-profesor',
  'tony-stark', 'darth-vader', 'tyler-durden', 'tommy-shelby', 'james-bond',
  'norman-bates', 'john-wick', 'captain-america', 'deadpool',
]

export const LIE_PROFILES = {
  'walter-white': {
    lieChance: 0.70, lieStyle: 'logical',
    styleDesc: 'Construye una lógica impecable para explicar lo inexplicable. Usa el conocimiento técnico como escudo.',
    tells:     'Justifica con precisión técnica, usa su orgullo como defensa, cuestiona el estándar de la acusación.',
  },
  'hannibal': {
    lieChance: 0.60, lieStyle: 'manipulative',
    styleDesc: 'Da verdades parciales envueltas en elegancia. Hace preguntas sobre el interrogador.',
    tells:     'Redirige el foco hacia el interrogador, da verdades incompletas que suenan completas.',
  },
  'sherlock': {
    lieChance: 0.25, lieStyle: 'evasive',
    styleDesc: 'Casi nunca miente, pero cuando lo hace responde preguntas con preguntas.',
    tells:     'Menciona datos irrelevantes con precisión, responde una pregunta con otra.',
  },
  'jack-sparrow': {
    lieChance: 0.80, lieStyle: 'manipulative',
    styleDesc: 'Cuenta historias más largas de lo necesario. Introduce terceras partes culpables.',
    tells:     'Historia excesivamente elaborada, culpa a alguien más, usa humor cuando la pregunta es incómoda.',
  },
  'el-profesor': {
    lieChance: 0.75, lieStyle: 'logical',
    styleDesc: 'Todo tiene una explicación preparada. Responde demasiado rápido a preguntas complejas.',
    tells:     'Respuestas demasiado perfectas, anticipa objeciones, usa datos para cambiar el foco.',
  },
  'tony-stark': {
    lieChance: 0.65, lieStyle: 'logical',
    styleDesc: 'Usa el sarcasmo y la superioridad intelectual como escudo. Convierte la mentira en espectáculo.',
    tells:     'Cambia el tema con una broma, sobrecarga la respuesta con tecnicismos.',
  },
  'darth-vader': {
    lieChance: 0.55, lieStyle: 'evasive',
    styleDesc: 'No miente abiertamente — omite. Usa la autoridad para cortar preguntas incómodas.',
    tells:     'Respuestas demasiado cortas cuando debería explicar más, apela a la autoridad.',
  },
  'tyler-durden': {
    lieChance: 0.85, lieStyle: 'manipulative',
    styleDesc: 'La mentira es su estado natural. Invierte la realidad hasta que el interrogador duda de sí mismo.',
    tells:     'Desafía las premisas de las preguntas, hace sentir al interrogador el verdadero culpable.',
  },
  'tommy-shelby': {
    lieChance: 0.70, lieStyle: 'logical',
    styleDesc: 'Calculado y frío. Cada respuesta está medida. Nunca da más de lo que le conviene.',
    tells:     'Pausas antes de responder preguntas simples, respuestas excesivamente breves.',
  },
  'james-bond': {
    lieChance: 0.60, lieStyle: 'evasive',
    styleDesc: 'Elegante y controlado. Responde lo suficiente para parecer cooperativo sin revelar nada.',
    tells:     'Sonríe cuando no debería, da detalles periféricos evitando el centro del asunto.',
  },
  'norman-bates': {
    lieChance: 0.75, lieStyle: 'manipulative',
    styleDesc: 'Amable en exceso. La mentira suena a verdad confesada.',
    tells:     'Sobreexplica su inocencia, introduce a "madre" como testigo, desvía hacia su soledad.',
  },
  'john-wick': {
    lieChance: 0.45, lieStyle: 'evasive',
    styleDesc: 'Habla lo mínimo. Cuando miente, lo hace por omisión — el silencio es su coartada.',
    tells:     'Respuestas de una sola oración cuando debería explicar más, evita detalles de tiempo y lugar.',
  },
  'captain-america': {
    lieChance: 0.15, lieStyle: 'evasive',
    styleDesc: 'Casi nunca miente. Cuando oculta algo, lo hace por clasificación o por proteger a otros, no por conveniencia propia.',
    tells:     'Pausa breve antes de responder, apela a "protocolo" o "seguridad nacional", responde con principios generales cuando debería dar detalles.',
  },
  'deadpool': {
    lieChance: 0.85, lieStyle: 'chaotic',
    styleDesc: 'Miente, confiesa, vuelve a mentir y luego te dice que estaba mintiendo cuando confesó. Su honestidad es indistinguible de su trolleo.',
    tells:     'Hace chistes cuando debería responder en serio, rompe la cuarta pared para "aclarar" algo que lo incrimina más, cambia de historia con entusiasmo.',
  },
}

export const SCENARIOS = {
  'walter-white': [
    {
      id: 'ww-explosion',
      text: 'Hubo una explosión en un laboratorio abandonado a las afueras de Albuquerque. Walter White fue visto caminando por la zona horas antes del incidente.',
      hiddenTruth: 'Estaba utilizando ese laboratorio clandestinamente. Provocó la explosión de forma intencional para destruir evidencia.',
      innocentVersion: 'Simplemente paseaba por ese barrio como parte de su rutina. No tenía ninguna relación con el laboratorio.',
      suggestedQuestions: [
        '¿Qué hacías exactamente en esa zona esa tarde?',
        '¿Conocías ese laboratorio antes del incidente?',
        '¿Tenés algún vínculo con química o laboratorios?',
      ],
      confrontations: [
        'Tengo registros que muestran que entraste a ese laboratorio dos horas antes de la explosión.',
        'Encontraron residuos químicos específicos que solo alguien con tu formación podría usar.',
        'Ya sé lo que hacías ahí. Esta es tu última oportunidad de contarme tu versión.',
      ],
    },
    {
      id: 'ww-desaparicion',
      text: 'Su socio desapareció tras una reunión con Walter White. Nadie más lo vio después de ese encuentro.',
      hiddenTruth: 'La reunión terminó en confrontación. White tomó decisiones que sellaron el destino de su socio.',
      innocentVersion: 'La reunión fue tensa pero terminó bien. Su socio se fue por su cuenta.',
      suggestedQuestions: [
        '¿De qué hablaron en esa reunión?',
        '¿Cómo terminó la última vez que lo viste?',
        '¿Tenías algún conflicto con él antes de ese día?',
      ],
      confrontations: [
        'Su teléfono dejó de dar señal exactamente a la hora en que terminó tu reunión.',
        'Hay un testigo que escuchó gritos en el lugar donde se encontraron.',
        'Encontraron sus pertenencias. Él no se fue por voluntad propia, ¿verdad?',
      ],
    },
  ],

  'hannibal': [
    {
      id: 'hannibal-paciente',
      text: 'Uno de los pacientes de Hannibal Lecter desapareció semanas después de comenzar terapia. La última entrada en su diario mencionaba una "cena extraordinaria" con el doctor.',
      hiddenTruth: 'El paciente descubrió algo que no debía. La cena fue real. El paciente no volvió por razones que el doctor prefiere no detallar.',
      innocentVersion: 'El paciente era inestable antes de llegar a terapia. La desaparición fue una decisión autónoma.',
      suggestedQuestions: [
        '¿Cuál fue la última sesión que tuvo con ese paciente?',
        '¿Qué tema trataban en terapia últimamente?',
        '¿Alguien más tenía acceso a sus notas clínicas?',
      ],
      confrontations: [
        'Su diario describe esa cena con detalles que solo ocurren en tu casa.',
        'El médico forense encontró algo en sus análisis que no cuadra con una desaparición voluntaria.',
        'Sé que esa cena ocurrió. Lo que necesito saber es si él volvió a su casa después.',
      ],
    },
    {
      id: 'hannibal-colega',
      text: 'Un colega del Dr. Lecter lo denunció públicamente. Días después fue encontrado inconsciente con signos de intoxicación.',
      hiddenTruth: 'Lecter encontró una forma elegante de silenciar la crítica. Solo química y paciencia.',
      innocentVersion: 'El colega tenía problemas de salud previos. Lecter no tuvo participación alguna.',
      suggestedQuestions: [
        '¿Cómo tomaste la denuncia pública de tu colega?',
        '¿Tuviste contacto con él después de que te denunció?',
        '¿Tenés acceso a los fármacos que aparecieron en su toxicología?',
      ],
      confrontations: [
        'La toxicología mostró una combinación de sustancias que requiere conocimiento médico avanzado.',
        'Un vecino te vio entrando al edificio de tu colega la noche anterior.',
        'Dos personas que te criticaron públicamente sufrieron "accidentes". Eso no es coincidencia.',
      ],
    },
  ],

  'sherlock': [
    {
      id: 'sherlock-robo',
      text: 'Un objeto de incalculable valor desapareció del Museo Británico. Sherlock Holmes fue visto en la sala dos horas antes del cierre.',
      hiddenTruth: 'Holmes tomó el objeto temporalmente para usarlo como cebo en una investigación mayor.',
      innocentVersion: 'Estaba estudiando otro objeto en esa sala para un caso de falsificación.',
      suggestedQuestions: [
        '¿Qué te llevó específicamente a esa sala del museo?',
        '¿Alguien te vio manipular el objeto en cuestión?',
        '¿Tenés actualmente en tu poder algo que no sea tuyo?',
      ],
      confrontations: [
        'Las cámaras te capturaron tocando el objeto exactamente donde estaba el sistema de seguridad.',
        'El guardia dice que preguntaste específicamente por ese objeto tres días antes.',
        'El objeto no apareció en ningún robo registrado. Alguien lo retiró con cuidado. Con guantes.',
      ],
    },
    {
      id: 'sherlock-informante',
      text: 'Un informante clave de Scotland Yard apareció muerto. Holmes era el único que conocía su identidad y ubicación.',
      hiddenTruth: 'Holmes cometió un error de cálculo al compartir información con alguien de confianza. No fue intencional, pero tuvo consecuencias.',
      innocentVersion: 'Holmes protegió la identidad del informante. La filtración vino de dentro de Scotland Yard.',
      suggestedQuestions: [
        '¿Compartiste la identidad del informante con alguien?',
        '¿Cómo llegaste a conocer su ubicación exacta?',
        '¿Hay alguien en tu entorno que pudiera haber accedido a esa información?',
      ],
      confrontations: [
        'El informante murió dentro de las 6 horas de tu última comunicación con él.',
        'Encontramos un cifrado en tu cuaderno que coincide con la dirección de su escondite.',
        'Alguien que sabía dónde estaba lo entregó. Solo había una persona que lo sabía.',
      ],
    },
  ],

  'jack-sparrow': [
    {
      id: 'sparrow-cargamento',
      text: 'Un cargamento de especias valorado en miles de monedas de oro desapareció del puerto de Tortuga. Jack Sparrow fue visto rondando los muelles la noche anterior.',
      hiddenTruth: 'Sparrow orquestó el robo con tres cómplices distintos, ninguno de los cuales sabía del otro.',
      innocentVersion: 'Sparrow estaba buscando su propio barco. Él también es víctima.',
      suggestedQuestions: [
        '¿Qué hacías exactamente en los muelles esa noche?',
        '¿Conocías al dueño del cargamento?',
        '¿Dónde está tu barco actualmente?',
      ],
      confrontations: [
        'Tres testigos distintos te vieron cerca del almacén esa noche. Tres.',
        'Encontramos especias del mismo lote en una embarcación asociada a tu nombre.',
        'Tus cómplices ya hablaron. Solo falta tu versión.',
      ],
    },
    {
      id: 'sparrow-mapa',
      text: 'El mapa del tesoro de la Isla Muerta desapareció tras una noche de cartas con Jack Sparrow.',
      hiddenTruth: 'Sparrow cambió el mapa real por una copia durante la partida mientras distraía al dueño.',
      innocentVersion: 'Sparrow ganó el mapa limpiamente en una partida legítima.',
      suggestedQuestions: [
        '¿Cómo conseguiste el mapa exactamente?',
        '¿En algún momento el mapa estuvo fuera de la vista del dueño?',
        '¿Podés describir el mapa que tenés actualmente?',
      ],
      confrontations: [
        'El dueño hizo una marca secreta en el mapa. La copia que tenés no la tiene.',
        'Un experto confirmó que el mapa que circulaste es una falsificación hecha apresuradamente.',
        'Nadie gana un mapa así en cartas. ¿Qué pasó realmente esa noche?',
      ],
    },
  ],

  'el-profesor': [
    {
      id: 'profesor-fuga',
      text: 'Cinco presos de alta seguridad se fugaron simultáneamente en tres penales distintos. La coordinación sugería un cerebro único.',
      hiddenTruth: 'El Profesor diseñó el plan durante meses. Los cinco presos eran parte de su red.',
      innocentVersion: 'El Profesor es un teórico. Conoce a esas personas de contextos académicos previos.',
      suggestedQuestions: [
        '¿Cuándo fue la última vez que contactaste a alguno de esos presos?',
        '¿Tenés conocimiento de arquitectura penitenciaria o sistemas de seguridad?',
        '¿Podés explicar cómo coincidió que los conocieras a todos?',
      ],
      confrontations: [
        'Encontramos planos de los tres penales en un servidor asociado a tu IP.',
        'Uno de los fugados mencionó tu nombre en su declaración.',
        'El timing fue perfecto al milisegundo. Eso no es coincidencia. Eso es un plan.',
      ],
    },
    {
      id: 'profesor-identidad',
      text: 'Alguien usó cinco identidades falsas durante dos años para moverse por Europa sin ser rastreado.',
      hiddenTruth: 'Todas las identidades son suyas. Las construyó con anticipación para el plan en marcha.',
      innocentVersion: 'Tiene una identidad alternativa por seguridad personal, no relacionada con ningún crimen.',
      suggestedQuestions: [
        '¿Podés justificar todos tus movimientos en los últimos dos años?',
        '¿Tenés documentos de identidad que no sean los oficiales?',
        '¿Por qué necesitarías moverte sin ser rastreado?',
      ],
      confrontations: [
        'Cinco pasaportes distintos, cinco caras distintas, una misma huella digital.',
        'Cruzaste tres fronteras la semana anterior al incidente. ¿A dónde ibas?',
        'Ya tenemos las identidades. Solo necesitamos que confirmes para qué las usabas.',
      ],
    },
  ],

  'tony-stark': [
    {
      id: 'stark-armas',
      text: 'Un lote de tecnología Stark clasificada apareció en manos de una organización terrorista.',
      hiddenTruth: 'Stark vendió esa tecnología hace años a través de intermediarios, antes de su transformación.',
      innocentVersion: 'La tecnología fue robada por un ex-empleado de Stark Industries.',
      suggestedQuestions: [
        '¿Cómo explicás que tus seriales aparezcan en manos de terroristas?',
        '¿Tenés registro de todos los lotes de armamento que salieron de tu empresa?',
        '¿Algún ex-empleado podría haber filtrado esa tecnología?',
      ],
      confrontations: [
        'Los registros de transferencia muestran esa tecnología saliendo de tus instalaciones hace tres años.',
        'El intermediario ya habló. Dijo que recibió instrucciones directas de alguien con acceso total.',
        'Podés explicar muchas cosas con sarcasmo. Pero estos números no mienten.',
      ],
    },
    {
      id: 'stark-accidente',
      text: 'Un accidente en Stark Industries dejó a tres técnicos heridos. Las cámaras de seguridad del sector fueron borradas.',
      hiddenTruth: 'Stark probaba una variante inestable del reactor de arco. Borró los registros para evitar la investigación.',
      innocentVersion: 'El accidente fue un fallo eléctrico. Las cámaras se borraron por un error del sistema automático.',
      suggestedQuestions: [
        '¿Qué experimento se estaba realizando en ese sector ese día?',
        '¿Quién tiene acceso para borrar manualmente las cámaras de seguridad?',
        '¿Los tres técnicos tenían autorización para estar en esa zona?',
      ],
      confrontations: [
        'El sistema no borra solo cámaras específicas. Eso requiere intervención manual con tu nivel de acceso.',
        'Uno de los técnicos describió una descarga energética que no coincide con ningún fallo eléctrico conocido.',
        'Tenés un historial de experimentos no autorizados. Este no sería el primero.',
      ],
    },
  ],

  'darth-vader': [
    {
      id: 'vader-rebeldes',
      text: 'Un convoy rebelde escapó de una trampa imperial perfectamente tendida. Alguien filtró los planes de ataque.',
      hiddenTruth: 'Vader los dejó escapar deliberadamente para seguirlos hasta su base, sin informar al Emperador.',
      innocentVersion: 'La fuga fue resultado de la incompetencia de los oficiales imperiales.',
      suggestedQuestions: [
        '¿Cuántas personas tenían acceso a los planes de ese operativo?',
        '¿Por qué no informaste al Emperador antes de la operación?',
        '¿Había algún objetivo táctico en dejar escapar a los rebeldes?',
      ],
      confrontations: [
        'Los registros de navegación muestran que ordenaste retirar las naves de bloqueo en el momento crítico.',
        'Ningún oficial haría eso sin una orden directa. Esa orden vino de ti.',
        'El Emperador ya sabe que algo no cuadra. Esto es tu oportunidad de dar tu versión primero.',
      ],
    },
    {
      id: 'vader-prisionero',
      text: 'Un prisionero rebelde de alto valor murió bajo custodia imperial antes de ser interrogado.',
      hiddenTruth: 'Vader perdió el control durante el interrogatorio. El prisionero sabía algo sobre su pasado que no podía llegar al Emperador.',
      innocentVersion: 'El prisionero tenía una condición cardíaca preexistente. Su muerte fue accidental.',
      suggestedQuestions: [
        '¿Fuiste el último en interrogar al prisionero?',
        '¿El prisionero dijo algo antes de morir?',
        '¿Por qué no había otros presentes durante el interrogatorio?',
      ],
      confrontations: [
        'El médico imperial dijo que las lesiones no son consistentes con una falla cardíaca natural.',
        'Pediste estar solo con el prisionero. Eso no es procedimiento estándar.',
        'El prisionero conocía algo sobre Anakin Skywalker. ¿Qué te dijo exactamente?',
      ],
    },
  ],

  'tyler-durden': [
    {
      id: 'tyler-explosion-2',
      text: 'Tres sucursales bancarias sufrieron daños estructurales en la misma noche. Tyler Durden fue visto cerca de dos de ellas.',
      hiddenTruth: 'Las explosiones fueron parte del Plan Mayhem. Durden las organizó y entrenó a quienes las ejecutaron.',
      innocentVersion: 'Tyler Durden es un concepto. Quien haya visto esa noche no era él.',
      suggestedQuestions: [
        '¿Dónde estabas exactamente cuando ocurrieron las explosiones?',
        '¿Conocés a alguien con acceso a explosivos o conocimiento en demolición?',
        '¿Qué es el Club de la Pelea para vos?',
      ],
      confrontations: [
        'Tu ADN apareció en uno de los sitios. No podés ser "un concepto" si dejás rastro biológico.',
        'Cuatro personas distintas te identificaron en las proximidades esa noche.',
        'Uno de los ejecutores habló. Dijo que entrenó con vos personalmente.',
      ],
    },
    {
      id: 'tyler-club',
      text: 'Aparecieron denuncias de violencia organizada vinculadas a un club clandestino. Los testigos describen a un hombre rubio con cicatrices como líder.',
      hiddenTruth: 'Tyler fundó el club, estableció sus reglas y seleccionó personalmente a los miembros.',
      innocentVersion: 'Tyler está siendo confundido con alguien más.',
      suggestedQuestions: [
        '¿Alguna vez participaste en peleas clandestinas?',
        '¿Conocés a los hombres que aparecen en estas denuncias?',
        '¿Podés explicar las cicatrices que tenés?',
      ],
      confrontations: [
        'Tenemos grabaciones de audio donde se menciona tu nombre como fundador.',
        'Quince personas independientes te describieron con los mismos detalles físicos.',
        'La violencia que organizaste terminó en hospitalizaciones. Eso ya no es filosofía.',
      ],
    },
  ],

  'tommy-shelby': [
    {
      id: 'tommy-contrabando',
      text: 'Un cargamento de armas desapareció del puerto de Birmingham. Los registros apuntan a una empresa fantasma con conexiones a los Shelby.',
      hiddenTruth: 'Tommy orquestó el robo para venderlo a una facción rival que le conviene debilitar.',
      innocentVersion: 'Alguien usa el nombre Shelby para cubrir sus propios movimientos.',
      suggestedQuestions: [
        '¿Tenés conocimiento de ese cargamento?',
        '¿Podés explicar la conexión entre esa empresa y tu familia?',
        '¿Quién más tiene acceso a las operaciones portuarias que manejan?',
      ],
      confrontations: [
        'La empresa fantasma fue registrada con un notario que trabaja exclusivamente para los Shelby.',
        'El capitán del barco identificó a uno de tus hombres en el muelle esa noche.',
        'Tommy, ya sé cómo operás. Solo quiero saber adónde fue ese cargamento.',
      ],
    },
    {
      id: 'tommy-testigo',
      text: 'El principal testigo en un caso contra la familia Shelby retiró su declaración repentinamente, días después de una reunión privada con Tommy.',
      hiddenTruth: 'Tommy le hizo una oferta que no podía rechazar. No fue una amenaza — fue algo más conveniente.',
      innocentVersion: 'El testigo mintió desde el principio. Tommy solo le hizo ver que declarar en falso tiene consecuencias legales.',
      suggestedQuestions: [
        '¿De qué hablaron en esa reunión?',
        '¿Le ofreciste algo a cambio de retirar la declaración?',
        '¿El testigo vino a verte voluntariamente o fue convocado?',
      ],
      confrontations: [
        'El testigo hizo un depósito bancario de £2000 al día siguiente de su reunión con vos.',
        'Su abogado dijo que recibió "una propuesta muy razonable". ¿De qué se trató?',
        'Retiraron la declaración. El dinero está en su cuenta. Solo necesito que digas qué pasó.',
      ],
    },
  ],

  'james-bond': [
    {
      id: 'bond-agente',
      text: 'Un agente del MI6 fue asesinado en Viena durante una operación encubierta. Bond era su contacto directo.',
      hiddenTruth: 'Bond tomó una decisión unilateral que expuso al agente. No siguió el protocolo y se equivocó.',
      innocentVersion: 'El agente fue comprometido por una filtración interna. Bond hizo exactamente lo que debía.',
      suggestedQuestions: [
        '¿Seguiste el protocolo de contacto al pie de la letra?',
        '¿Compartiste información del agente con alguien fuera del canal oficial?',
        '¿Hubo algún momento en que el agente quedó expuesto por tus acciones?',
      ],
      confrontations: [
        'El agente envió una señal de alerta exactamente 4 minutos después de tu último contacto.',
        'Tu ruta esa noche pasó a 200 metros del lugar del asesinato. Eso no estaba en el plan.',
        'Tomaste una decisión que no te correspondía tomar. Y alguien murió por eso.',
      ],
    },
    {
      id: 'bond-documentos',
      text: 'Documentos clasificados de la OTAN aparecieron en el mercado negro. Bond tuvo acceso a esos archivos 48 horas antes.',
      hiddenTruth: 'Bond fotografió los documentos para pasárselos a una fuente que creyó confiable. Un error de juicio.',
      innocentVersion: 'Bond accedió en el marco de una misión autorizada. La filtración vino de otro vector.',
      suggestedQuestions: [
        '¿Para qué necesitabas acceder a esos archivos específicamente?',
        '¿Alguien más estuvo presente cuando revisaste la documentación?',
        '¿Tenés contactos fuera del MI6 con quienes compartas inteligencia?',
      ],
      confrontations: [
        'Los metadatos de las fotografías filtradas corresponden a la cámara que portabas esa semana.',
        'Tu fuente ya fue identificada. Es solo cuestión de tiempo que te vinculen formalmente.',
        'No te pido que traiciones al MI6. Solo que expliques qué creías que ibas a lograr.',
      ],
    },
  ],

  'norman-bates': [
    {
      id: 'norman-huespeda',
      text: 'Una huésped del Bates Motel desapareció. Su auto fue hallado en el lago detrás de la propiedad.',
      hiddenTruth: 'Norman sabe exactamente qué pasó esa noche. Parte de él lo hizo. La disociación hace el resto.',
      innocentVersion: 'La huésped se fue temprano. Norman la vio marcharse. El auto en el lago no tiene explicación.',
      suggestedQuestions: [
        '¿Cuándo fue la última vez que la viste en el motel?',
        '¿Escuchaste algo inusual esa noche?',
        '¿Tu madre tuvo algún contacto con la huésped?',
      ],
      confrontations: [
        'Su bolso fue encontrado en una habitación que según los registros estaba vacía.',
        'El auto estaba en el lago. Alguien lo empujó. Hay marcas de pisadas que llegan hasta la orilla.',
        'Norman, sé que hay algo que no podés recordar bien. Contame qué fragments sí recordás.',
      ],
    },
    {
      id: 'norman-madre',
      text: 'Los vecinos reportaron gritos violentos desde la casa Bates. Norman dice que fue la televisión. Su madre dice que no pasó nada.',
      hiddenTruth: 'Los gritos eran reales. Lo que pasó en esa casa esa noche es algo que Norman no puede recordar.',
      innocentVersion: 'Madre estaba viendo una película dramática en volumen alto.',
      suggestedQuestions: [
        '¿A qué hora te fuiste a dormir esa noche?',
        '¿Podés describir lo que hiciste hora por hora esa noche?',
        '¿Podría hablar directamente con tu madre?',
      ],
      confrontations: [
        'Cuatro vecinos distintos reportaron los mismos gritos. No era una película.',
        'El médico que atendió a tu madre encontró marcas que no calzan con lo que contaste.',
        'Norman, a veces las personas hacen cosas que no recuerdan. ¿Hay algo así que te preocupe?',
      ],
    },
  ],

  'captain-america': [
    {
      id: 'cap-escudo',
      text: 'Un edificio civil fue destruido durante una operación de los Vengadores. Capitán América lideró la misión. Hay víctimas y ningún informe oficial.',
      hiddenTruth: 'Rogers tomó una decisión unilateral que salió mal. Eligió el objetivo operativo sobre la evacuación completa del área.',
      innocentVersion: 'Rogers siguió el protocolo de evacuación. El colapso fue consecuencia de una amenaza externa que no podía prever.',
      suggestedQuestions: [
        '¿Cuándo supiste que había civiles en el área?',
        '¿Hubo algún momento en que consideraste abortar la operación?',
        '¿El equipo recibió la orden de evacuar antes de iniciar el asalto?',
      ],
      confrontations: [
        'Las comunicaciones internas muestran que recibiste el alerta civil cuatro minutos antes de dar la orden de avance.',
        'Tres miembros del equipo declararon que pediste continuar cuando ya era evidente el riesgo.',
        'No sos el primero en decir que lo hiciste por el bien mayor. Esa frase tiene un historial complicado, Rogers.',
      ],
    },
    {
      id: 'cap-hydra',
      text: 'Un agente de SHIELD fue neutralizado durante una operación encubierta. Steve Rogers estuvo en el mismo sector. El agente tenía información clasificada sobre una célula de HYDRA.',
      hiddenTruth: 'Rogers sabía que el agente era un infiltrado de HYDRA y tomó la decisión sin autorización para proteger la información.',
      innocentVersion: 'Rogers llegó al sector después del incidente. No tuvo contacto con el agente.',
      suggestedQuestions: [
        '¿Conocías al agente personalmente?',
        '¿Cuál era tu objetivo en ese sector esa noche?',
        '¿Alguien más sabía que ibas a estar ahí?',
      ],
      confrontations: [
        'Tus coordenadas de movimiento te ubican a 80 metros del agente en el momento exacto del incidente.',
        'Tenías acceso al perfil de inteligencia de ese agente. Lo habías revisado 48 horas antes.',
        'No te estoy acusando, Rogers. Te estoy dando la oportunidad de explicarlo antes de que lo haga alguien con menos paciencia.',
      ],
    },
  ],

  'john-wick': [
    {
      id: 'wick-continental',
      text: 'Un hombre apareció muerto en el Continental de Nueva York. Las reglas del hotel prohíben los trabajos en sus instalaciones. John Wick estuvo esa noche.',
      hiddenTruth: 'Wick rompió las reglas. El hombre lo había seguido hasta allí y no tuvo otra opción.',
      innocentVersion: 'Wick estaba en el Continental como huésped, cumpliendo las reglas. Llegó después del incidente.',
      suggestedQuestions: [
        '¿Conocías al hombre que murió?',
        '¿En qué momento de la noche estabas en el lobby?',
        '¿Alguien puede confirmar dónde estabas cuando ocurrió?',
      ],
      confrontations: [
        'Las cámaras del pasillo te muestran en ese piso exactamente en la ventana horaria del deceso.',
        'El método fue demasiado limpio para ser un accidente. Tiene tu firma.',
        'Winston ya sabe lo que pasó. Esto es para darte la oportunidad de explicarlo antes de que él decida.',
      ],
    },
    {
      id: 'wick-helena',
      text: 'Un miembro del Alto Mesa fue encontrado muerto en su propiedad privada. Las marcas son inconfundibles. Solo un puñado de personas tiene ese nivel de habilidad.',
      hiddenTruth: 'Wick lo ejecutó como parte de su campaña. No fue defensa propia — fue calculado.',
      innocentVersion: 'Wick tenía motivos para hablar con ese hombre, no para matarlo. Alguien más lo hizo.',
      suggestedQuestions: [
        '¿Tenías alguna cuenta pendiente con ese miembro del Alto Mesa?',
        '¿Estuviste en las proximidades de su propiedad en los últimos días?',
        '¿Alguien sabe que tenías razones para querer verlo?',
      ],
      confrontations: [
        'El patrón de las heridas es idéntico al de otros casos vinculados a vos.',
        'Te vieron a tres cuadras de su propiedad dos horas antes de que lo encontraran.',
        'No estoy aquí para juzgarte. Estoy aquí porque el Alto Mesa necesita una respuesta antes de actuar.',
      ],
    },
  ],

  'deadpool': [
    {
      id: 'dp-mercenario',
      text: 'Un laboratorio de armas fue saqueado. Cámaras de seguridad muestran a alguien con un traje rojo y negro. El sospechoso habla con las cámaras antes de romperlas.',
      hiddenTruth: 'Lo hizo por encargo. El cliente era un alias conocido de una organización de tráfico de armas. Deadpool cobró y no le importó el destino del cargamento.',
      innocentVersion: 'Solo estaba "pasando por ahí" y entró porque le pareció interesante. No sabe nada del robo.',
      suggestedQuestions: [
        '¿Podés explicar por qué tu traje aparece en las grabaciones?',
        '¿Trabajaste para alguien en las últimas 48 horas?',
        '¿Qué sabés sobre el paradero de las armas robadas?',
      ],
      confrontations: [
        'Tenemos grabaciones tuyas saludando a las cámaras que después aparecen destruidas. Con guante.',
        'Tu cuenta bancaria recibió una transferencia de una empresa fantasma 12 horas antes del robo.',
        'Sé que estás pensando en un chiste. No lo hagas. Esto es serio.',
      ],
    },
    {
      id: 'dp-cuarta-pared',
      text: 'Un informante que iba a declarar contra una organización criminal apareció en paradero desconocido. El último contacto lo ubica en una cafetería donde Deadpool "estaba de casualidad".',
      hiddenTruth: 'Deadpool fue contratado para hacer desaparecer al informante. Lo hizo sin violencia, pero lo entregó al cliente.',
      innocentVersion: 'Deadpool solo fue a buscar chimichanga. El informante se fue por las suyas.',
      suggestedQuestions: [
        '¿Cuánto tiempo estuviste en esa cafetería?',
        '¿Conocías al informante antes de ese día?',
        '¿Alguien te contrató recientemente para un trabajo en esa zona?',
      ],
      confrontations: [
        'Cinco testigos te vieron salir de la cafetería con un hombre que coincide con la descripción del informante.',
        'Tu teléfono hizo ping en tres torres distintas siguiendo exactamente la misma ruta que el informante.',
        'Wade. Sé que estás a punto de hacer una referencia a una película. Primero respondé la pregunta.',
      ],
    },
  ],
}
