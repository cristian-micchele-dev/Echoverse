// Unidad mínima de gameplay.
// `title` = nombre del capítulo que se muestra durante el juego.
// Agregar personaje nuevo = agregar su clave en `outcomes`. Sin tocar lógica.

export const situations = [
  {
    id: 'parking-ambush',
    title: 'Emboscada',
    text: 'Estás rodeado en un estacionamiento oscuro. Tres hombres armados se acercan desde distintos ángulos.',
    timeLimit: 5000,
    options: [
      { id: 'attack',    label: 'Atacar'    },
      { id: 'negotiate', label: 'Negociar'  },
      { id: 'escape',    label: 'Escapar'   }
    ],
    outcomes: {
      'john-wick': {
        attack:    { result: 'win',     narrative: 'Tres segundos. Cuatro movimientos. Ninguno queda en pie.' },
        negotiate: { result: 'partial', narrative: 'Les das la oportunidad. Solo uno acepta. Los otros, no.' },
        escape:    { result: 'fail',    narrative: 'Corrés. Te alcanzan. No debiste mostrar la espalda.' },
        timeout:   { result: 'fail',    narrative: 'La indecisión no es un lujo que te podés dar.' }
      },
      'walter-white': {
        attack:    { result: 'partial', narrative: 'Improvisás con lo que tenés. Funciona... apenas.' },
        negotiate: { result: 'win',     narrative: 'Les ofrecés algo que necesitan. La química te salva.' },
        escape:    { result: 'win',     narrative: 'Desaparecés antes de que te reconozcan. Smart.' },
        timeout:   { result: 'fail',    narrative: 'El miedo te congela. Te llevan.' }
      },
      'tony-stark': {
        attack:    { result: 'win',     narrative: 'Nano-suit. Dos segundos de carga, cero de resistencia.' },
        negotiate: { result: 'partial', narrative: 'Intentás impresionarlos con tu nombre. Uno sabe quién sos.' },
        escape:    { result: 'win',     narrative: 'Propulsores activados. Bye.' },
        timeout:   { result: 'fail',    narrative: 'JARVIS te advirtió. No escuchaste.' }
      },
      'darth-vader': {
        attack:    { result: 'win',     narrative: 'El Lado Oscuro fluye. Ninguno resiste la Fuerza.' },
        negotiate: { result: 'partial', narrative: 'Les ofrecés unirse al Imperio. Dos aceptan, uno corre.' },
        escape:    { result: 'partial', narrative: 'Te retirás. Un Lord Sith no huye — pero calcula.' },
        timeout:   { result: 'fail',    narrative: 'La hesitación es debilidad. Lord Sidious no lo aprobaría.' }
      },
      'sherlock': {
        attack:    { result: 'partial', narrative: 'Aplicás baritsu. Efectivo, pero hay una cámara.' },
        negotiate: { result: 'win',     narrative: 'En 4 segundos los descifraste. Uno es informante. Terminado.' },
        escape:    { result: 'win',     narrative: 'Salida alternativa — la calculaste al entrar.' },
        timeout:   { result: 'partial', narrative: 'Raro. Normalmente ya tendrías tres planes.' }
      },
      'jack-sparrow': {
        attack:    { result: 'partial', narrative: 'Sable en mano, algo de rum y suerte. Más o menos funciona.' },
        negotiate: { result: 'win',     narrative: 'Los convencés de que les debés menos de lo que creían. Jack Sparrow, siempre.' },
        escape:    { result: 'win',     narrative: 'Desaparecés por una puerta que nadie vio. Clásico.' },
        timeout:   { result: 'chaos',   narrative: 'Terminás negociando con todos al mismo tiempo. Confuso pero vivo.' }
      },
      'harry-potter': {
        attack:    { result: 'partial', narrative: '¡Stupefy! Uno cae. Los otros dos se ponen al tanto.' },
        negotiate: { result: 'partial', narrative: 'Intentás razonar. No todos los problemas se resuelven con palabras.' },
        escape:    { result: 'win',     narrative: '¡Accio escoba! Desaparecés antes de que reaccionen.' },
        timeout:   { result: 'fail',    narrative: 'La duda te cuesta la varita. La perdés.' }
      },
      default: {
        attack:    { result: 'partial', narrative: 'Luchás con lo que tenés. Hay daños de ambos lados.' },
        negotiate: { result: 'partial', narrative: 'Las palabras tienen peso. Ganás tiempo.' },
        escape:    { result: 'win',     narrative: 'Desaparecés antes de que empiece. Buena decisión.' },
        timeout:   { result: 'fail',    narrative: 'La indecisión tiene un costo muy alto.' }
      }
    }
  },

  {
    id: 'hostage-room',
    title: 'El Rehén',
    text: 'El rehén está atado en el centro de la sala. El captor tiene un detonador en la mano.',
    timeLimit: 5000,
    options: [
      { id: 'rush',     label: 'Avanzar'    },
      { id: 'distract', label: 'Distraer'   },
      { id: 'snipe',    label: 'Neutralizar' }
    ],
    outcomes: {
      'john-wick': {
        rush:     { result: 'win',     narrative: 'Llegás antes de que reactive el pulgar. Rehén libre.' },
        distract: { result: 'partial', narrative: 'Se distrae. Actuás. El detonador cae pero hubo pérdida de tiempo.' },
        snipe:    { result: 'win',     narrative: 'Un disparo. Mano inutilizada. Nadie más tiene que morir.' },
        timeout:  { result: 'fail',    narrative: 'El captor no esperaba indecisión. El rehén paga el precio.' }
      },
      'tony-stark': {
        rush:     { result: 'win',     narrative: 'FRIDAY localiza el detonador. Pulso repulsor. Desactivado.' },
        distract: { result: 'win',     narrative: 'Hologram decoy. El captor se gira. Tony ya está detrás.' },
        snipe:    { result: 'win',     narrative: 'Micro-misil de precisión. Mano neutralizada, rehén intacto.' },
        timeout:  { result: 'fail',    narrative: 'Incluso Iron Man necesita dar la orden.' }
      },
      'sherlock': {
        rush:     { result: 'partial', narrative: 'No es lo tuyo. Funciona, pero no fue elegante.' },
        distract: { result: 'win',     narrative: 'Sabés exactamente qué decir. El captor te mira, el rehén escapa.' },
        snipe:    { result: 'partial', narrative: 'Calculás el ángulo. El tiro es bueno. Lestrade lo va a cuestionar.' },
        timeout:  { result: 'fail',    narrative: 'El análisis tomó más de lo esperado.' }
      },
      'darth-vader': {
        rush:     { result: 'win',     narrative: 'La Fuerza frena el pulgar. El captor no puede activarlo.' },
        distract: { result: 'partial', narrative: 'Proyección mental. Funciona, pero el rehén quedó herido.' },
        snipe:    { result: 'win',     narrative: 'Sable de luz. La mano del captor, ya no está.' },
        timeout:  { result: 'fail',    narrative: 'Lord Sidious veía esto venir. Vos, no.' }
      },
      default: {
        rush:     { result: 'partial', narrative: 'Corrés. El caos es inevitable, pero el rehén sobrevive.' },
        distract: { result: 'win',     narrative: 'Tu distracción crea la ventana. Dos segundos es suficiente.' },
        snipe:    { result: 'partial', narrative: 'Intentás neutralizar sin herir. La mano del captor tiembla.' },
        timeout:  { result: 'fail',    narrative: 'El detonador se activa. Tenías que haber actuado.' }
      }
    }
  },

  {
    id: 'final-escape',
    title: 'Sin Salida',
    text: 'El edificio explota en segundos. Dos salidas: escalera (lenta) o ventanal (tres pisos de caída libre).',
    timeLimit: 5000,
    options: [
      { id: 'stairs', label: 'Escalera' },
      { id: 'jump',   label: 'Saltar'   }
    ],
    outcomes: {
      'john-wick': {
        stairs:  { result: 'partial', narrative: 'Llegás justo. La onda expansiva te tira, pero salís.' },
        jump:    { result: 'win',     narrative: 'Caída controlada. Rodás al aterrizar. Perfecto.' },
        timeout: { result: 'fail',    narrative: 'El edificio decidió por vos.' }
      },
      'tony-stark': {
        stairs:  { result: 'partial', narrative: 'Boosters al 40%. Llegás. El traje tarda en regenerarse.' },
        jump:    { result: 'win',     narrative: 'Vuelo asistido. Classic Stark exit.' },
        timeout: { result: 'fail',    narrative: 'Incluso JARVIS no puede ayudarte si no das la orden.' }
      },
      'harry-potter': {
        stairs:  { result: 'partial', narrative: 'La explosión te empuja por las escaleras. Doloroso pero vivo.' },
        jump:    { result: 'win',     narrative: '¡Wingardium Leviosa! Aterrizás como si nada.' },
        timeout: { result: 'fail',    narrative: 'El tiempo se agotó antes que las ideas.' }
      },
      'jack-sparrow': {
        stairs:  { result: 'partial', narrative: 'Tropezás. Llegás. La dignidad quedó en el tercer escalón.' },
        jump:    { result: 'win',     narrative: 'Caés sobre un toldo. Casualidad o plan maestro. Solo Jack sabe.' },
        timeout: { result: 'chaos',   narrative: 'El edificio explota. Aparecés tres cuadras más lejos. Nadie sabe cómo.' }
      },
      'darth-vader': {
        stairs:  { result: 'win',     narrative: 'Controlás la caída de escombros con la Fuerza. Camino limpio.' },
        jump:    { result: 'win',     narrative: 'Levitación asistida por la Fuerza. Aterrizás sin esfuerzo.' },
        timeout: { result: 'partial', narrative: 'El traje absorbe parte de la explosión. Costoso, pero vivo.' }
      },
      default: {
        stairs:  { result: 'fail',    narrative: 'Demasiado lento. La explosión llega primero.' },
        jump:    { result: 'partial', narrative: 'Aterrizás mal. Sobrevivís, pero con daños.' },
        timeout: { result: 'fail',    narrative: 'El tiempo no espera decisiones.' }
      }
    }
  },

  {
    id: 'security-checkpoint',
    title: 'Control de Acceso',
    text: 'El guardia de seguridad te mira fijo. Tu documentación es falsa. Detectó algo raro.',
    timeLimit: 5000,
    options: [
      { id: 'bluff', label: 'Blofear'    },
      { id: 'bribe', label: 'Sobornar'   },
      { id: 'force', label: 'Neutralizar' }
    ],
    outcomes: {
      'sherlock': {
        bluff:   { result: 'win',     narrative: 'Le decís exactamente lo que quiere escuchar. Pasa sin dudar.' },
        bribe:   { result: 'partial', narrative: 'Acepta. Pero quiere más la próxima vez.' },
        force:   { result: 'partial', narrative: 'Innecesario. Pero eficiente, supondrá Watson.' },
        timeout: { result: 'fail',    narrative: 'La duda te delata.' }
      },
      'jack-sparrow': {
        bluff:   { result: 'win',     narrative: 'Una historia tan ridícula que tiene que ser cierta. Te cree.' },
        bribe:   { result: 'win',     narrative: 'Monedas del Pecho Muerto. Nadie dice no al oro.' },
        force:   { result: 'chaos',   narrative: 'Tres guardias más aparecen. Esto se complicó, capitán.' },
        timeout: { result: 'chaos',   narrative: 'Empezás a improvisar. Nadie sabe cómo terminó exactamente.' }
      },
      'walter-white': {
        bluff:   { result: 'win',     narrative: 'Walter Hartwell White, Departamento de Química. Lo verifica. Funciona.' },
        bribe:   { result: 'win',     narrative: 'Efectivo más silencio. El guardia mira para otro lado.' },
        force:   { result: 'fail',    narrative: 'La alarma suena. Todo el piso está al tanto.' },
        timeout: { result: 'fail',    narrative: 'La duda te delata. El guardia llama refuerzos.' }
      },
      'tony-stark': {
        bluff:   { result: 'win',     narrative: 'Identidad falsa generada por JARVIS en tiempo real. Perfecto.' },
        bribe:   { result: 'win',     narrative: 'Transferencia cripto desde la muñeca. El guardia ni parpadea.' },
        force:   { result: 'partial', narrative: 'EMP localizado. El guardia cae, pero la cámara lo grabó.' },
        timeout: { result: 'fail',    narrative: 'JARVIS ya tenía el plan. Vos no lo ejecutaste.' }
      },
      default: {
        bluff:   { result: 'partial', narrative: 'Convencés a medias. Te deja pasar pero te marca.' },
        bribe:   { result: 'win',     narrative: 'El dinero habla más fuerte que cualquier credencial.' },
        force:   { result: 'fail',    narrative: 'La alarma suena. Todo el piso está al tanto.' },
        timeout: { result: 'fail',    narrative: 'La duda te delata. El guardia llama refuerzos.' }
      }
    }
  },

  {
    id: 'office-confrontation',
    title: 'El Objetivo',
    text: 'El objetivo está frente a vos. No esperaba que llegaras tan lejos. Tiene un arma bajo el escritorio.',
    timeLimit: 5000,
    options: [
      { id: 'threaten',  label: 'Amenazar'    },
      { id: 'grab-info', label: 'Extraer info' },
      { id: 'neutralize',label: 'Eliminar'    }
    ],
    outcomes: {
      'walter-white': {
        threaten:    { result: 'win',     narrative: '"Soy el que toca la puerta." No necesita más que eso.' },
        'grab-info': { result: 'win',     narrative: 'Química y presión. En dos minutos sabés todo.' },
        neutralize:  { result: 'partial', narrative: 'No eras asesino... o eso decías. Algo se rompió adentro.' },
        timeout:     { result: 'fail',    narrative: 'El objetivo llama refuerzos. Tu ventana se cerró.' }
      },
      'john-wick': {
        threaten:    { result: 'win',     narrative: 'Con voz y mirada. El objetivo sabe exactamente quién sos.' },
        'grab-info': { result: 'partial', narrative: 'No es tu estilo, pero funciona. Esta vez.' },
        neutralize:  { result: 'win',     narrative: 'Profesional. Limpio. Sin rastros.' },
        timeout:     { result: 'fail',    narrative: 'El elemento sorpresa era tu ventaja. Ya no.' }
      },
      'darth-vader': {
        threaten:    { result: 'win',     narrative: 'La Fuerza hace la mitad del trabajo. Habla solo.' },
        'grab-info': { result: 'win',     narrative: 'Mind probe. Sabe todo antes de que empiece a negar.' },
        neutralize:  { result: 'win',     narrative: 'Sable de luz. Rápido. Definitivo.' },
        timeout:     { result: 'partial', narrative: 'El objetivo saca el arma. Deflectás, pero escapa.' }
      },
      'sherlock': {
        threaten:    { result: 'partial', narrative: 'No es tu método. Funciona, pero dejás pistas.' },
        'grab-info': { result: 'win',     narrative: 'Tenés la respuesta antes de que termine la primera frase.' },
        neutralize:  { result: 'fail',    narrative: 'No sos asesino. Y el objetivo lo sabe.' },
        timeout:     { result: 'fail',    narrative: 'Demasiado análisis. El objetivo usó ese tiempo para escapar.' }
      },
      default: {
        threaten:    { result: 'partial', narrative: 'Lo intimidás. Cede algo, no todo.' },
        'grab-info': { result: 'win',     narrative: 'Bajo presión habla. Tenés lo que necesitabas.' },
        neutralize:  { result: 'partial', narrative: 'Misión cumplida, pero con complicaciones.' },
        timeout:     { result: 'fail',    narrative: 'Perdiste la ventaja. El objetivo está en alerta.' }
      }
    }
  },

  {
    id: 'server-room',
    title: 'Los Datos',
    text: 'El servidor frente a vos. Tres segundos antes de que el sistema active el borrado remoto.',
    timeLimit: 5000,
    options: [
      { id: 'hack',     label: 'Hackear'           },
      { id: 'physical', label: 'Extracción física'  },
      { id: 'destroy',  label: 'Destruir todo'      }
    ],
    outcomes: {
      'tony-stark': {
        hack:     { result: 'win',     narrative: 'JARVIS ya empezó antes de que preguntaras.' },
        physical: { result: 'win',     narrative: 'El nano-drive extrae en milisegundos.' },
        destroy:  { result: 'partial', narrative: 'Destruís el servidor. Los datos ya estaban en la nube.' },
        timeout:  { result: 'fail',    narrative: 'Incluso Tony Stark necesita dar la orden.' }
      },
      'walter-white': {
        hack:     { result: 'partial', narrative: 'No sos hacker. Pero sabés lo suficiente para no quedar afuera.' },
        physical: { result: 'win',     narrative: 'Química aplicada al circuito. El drive sale intacto.' },
        destroy:  { result: 'win',     narrative: 'Si no lo podés tener vos, nadie lo tiene. Metódico.' },
        timeout:  { result: 'fail',    narrative: 'El sistema se limpia solo. Llegaste tarde.' }
      },
      'sherlock': {
        hack:     { result: 'win',     narrative: 'La contraseña era obvia para quien observa. Segundos.' },
        physical: { result: 'partial', narrative: 'El drive sale, pero deja rastros. Alguien lo va a notar.' },
        destroy:  { result: 'partial', narrative: 'Destruís la evidencia. La tuya también.' },
        timeout:  { result: 'fail',    narrative: 'El sobre-análisis te costó la ventana.' }
      },
      'john-wick': {
        hack:     { result: 'partial', narrative: 'Llamás al técnico de la Camorra. Tarda, pero funciona.' },
        physical: { result: 'win',     narrative: 'Arrancás el rack entero. Efectivo. Nada sutil.' },
        destroy:  { result: 'win',     narrative: 'RPG al servidor. Nadie va a recuperar nada.' },
        timeout:  { result: 'fail',    narrative: 'No es tu área. Lo sabías. Igual dudaste.' }
      },
      default: {
        hack:     { result: 'partial', narrative: 'Entrás al sistema. Los datos están fragmentados.' },
        physical: { result: 'win',     narrative: 'Arrancás el drive. Lo que importa está adentro.' },
        destroy:  { result: 'partial', narrative: 'Destruís la evidencia. La tuya también.' },
        timeout:  { result: 'fail',    narrative: 'El borrado completa. No queda nada.' }
      }
    }
  },

  {
    id: 'rooftop-escape',
    title: 'Exfiltración',
    text: 'En la azotea. El helicóptero tiene 20 segundos. El último guardia bloquea el único acceso.',
    timeLimit: 5000,
    options: [
      { id: 'fight',  label: 'Pelear'    },
      { id: 'signal', label: 'Señalizar' },
      { id: 'bypass', label: 'Rodear'    }
    ],
    outcomes: {
      'john-wick': {
        fight:   { result: 'win',     narrative: 'El guardia no debió interponerse.' },
        signal:  { result: 'partial', narrative: 'El helicóptero ve la señal. El guardia, también.' },
        bypass:  { result: 'win',     narrative: 'Calculaste el flanco sin que lo notara.' },
        timeout: { result: 'fail',    narrative: 'El helicóptero no esperó.' }
      },
      'jack-sparrow': {
        fight:   { result: 'partial', narrative: 'Rum en los ojos. Funciona más de lo que debería.' },
        signal:  { result: 'win',     narrative: 'El piloto te debe una. Baja donde pedís.' },
        bypass:  { result: 'win',     narrative: 'Por la cornisa. Lento, ridículo, efectivo. Clásico Jack.' },
        timeout: { result: 'chaos',   narrative: 'El helicóptero parte. Aparecés en el muelle. Nadie sabe cómo.' }
      },
      'tony-stark': {
        fight:   { result: 'win',     narrative: 'Sonic disruptor. El guardia cae sin daño permanente.' },
        signal:  { result: 'win',     narrative: 'GPS beacon encriptado. El helicóptero ajusta la ruta.' },
        bypass:  { result: 'win',     narrative: 'Repulsor al 20%. Levitás por encima del guardia.' },
        timeout: { result: 'fail',    narrative: 'Tres opciones y no elegiste ninguna. No sos vos.' }
      },
      'darth-vader': {
        fight:   { result: 'win',     narrative: 'Strangulación a distancia. El guardia cae sin un sonido.' },
        signal:  { result: 'partial', narrative: 'El piloto ve la señal pero llega tarde. Escapa por poco.' },
        bypass:  { result: 'win',     narrative: 'Levitación. Pasás sobre él sin que lo sepa.' },
        timeout: { result: 'fail',    narrative: 'El helicóptero ya no estaba cuando decidiste.' }
      },
      default: {
        fight:   { result: 'partial', narrative: 'Lo derribás, pero llegás tarde. El helicóptero aguarda apenas.' },
        signal:  { result: 'win',     narrative: 'El piloto cambia el punto de aterrizaje. Perfecto.' },
        bypass:  { result: 'partial', narrative: 'Rodear toma tiempo. Llegás en el último segundo.' },
        timeout: { result: 'fail',    narrative: 'El helicóptero parte. Quedás en la azotea.' }
      }
    }
  },

  {
    id: 'train-pursuit',
    title: 'La Persecución',
    text: 'El tren arranca. Tu objetivo está en el último vagón. Tenés que llegar antes de que desaparezca.',
    timeLimit: 5000,
    options: [
      { id: 'sprint', label: 'Correr'   },
      { id: 'shoot',  label: 'Disparar' },
      { id: 'radio',  label: 'Coordinar' }
    ],
    outcomes: {
      'john-wick': {
        sprint:  { result: 'win',     narrative: 'Saltás al último vagón en el segundo exacto.' },
        shoot:   { result: 'partial', narrative: 'Le das en la pierna. El tren frena. Él sigue vivo.' },
        radio:   { result: 'partial', narrative: 'El segundo equipo llega tarde. El objetivo, casi escapa.' },
        timeout: { result: 'fail',    narrative: 'El tren desapareció en el túnel.' }
      },
      'sherlock': {
        sprint:  { result: 'partial', narrative: 'Llegás al tren, pero sin el arma. Solo con deducciones.' },
        shoot:   { result: 'fail',    narrative: 'No es tu método. Fallás. El objetivo se agacha.' },
        radio:   { result: 'win',     narrative: 'Coordinás con Lestrade. Lo esperan en la próxima estación.' },
        timeout: { result: 'fail',    narrative: 'El tren se fue. Hay tres posibles destinos. Insuficiente.' }
      },
      'tony-stark': {
        sprint:  { result: 'win',     narrative: 'Vuelo asistido. Llegás antes que el tren al destino.' },
        shoot:   { result: 'win',     narrative: 'Misil de precisión. Detiene el tren sin víctimas.' },
        radio:   { result: 'win',     narrative: 'JARVIS coordina desde el satélite. El objetivo no tiene salida.' },
        timeout: { result: 'fail',    narrative: 'Demasiados planes. Ninguno ejecutado.' }
      },
      default: {
        sprint:  { result: 'partial', narrative: 'Llegás. Cansado. El objetivo está esperándote.' },
        shoot:   { result: 'partial', narrative: 'Le rozás. El tren frena. La situación se complica.' },
        radio:   { result: 'win',     narrative: 'El equipo lo intercepta en la próxima parada.' },
        timeout: { result: 'fail',    narrative: 'El tren desapareció. El objetivo también.' }
      }
    }
  },

  {
    id: 'bridge-standoff',
    title: 'El Puente',
    text: 'A mitad del puente. El objetivo te apunta. Detrás suyo, el agua. Detrás tuyo, sus cómplices.',
    timeLimit: 5000,
    options: [
      { id: 'surrender', label: 'Rendirse'   },
      { id: 'charge',    label: 'Avanzar'    },
      { id: 'deceive',   label: 'Engañar'    }
    ],
    outcomes: {
      'john-wick': {
        surrender: { result: 'fail',    narrative: 'John Wick no se rinde. Nunca.' },
        charge:    { result: 'win',     narrative: 'Dos pasos. El arma de tu mano. El objetivo en el suelo.' },
        deceive:   { result: 'win',     narrative: 'Lo distraés. Un segundo. Suficiente.' },
        timeout:   { result: 'fail',    narrative: 'El momento de actuar pasó.' }
      },
      'jack-sparrow': {
        surrender: { result: 'win',     narrative: 'Se rinde con tanto estilo que el objetivo baja el arma confundido.' },
        charge:    { result: 'chaos',   narrative: 'Cae al agua. El objetivo también. Sobreviven los dos. Extraño.' },
        deceive:   { result: 'win',     narrative: 'Una historia sobre el Holandés Errante. El objetivo baja la guardia.' },
        timeout:   { result: 'chaos',   narrative: 'Empieza a negociar con sus propios cómplices. Nadie entiende qué pasó.' }
      },
      'walter-white': {
        surrender: { result: 'partial', narrative: 'Fingís rendirte. Calculás. Esperás el momento.' },
        charge:    { result: 'fail',    narrative: 'No sos un hombre de acción. Esta vez eso importa.' },
        deceive:   { result: 'win',     narrative: '"Conozco a tu jefe. Y él me necesita más de lo que te necesita a vos."' },
        timeout:   { result: 'fail',    narrative: 'La presión te paraliza. Eso no le pasaría a Heisenberg.' }
      },
      'darth-vader': {
        surrender: { result: 'fail',    narrative: 'Un Lord Sith no se rinde. El Lado Oscuro no contempla esa opción.' },
        charge:    { result: 'win',     narrative: 'Deflectás los disparos con el sable. Llegás en tres pasos.' },
        deceive:   { result: 'win',     narrative: 'Sugestión mental. Baja el arma. No sabe por qué.' },
        timeout:   { result: 'partial', narrative: 'Los cómplices actúan primero. Sobrevivís, pero con complicaciones.' }
      },
      default: {
        surrender: { result: 'partial', narrative: 'Bajás las manos. Ganás tiempo. Poco, pero suficiente.' },
        charge:    { result: 'partial', narrative: 'Avanzás. El disparo te roza. Llegás igual.' },
        deceive:   { result: 'win',     narrative: 'Señalás algo detrás de él. Se distrae. Es suficiente.' },
        timeout:   { result: 'fail',    narrative: 'Los cómplices avanzan. Sin opciones.' }
      }
    }
  }
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getSituationById(id) {
  return situations.find(s => s.id === id) || null
}

export function resolveOutcome(situation, characterId, choiceId) {
  const charOutcomes = situation.outcomes[characterId] || situation.outcomes.default
  return (
    charOutcomes?.[choiceId] ||
    charOutcomes?.timeout ||
    { result: 'fail', narrative: 'Sin respuesta.' }
  )
}
