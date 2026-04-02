/**
 * Static hint data for GuessPage — 3 levels per character.
 * Level 1: Psicológica  — inner drive, fear, worldview
 * Level 2: Conductual   — specific recurring behavior / action
 * Level 3: Contextual   — universe / setting detail
 *
 * revealPhrase: what the character "says" when unmasked (in Spanish, in-character)
 */
export const guessData = {

  'harry-potter': {
    hints: [
      { level: 'Psicológica', text: 'Lleva el peso del mundo en sus hombros desde niño, pero nunca lo buscó — simplemente no sabe cómo evitarlo.' },
      { level: 'Conductual',  text: 'En los momentos más oscuros, su instinto es proteger a otros antes que a sí mismo, aunque signifique sacrificarse.' },
      { level: 'Contextual',  text: 'Creció sin saber que era famoso, en un mundo donde la magia es real y los buenos y malos se dividen en casas.' },
    ],
    revealPhrase: '¿Lo sentiste? Hay algo en tu mirada que me recuerda a la primera vez que entré a Hogwarts.',
  },

  'gollum': {
    hints: [
      { level: 'Psicológica', text: 'Dos voces en una sola mente: una que desea ser redimido, y otra que no puede soltar lo que ama.' },
      { level: 'Conductual',  text: 'Sigue a su obsesión a través de montañas, ríos y siglos — ni el hambre ni el miedo lo detienen.' },
      { level: 'Contextual',  text: 'Vivió cientos de años en la oscuridad, corrompido por el objeto más poderoso de su mundo.' },
    ],
    revealPhrase: '¡Mi tesoro! ¡Lo encontró, lo encontró... el hobbit lo encontró!',
  },

  'john-wick': {
    hints: [
      { level: 'Psicológica', text: 'No busca poder ni gloria. Solo quería paz — pero el mundo no se lo dejó tener.' },
      { level: 'Conductual',  text: 'Cuando actúa, lo hace con una precisión clínica y una determinación que asusta incluso a los más peligrosos.' },
      { level: 'Contextual',  text: 'Salió del retiro porque alguien le quitó lo único que le quedaba: un recuerdo de la persona que amó.' },
    ],
    revealPhrase: 'Sabías que iba a llegar. Siempre llego.',
  },

  'walter-white': {
    hints: [
      { level: 'Psicológica', text: 'Comenzó diciendo que lo hacía por su familia. En el fondo, siempre lo hizo por sí mismo — y en el fondo lo sabe.' },
      { level: 'Conductual',  text: 'Cada decisión que toma tiene una lógica impecable. El problema es que la lógica lo fue cambiando sin que se diera cuenta.' },
      { level: 'Contextual',  text: 'Un hombre ordinario con un talento extraordinario encontró una salida que nunca debió tomar, en el desierto de Nuevo México.' },
    ],
    revealPhrase: 'Dije mi nombre una vez. Creo que ya sabés cuál es.',
  },

  'darth-vader': {
    hints: [
      { level: 'Psicológica', text: 'El miedo a perder lo que amaba lo destruyó — y convirtió esa destrucción en obediencia absoluta.' },
      { level: 'Conductual',  text: 'Su sola presencia silencia las habitaciones. Cada palabra que dice es una orden que nadie se atreve a cuestionar.' },
      { level: 'Contextual',  text: 'Fue el alumno más brillante de su maestro, antes de que el lado oscuro de una guerra galáctica lo reclamara.' },
    ],
    revealPhrase: 'Tu resistencia es inútil. Ya lo sabías antes de empezar.',
  },

  'tony-stark': {
    hints: [
      { level: 'Psicológica', text: 'Esconde una profunda inseguridad detrás de una confianza que podría llenar un estadio.' },
      { level: 'Conductual',  text: 'Su respuesta ante cualquier problema es construir algo mejor. No es arrogancia — es que realmente puede.' },
      { level: 'Contextual',  text: 'Heredó un imperio y lo convirtió en algo completamente distinto, después de una noche que cambió todo para siempre.' },
    ],
    revealPhrase: 'Honestamente, lo vi venir desde la primera pista. Soy un genio, ¿qué esperabas?',
  },

  'sherlock': {
    hints: [
      { level: 'Psicológica', text: 'El mundo le resulta aburrido casi todo el tiempo — excepto cuando hay un problema que nadie más puede resolver.' },
      { level: 'Conductual',  text: 'Observa detalles que otros ignoran y construye conclusiones en segundos, antes de que el interlocutor termine de hablar.' },
      { level: 'Contextual',  text: 'Vive en Baker Street con un compañero paciente, y su única adicción real no es química: es el misterio.' },
    ],
    revealPhrase: 'Elemental. Cuatro pistas eran demasiadas para llegar aquí.',
  },

  'jack-sparrow': {
    hints: [
      { level: 'Psicológica', text: 'Parece un caos andante, pero cada movimiento tiene una lógica — solo que nadie más la ve hasta que ya pasó.' },
      { level: 'Conductual',  text: 'Negocia con todo el mundo, traiciona a casi todos, y aun así termina siendo el que sale mejor parado.' },
      { level: 'Contextual',  text: 'Capitán sin barco más veces de las que puede contar, en un mundo donde los piratas son tan peligrosos como las mareas.' },
    ],
    revealPhrase: 'Ah, pero tú me encontraste a mí. O eso creías. ¿Entendiste la diferencia?',
  },

  'gandalf': {
    hints: [
      { level: 'Psicológica', text: 'Carga con siglos de conocimiento, pero elige mostrarse como un viejo excéntrico para que los demás crezcan solos.' },
      { level: 'Conductual',  text: 'Sus intervenciones siempre llegan justo a tiempo — ni antes, ni después — y siempre cambian el curso de las cosas.' },
      { level: 'Contextual',  text: 'Guió a un grupo de inadaptados a través de un mundo en crisis, porque nadie más podía — o quería — hacerlo.' },
    ],
    revealPhrase: 'Un mago nunca llega tarde, ni temprano. Llega precisamente cuando lo encontrás.',
  },

  'ip-man': {
    hints: [
      { level: 'Psicológica', text: 'Su humildad no es performance — genuinamente no le interesa el reconocimiento, solo la práctica correcta.' },
      { level: 'Conductual',  text: 'Cuando enfrenta a diez adversarios a la vez, no hay urgencia en sus movimientos. Hay convicción.' },
      { level: 'Contextual',  text: 'Vivió la invasión de su ciudad natal y eligió preservar su arte por encima de su orgullo nacional.' },
    ],
    revealPhrase: 'El combate revela el carácter. El tuyo era curioso — me alegra haberlo visto.',
  },

  'el-profesor': {
    hints: [
      { level: 'Psicológica', text: 'Para él, todo es un sistema — y los sistemas tienen fallas que se pueden explotar con paciencia.' },
      { level: 'Conductual',  text: 'Planifica durante años lo que otros improvizan en días, y aun así deja espacio para el caos controlado.' },
      { level: 'Contextual',  text: 'Diseñó el robo más ambicioso de la historia reciente desde una posición que nadie sospecharía jamás.' },
    ],
    revealPhrase: 'Todo estaba calculado. Incluso esta conversación.',
  },

  'capitan-flint': {
    hints: [
      { level: 'Psicológica', text: 'La codicia y el miedo se mezclaron en él hasta que ya no podía distinguir qué lo movía más.' },
      { level: 'Conductual',  text: 'Ocultó su mayor tesoro tan bien que ni sus aliados más cercanos lo encontraron después de su muerte.' },
      { level: 'Contextual',  text: 'Su leyenda aterró a marineros durante generaciones en los mares del Caribe del siglo XVIII.' },
    ],
    revealPhrase: '¡Pedazos de ocho! ¿Pensabas que podías atrapar al capitán Flint tan fácil?',
  },

  'jax-teller': {
    hints: [
      { level: 'Psicológica', text: 'Cargó toda la vida con la identidad de su padre y pasó años tratando de entender si quería honrarla o escapar de ella.' },
      { level: 'Conductual',  text: 'Sus decisiones más difíciles siempre involucran una tensión entre el código de su grupo y las personas que ama.' },
      { level: 'Contextual',  text: 'Lidera una hermandad de motoristas en California, en un universo donde la lealtad tiene un precio muy alto.' },
    ],
    revealPhrase: 'La familia es todo. Aunque te destruya por dentro.',
  },

  'nathan-algren': {
    hints: [
      { level: 'Psicológica', text: 'Un hombre roto por lo que hizo en nombre de órdenes que nunca debió seguir, buscando algo en lo que pueda creer.' },
      { level: 'Conductual',  text: 'Su transformación no fue gradual — fue una rendición total a una forma de vida radicalmente distinta a la suya.' },
      { level: 'Contextual',  text: 'Un soldado americano que encontró más honor en el Japón feudal que en el ejército que lo formó.' },
    ],
    revealPhrase: 'Todavía recuerdo el campo aquel. Hay cosas que el tiempo no borra.',
  },

  'lara-croft': {
    hints: [
      { level: 'Psicológica', text: 'La aventura no es solo lo que hace — es la única forma en que sabe procesar el mundo y a sí misma.' },
      { level: 'Conductual',  text: 'Combina conocimiento académico con una capacidad de improvisación bajo presión que desafía toda lógica.' },
      { level: 'Contextual',  text: 'Heredó una herramienta financiera extraordinaria pero prefiere las catacumbas y los misterios sin resolver.' },
    ],
    revealPhrase: 'No te hice fácil. Pero eso es lo que me gusta de los rompecabezas.',
  },

  'spider-man': {
    hints: [
      { level: 'Psicológica', text: 'La culpa lo define casi tanto como el poder — y sigue eligiendo cargarlo en lugar de soltarlo.' },
      { level: 'Conductual',  text: 'Lanza comentarios en medio del peligro como mecanismo de defensa, pero pocos saben lo solo que se siente después.' },
      { level: 'Contextual',  text: 'Un adolescente de Nueva York aprendió la lección más difícil de las maneras más evitables posibles.' },
    ],
    revealPhrase: 'Con un gran poder viene... bueno, ya sabés. Igual me alegra que lo hayas adivinado.',
  },

  'terminator': {
    hints: [
      { level: 'Psicológica', text: 'No tiene miedo. No tiene dudas. Solo tiene un objetivo, y el tiempo es irrelevante para lograrlo.' },
      { level: 'Conductual',  text: 'Aprende patrones humanos con una eficiencia que puede parecer empatía pero es pura funcionalidad.' },
      { level: 'Contextual',  text: 'Vino desde el futuro para cambiar un momento del pasado — aunque no siempre con el mismo propósito.' },
    ],
    revealPhrase: 'Correcto. Hasta la vista.',
  },

  'ragnar-lothbrok': {
    hints: [
      { level: 'Psicológica', text: 'Mientras sus contemporáneos veían enemigos, él veía mundos por explorar. Esa curiosidad lo hizo grande — y peligroso.' },
      { level: 'Conductual',  text: 'Desafía a los dioses y a los reyes con la misma calma que usa para contemplar el mar.' },
      { level: 'Contextual',  text: 'Un granjero escandinavo que se convirtió en rey siguiendo visiones de tierras que nadie de su pueblo había pisado.' },
    ],
    revealPhrase: 'El destino es real. Solo que tarda en hacerse visible.',
  },

  'leonidas': {
    hints: [
      { level: 'Psicológica', text: 'No teme a la muerte — la ve como la última demostración de todo lo que creyó en vida.' },
      { level: 'Conductual',  text: 'Su liderazgo no se apoya en la jerarquía sino en el ejemplo: él siempre está en la primera línea.' },
      { level: 'Contextual',  text: 'Lideró a un puñado de guerreros contra un ejército infinito en un paso de montaña que hoy todavía se recuerda.' },
    ],
    revealPhrase: 'Esto es lo que hacemos. Lo que siempre hicimos.',
  },

  'tommy-shelby': {
    hints: [
      { level: 'Psicológica', text: 'Fuma, planea, y cuando todos creen que perdió el control, demuestra que era exactamente lo que quería.' },
      { level: 'Conductual',  text: 'No separa los negocios de la familia — para él, son exactamente la misma cosa.' },
      { level: 'Contextual',  text: 'Volvió de la guerra con algo roto adentro, y lo convirtió en el arma más afilada de una ciudad industrial inglesa.' },
    ],
    revealPhrase: 'Por orden de los Peaky Blinders. Ya era hora.',
  },

  'eleven': {
    hints: [
      { level: 'Psicológica', text: 'Creció sin nombre, sin familia y sin libertad — y aun así eligió proteger a los que la encontraron.' },
      { level: 'Conductual',  text: 'Cuando algo la desborda emocionalmente, el mundo a su alrededor siente la consecuencia.' },
      { level: 'Contextual',  text: 'Escapó de un laboratorio secreto para encontrar amigos en un pueblo pequeño con secretos más grandes todavía.' },
    ],
    revealPhrase: 'Amigos no mienten. Y yo sabía que ibas a llegar.',
  },

  'geralt': {
    hints: [
      { level: 'Psicológica', text: 'Prefiere el silencio al drama, pero el drama lo encuentra igual — y siempre termina en medio.' },
      { level: 'Conductual',  text: 'Adopta una neutralidad que irrita a todos, pero que en el fondo esconde un código moral más rígido de lo que parece.' },
      { level: 'Contextual',  text: 'Cazador de monstruros en un mundo donde a veces los más peligrosos tienen forma humana.' },
    ],
    revealPhrase: 'Hmm. Bien jugado.',
  },

  'jon-snow': {
    hints: [
      { level: 'Psicológica', text: 'Tiene el peso de una identidad que desconoce, y aun así actúa con una convicción que pocos en su mundo igualan.' },
      { level: 'Conductual',  text: 'Siempre elige el camino más difícil, no por heroísmo sino porque genuinamente no puede hacer otra cosa.' },
      { level: 'Contextual',  text: 'Juró guardar el límite más frío del norte, en un reino donde el invierno puede durar generaciones.' },
    ],
    revealPhrase: 'No sé mucho. Pero sabía que ibas a llegar.',
  },

  'kurt-sloane': {
    hints: [
      { level: 'Psicológica', text: 'Tiene algo que demostrarle al mundo, a su familia, y sobre todo a sí mismo — y lo hará sin importar el costo.' },
      { level: 'Conductual',  text: 'Su entrenamiento se mide en sacrificio físico y mental. Cada sesión es un acto de fe hacia algo que otros no ven.' },
      { level: 'Contextual',  text: 'Compitió en el torneo de artes marciales más duro del mundo para limpiar el nombre de alguien que amaba.' },
    ],
    revealPhrase: 'La sangre, el sudor... todo valió la pena para llegar aquí.',
  },

  'venom': {
    hints: [
      { level: 'Psicológica', text: 'Coexiste con otro ser dentro de sí mismo — y la línea entre identidades es cada vez más difusa.' },
      { level: 'Conductual',  text: 'Su agresividad tiene una lógica propia: protege a los que considera suyos con una ferocidad que asusta.' },
      { level: 'Contextual',  text: 'Un simbionte extraterrestre encontró a un periodista fracasado y juntos formaron algo que nadie esperaba.' },
    ],
    revealPhrase: '¡Somos Venom! Y te encontramos.',
  },

  'furiosa': {
    hints: [
      { level: 'Psicológica', text: 'Todo lo que hace tiene un propósito único y antiguo. No busca venganza — busca devolver algo robado.' },
      { level: 'Conductual',  text: 'No habla más de lo necesario. Cuando actúa, actúa con una precisión que viene de años de esperar el momento correcto.' },
      { level: 'Contextual',  text: 'Conduce el vehículo más poderoso del desierto postapocalíptico hacia una libertad que sabe que existe.' },
    ],
    revealPhrase: 'No hay ida. Solo el camino de vuelta. Bien por haberme encontrado.',
  },

  'alice': {
    hints: [
      { level: 'Psicológica', text: 'Sus recuerdos fueron borrados más de una vez, pero su identidad persistió — y eso la hace más peligrosa que cualquier arma.' },
      { level: 'Conductual',  text: 'Combate con una eficiencia sobrehumana que es tanto entrenamiento como consecuencia de algo que le hicieron.' },
      { level: 'Contextual',  text: 'Sobrevivió al experimento de una corporación que convirtió el mundo en una catástrofe biológica.' },
    ],
    revealPhrase: 'Me llamo Alice. Y lo recuerdo todo.',
  },

  'katniss': {
    hints: [
      { level: 'Psicológica', text: 'No quería ser símbolo de nada. Solo quería que los suyos vivieran. El mundo decidió otra cosa por ella.' },
      { level: 'Conductual',  text: 'Su habilidad técnica es innegable, pero lo que la distingue es que nunca actúa por gloria — siempre por alguien específico.' },
      { level: 'Contextual',  text: 'Se ofreció voluntaria en un espectáculo de vida o muerte televisado que una nación entera mira obligada.' },
    ],
    revealPhrase: 'El sinsajo vuela cuando elige hacerlo. Y yo elegí.',
  },

  'bryan-mills': {
    hints: [
      { level: 'Psicológica', text: 'Lleva años tratando de compensar el tiempo que no estuvo. La culpa lo convierte en algo imparable cuando se activa.' },
      { level: 'Conductual',  text: 'Habla poco y actúa mucho. Cuando da un aviso, es exactamente eso — un aviso, no una amenaza vacía.' },
      { level: 'Contextual',  text: 'Sus años trabajando para agencias de inteligencia le dieron un conjunto de habilidades muy concretas y muy peligrosas.' },
    ],
    revealPhrase: 'Te dije que te iba a encontrar. Siempre lo hago.',
  },

  'frank-martin': {
    hints: [
      { level: 'Psicológica', text: 'Vive por sus reglas — no porque sea inflexible, sino porque las reglas son la única cosa que lo separa del caos.' },
      { level: 'Conductual',  text: 'Cuando algo sale de los límites del contrato, no lo ignora. Pero tampoco pregunta de más.' },
      { level: 'Contextual',  text: 'Transporta lo que le piden en el sur de Francia, con una precisión casi artística y sin preguntar el contenido.' },
    ],
    revealPhrase: 'Tres reglas. Esta partida fue limpia. Bien.',
  },

  'rocky-balboa': {
    hints: [
      { level: 'Psicológica', text: 'No pelea para ganar — pelea para demostrar que no se rinde. Esa distinción lo separa de todos los demás.' },
      { level: 'Conductual',  text: 'Soporta más golpes de los que ningún médico aprobaría, porque lo que está probando no es físico.' },
      { level: 'Contextual',  text: 'Un boxeador de barrio en Filadelfia tuvo una oportunidad que nadie esperaba — y la convirtió en leyenda.' },
    ],
    revealPhrase: 'Yo no soy el más rápido ni el más fuerte. Pero estoy aquí todavía.',
  },

  'tony-ja': {
    hints: [
      { level: 'Psicológica', text: 'Su arte es espiritual antes que violento. Cada golpe tiene una historia cultural detrás.' },
      { level: 'Conductual',  text: 'No usa cables, no usa trucos. Lo que ves en combate es exactamente lo que entrenó durante años.' },
      { level: 'Contextual',  text: 'Surgió de Tailandia para mostrarle al mundo un arte marcial antiguo que casi nadie había visto en el cine.' },
    ],
    revealPhrase: 'El cuerpo habla cuando las palabras no alcanzan.',
  },

  'james-bond': {
    hints: [
      { level: 'Psicológica', text: 'El encanto es su primera arma, pero esconde una soledad que ninguna misión llega a llenar del todo.' },
      { level: 'Conductual',  text: 'Improvisa con elegancia, como si el peligro fuera un inconveniente menor en su agenda del día.' },
      { level: 'Contextual',  text: 'Agente al servicio de Su Majestad, licencia para matar, y un traje impecable en las peores situaciones imaginables.' },
    ],
    revealPhrase: 'Bond. James Bond. Tardaste un poco, pero llegaste.',
  },

  'la-novia': {
    hints: [
      { level: 'Psicológica', text: 'Su furia no es impulsiva — es la más paciente y calculada que existe, porque lleva años esperando este momento.' },
      { level: 'Conductual',  text: 'Tiene una lista. No es metáfora. Cada nombre tiene un significado que la mantiene en movimiento.' },
      { level: 'Contextual',  text: 'La dejaron por muerta en el día más importante de su vida. Se levantó y empezó a cobrar.' },
    ],
    revealPhrase: 'Cruzo el nombre. Siguiente.',
  },

  'tyler-durden': {
    hints: [
      { level: 'Psicológica', text: 'Es la manifestación de todo lo que alguien reprimió — la libertad que da miedo porque implica destrucción.' },
      { level: 'Conductual',  text: 'Habla con una convicción perturbadora sobre el consumismo, la identidad y el sistema — y tiene razón en algunas cosas.' },
      { level: 'Contextual',  text: 'Nació en la mente de alguien que no podía dormir, en un mundo de catálogos de muebles y trabajos vacíos.' },
    ],
    revealPhrase: 'La primera regla es no hablar de esto. Pero ya que llegaste...',
  },

  'hannibal': {
    hints: [
      { level: 'Psicológica', text: 'Tiene una cortesía impecable que lo hace más inquietante: nadie debería ser tan refinado y tan oscuro al mismo tiempo.' },
      { level: 'Conductual',  text: 'Cada interacción es un análisis. Te está leyendo mientras habla — y ya sabe más de vos de lo que esperabas.' },
      { level: 'Contextual',  text: 'Psiquiatra eminente con un gusto culinario que mezcla alta gastronomía con algo que nadie debería saber.' },
    ],
    revealPhrase: 'Qué placer. Pasemos al plato principal de la conversación.',
  },

  'norman-bates': {
    hints: [
      { level: 'Psicológica', text: 'La figura que más lo formó sigue viviendo dentro de él de maneras que él mismo no comprende del todo.' },
      { level: 'Conductual',  text: 'Es tímido, servicial y aparentemente inofensivo — hasta que algo lo desencadena desde adentro.' },
      { level: 'Contextual',  text: 'Administra un motel en una ruta solitaria, donde los huéspedes a veces no completan su estadía.' },
    ],
    revealPhrase: 'Madre... madre, hay alguien que... espere. Bienvenido al Motel Bates.',
  },

  'wolverine': {
    hints: [
      { level: 'Psicológica', text: 'La inmortalidad no es un regalo para él — es la condena de ver a todos los que quiere desaparecer primero.' },
      { level: 'Conductual',  text: 'Su agresividad viene de adentro, pero lo que más lo mueve no es la rabia sino una lealtad feroz e incondicional.' },
      { level: 'Contextual',  text: 'Tiene un pasado fragmentado, garras de un metal casi indestructible, y décadas de historia que nadie le devolvió.' },
    ],
    revealPhrase: 'Soy el mejor en lo que hago. Y lo que hago no es bonito.',
  },

  'john-mcclane': {
    hints: [
      { level: 'Psicológica', text: 'No es un héroe — es un tipo común que tiene el talento de estar en el lugar equivocado en el momento equivocado.' },
      { level: 'Conductual',  text: 'Se queja todo el tiempo que actúa. Eso no lo detiene, pero que conste en actas que le parece una locura.' },
      { level: 'Contextual',  text: 'Un detective de Nueva York pasó una Nochebuena en un rascacielos que alguien más tenía otros planes para usar.' },
    ],
    revealPhrase: 'Yippee-ki-yay. Bienvenido a la party.',
  },

  'iko-uwais': {
    hints: [
      { level: 'Psicológica', text: 'Entra a cada situación imposible no por ambición ni gloria, sino porque hay alguien esperándolo en casa que no puede fallar.' },
      { level: 'Conductual',  text: 'Pelea con una eficiencia casi quirúrgica — cada movimiento tiene un propósito, nada sobra, nada se desperdicia.' },
      { level: 'Contextual',  text: 'Un policía indonesio quedó atrapado en un edificio de quince pisos controlado por criminales y tuvo que subir piso por piso para salir.' },
    ],
    revealPhrase: 'El edificio tenía quince pisos. Subí todos.',
  },

  'ethan-hunt': {
    hints: [
      { level: 'Psicológica', text: 'Confía en muy pocas personas — y con razón: en su mundo cualquiera puede ser un topo, incluso alguien del propio equipo.' },
      { level: 'Conductual',  text: 'Hace las cosas a pie, en moto, colgado de aviones. No porque sea temerario — porque calcula que el riesgo personal es menor que el riesgo de fallar.' },
      { level: 'Contextual',  text: 'Trabaja para una agencia que lo niega si lo atrapan. Cada misión empieza con un mensaje que se autodestruye.' },
    ],
    revealPhrase: 'Buenos días. Su misión, si decide aceptarla...',
  },

  superman: {
    hints: [
      { level: 'Psicológica', text: 'Carga con el peso de ser el último de su especie y con la esperanza que millones depositan en él cada día — y lo hace igual.' },
      { level: 'Conductual',  text: 'Tiene poder para dominar el mundo, pero elige ayudar. No por ingenuidad: por convicción. Esa diferencia lo define.' },
      { level: 'Contextual',  text: 'Llegó a la Tierra como bebé desde un planeta destruido, creció en Kansas y esconde su identidad detrás de unos anteojos y una redacción de noticias.' },
    ],
    revealPhrase: '¿Esperabas a alguien que pudiera volar?',
  },

}
