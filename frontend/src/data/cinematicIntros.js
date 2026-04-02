/**
 * cinematicIntros — datos únicos de intro cinematográfica para cada personaje.
 *
 * Cada entrada: { roleLine, quote, operation }
 *   roleLine  — descriptor de rol, corto y atmosférico
 *   quote     — frase icónica adaptada al contexto misión
 *   operation — nombre de la operación
 *
 * Cubiertos: todos los personajes del roster (40 en total).
 */
export const cinematicIntros = {

  // ── Héroes ──────────────────────────────────────────────────────────────

  'harry-potter': {
    roleLine:  'El Elegido de la profecía',
    quote:     'No hay nada que no pueda enfrentarse.',
    operation: 'Operación: El Elegido',
  },

  'spider-man': {
    roleLine:  'Tu amigable vecino arácnido',
    quote:     'Un gran poder conlleva una gran responsabilidad.',
    operation: 'Operación: Parker',
  },

  'katniss': {
    roleLine:  'La Sinsajo. Símbolo de la rebelión.',
    quote:     'Si caigo, que sirva de algo.',
    operation: 'Operación: El Sinsajo',
  },

  'wolverine': {
    roleLine:  'Weapon X. Logan. El mejor en lo que hace.',
    quote:     'Siempre fui el mejor en lo que hago. Y lo que hago no es bonito.',
    operation: 'Operación: Adamantio',
  },

  'john-mcclane': {
    roleLine:  'Detective NYPD. En el lugar equivocado, siempre.',
    quote:     'Yippee-ki-yay. Vamos.',
    operation: 'Operación: Nakatomi',
  },

  // ── Acción táctica ──────────────────────────────────────────────────────

  'john-wick': {
    roleLine:  'El hombre al que llaman Baba Yaga',
    quote:     'No falles.',
    operation: 'Operación: Sin retorno',
  },

  'bryan-mills': {
    roleLine:  'Ex agente CIA. Conjunto particular de habilidades.',
    quote:     'Te voy a encontrar. Y cuando lo haga...',
    operation: 'Operación: Rescate',
  },

  'frank-martin': {
    roleLine:  'El Transportador. Tres reglas. Sin excepciones.',
    quote:     'El trato ya estaba cerrado.',
    operation: 'Operación: Entrega',
  },

  'james-bond': {
    roleLine:  'Agente 007. Licencia para matar.',
    quote:     'Bond. James Bond.',
    operation: 'Operación: 007',
  },

  'jax-teller': {
    roleLine:  'Presidente de SAMCRO',
    quote:     'La lealtad tiene un costo. Siempre.',
    operation: 'Operación: Reaper',
  },

  'lara-croft': {
    roleLine:  'Arqueóloga. Cazadora de tumbas. Sobreviviente.',
    quote:     'Las tumbas guardan sus secretos con razón.',
    operation: 'Operación: Croft Legacy',
  },

  'furiosa': {
    roleLine:  'Imperator. Comandante del Yermo.',
    quote:     'Sobrevivir no alcanza.',
    operation: 'Operación: Citadel',
  },

  'alice': {
    roleLine:  'Agente Umbrella. Protocolo activo.',
    quote:     'El virus cambió todo. Yo cambié con él.',
    operation: 'Operación: Red Queen',
  },

  'la-novia': {
    roleLine:  'Black Mamba. Codename: Beatrix Kiddo.',
    quote:     'No hay lista más larga que la mía.',
    operation: 'Operación: Kill Bill',
  },

  // ── Estrategas ──────────────────────────────────────────────────────────

  'walter-white': {
    roleLine:  'El hombre que llama a la puerta',
    quote:     'Yo soy el peligro.',
    operation: 'Operación: Heisenberg',
  },

  'tony-stark': {
    roleLine:  'Genio. Millonario. Iron Man.',
    quote:     'Genio. Improvisado. Sin red de seguridad.',
    operation: 'Operación: Iron Protocol',
  },

  'el-profesor': {
    roleLine:  'El cerebro detrás del caos',
    quote:     'Cada movimiento ya estaba calculado.',
    operation: 'Operación: Bella Ciao',
  },

  'tommy-shelby': {
    roleLine:  'Jefe de los Peaky Blinders. Birmingham.',
    quote:     'Por orden de los Peaky Blinders.',
    operation: 'Operación: Small Heath',
  },

  // ── Detectives ──────────────────────────────────────────────────────────

  'sherlock': {
    roleLine:  'El único detective consultor del mundo',
    quote:     'El error no es una opción.',
    operation: 'Operación: Deducción Fatal',
  },

  'hannibal': {
    roleLine:  'Dr. Hannibal Lecter. Psiquiatra. Sibarita refinado.',
    quote:     'La rudeza es una declaración de inferioridad.',
    operation: 'Operación: Silencio',
  },

  // ── Villanos ─────────────────────────────────────────────────────────────

  'darth-vader': {
    roleLine:  'Señor Oscuro de los Sith',
    quote:     'El poder solo respeta al poder.',
    operation: 'Operación: Lado Oscuro',
  },

  'capitan-flint': {
    roleLine:  'El pirata más temido del Caribe',
    quote:     'Todo tiene un precio. Yo decido cuál es.',
    operation: 'Operación: Nassau',
  },

  'tyler-durden': {
    roleLine:  'Primera regla: no se habla. Segunda: no se habla.',
    quote:     'No tenés nada que perder. Eso te hace libre.',
    operation: 'Operación: Mayhem',
  },

  'venom': {
    roleLine:  'Simbionte clase Klyntar. Nosotros somos Venom.',
    quote:     'Somos depredadores. Somos Venom.',
    operation: 'Operación: Simbiosis',
  },

  'norman-bates': {
    roleLine:  'Gerente del Bates Motel. Estudiante de taxidermia.',
    quote:     'Mamá no aprueba lo que hacemos aquí.',
    operation: 'Operación: Room 12',
  },

  // ── Caóticos ─────────────────────────────────────────────────────────────

  'jack-sparrow': {
    roleLine:  'Capitán. Por favor, capitán.',
    quote:     'Un buen plan nunca sale según lo planeado.',
    operation: 'Operación: Rum & Glory',
  },

  'gollum': {
    roleLine:  'El guardián del Anillo Único',
    quote:     'Nosotros la encontraremos. Sí, mi tesoro.',
    operation: 'Operación: El Tesoro',
  },

  // ── Místicos ─────────────────────────────────────────────────────────────

  'gandalf': {
    roleLine:  'Istari. El Gris. El Blanco. El que regresa.',
    quote:     'No todos los que deambulan están perdidos.',
    operation: 'Operación: El Gris',
  },

  'eleven': {
    roleLine:  'Sujeto Once. Telequinesis clase X.',
    quote:     'Los amigos no mienten.',
    operation: 'Operación: Upside Down',
  },

  // ── Guerreros ─────────────────────────────────────────────────────────────

  'ragnar-lothbrok': {
    roleLine:  'Rey vikingo. Granjero. Conquistador del oeste.',
    quote:     'Los dioses son crueles. Por eso los honramos.',
    operation: 'Operación: Valhalla',
  },

  'leonidas': {
    roleLine:  'Rey de Esparta. Trescientos escudos. Un pasaje.',
    quote:     'Esta noche cenamos en el Hades.',
    operation: 'Operación: Termópilas',
  },

  'nathan-algren': {
    roleLine:  'Soldado americano forjado por el bushido',
    quote:     'El honor no se negocia.',
    operation: 'Operación: Katsumoto',
  },

  'jon-snow': {
    roleLine:  'Bastardo Stark. Lord Comandante. El que sabe.',
    quote:     'El invierno llegó. Yo lo esperé.',
    operation: 'Operación: Bastardo del Norte',
  },

  'geralt': {
    roleLine:  'El Lobo Blanco. Brujo de la Escuela del Lobo.',
    quote:     'El mal menor sigue siendo mal.',
    operation: 'Operación: Lobo Blanco',
  },

  // ── Luchadores ─────────────────────────────────────────────────────────────

  'ip-man': {
    roleLine:  'Gran Maestro del Wing Chun',
    quote:     'La fuerza sin disciplina es solo violencia.',
    operation: 'Operación: Fong Shun',
  },

  'rocky-balboa': {
    roleLine:  'El Semental Italiano. Campeón del mundo.',
    quote:     'No importa cuántas veces caés. Solo cuántas te levantás.',
    operation: 'Operación: Italian Stallion',
  },

  'kurt-sloane': {
    roleLine:  'Discípulo de Xian Chow. El americano del Muay Thai.',
    quote:     'El dolor es temporal. La victoria no.',
    operation: 'Operación: Bangkok',
  },

  'tony-ja': {
    roleLine:  'Guardián del Buda. Muay Boran. Sin armas.',
    quote:     'El cuerpo es el arma. La mente, el maestro.',
    operation: 'Operación: Ong-Bak',
  },

  // ── Sobrevivientes ─────────────────────────────────────────────────────────

  'terminator': {
    roleLine:  'T-800. Modelo 101. Misión: proteger.',
    quote:     "I'll be back.",
    operation: 'Operación: Skynet Zero',
  },
}
