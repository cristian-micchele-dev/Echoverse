// ─── parecidoQuiz.js ────────────────────────────────────────────────────────
// Datos, perfiles y funciones de scoring para el modo "¿A qué personaje te pareces?"
//
// 5 dimensiones (valores 1–4):
//   moral   1=héroe puro          2=antihéroe/redención  3=gris/ambiguo       4=villano/oscuro
//   metodo  1=cerebral/analítico  2=estratégico/táctico  3=fuerza directa     4=manipulación/caos
//   social  1=lobo solitario      2=equipo pequeño/leal  3=líder/causa        4=figura de poder
//   emocion 1=frío/calculador     2=controlado/sereno    3=apasionado/intenso 4=impulsivo/volátil
//   mundo   1=fantasía/misticismo 2=intriga/crimen       3=acción/combate     4=tecnología/modernidad
// ─────────────────────────────────────────────────────────────────────────────

// ── Pool de 50 preguntas — se eligen 15 al azar en cada partida ──────────────
export const QUESTION_POOL = [
  {
    id: 1,
    text: 'Ante una injusticia grave, ¿qué hacés?',
    options: [
      { label: 'La denuncio aunque me cueste caro — alguien tiene que hacerlo.', vector: { moral: 1, social: 3 } },
      { label: 'Busco la forma más inteligente de revertirla sin exponerme de más.', vector: { moral: 2, metodo: 1 } },
      { label: 'La aprovecho a mi favor si puedo. No es mi problema resolverla.', vector: { moral: 3, metodo: 4 } },
      { label: 'Destruyo el sistema que la genera, aunque todo se prenda fuego.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 2,
    text: 'Un problema difícil aparece. Tu primer instinto:',
    options: [
      { label: 'Analizar cada variable hasta entender el patrón completo.', vector: { metodo: 1 } },
      { label: 'Tener un plan claro y ejecutarlo con precisión.', vector: { metodo: 2 } },
      { label: 'Entrar directo — confío en mis reflejos y mi cuerpo.', vector: { metodo: 3 } },
      { label: 'Improvisar. El caos es mi elemento, no mi enemigo.', vector: { metodo: 4 } },
    ],
  },
  {
    id: 3,
    text: '¿Con quién preferís trabajar?',
    options: [
      { label: 'Solo. Nadie me frena ni me compromete.', vector: { social: 1 } },
      { label: 'Con un grupo pequeño en quien confío ciegamente.', vector: { social: 2 } },
      { label: 'Liderando una causa más grande que yo mismo.', vector: { social: 3 } },
      { label: 'Con gente que ejecuta mis decisiones — yo conduzco.', vector: { social: 4 } },
    ],
  },
  {
    id: 4,
    text: 'Alguien te ataca sin aviso. ¿Qué sentís primero?',
    options: [
      { label: 'Nada. Ya estoy calculando la respuesta óptima.', vector: { emocion: 1, metodo: 1 } },
      { label: 'Calma. Conozco este tipo de situaciones.', vector: { emocion: 2 } },
      { label: 'Un fuego que me impulsa hacia adelante.', vector: { emocion: 3 } },
      { label: 'Adrenalina pura — actúo antes de terminar de pensar.', vector: { emocion: 4 } },
    ],
  },
  {
    id: 5,
    text: '¿Qué escenario te llama más?',
    options: [
      { label: 'Un mundo de magia, profecías y misterios antiguos.', vector: { mundo: 1 } },
      { label: 'El submundo criminal, política sucia y traición entre sombras.', vector: { mundo: 2 } },
      { label: 'Campos de batalla, persecuciones, combate real.', vector: { mundo: 3 } },
      { label: 'El futuro — tecnología, IA y poder sin límite aparente.', vector: { mundo: 4 } },
    ],
  },
  {
    id: 6,
    text: '¿Cuál es tu mayor fortaleza?',
    options: [
      { label: 'Mi mente. Soy más inteligente que casi cualquiera en la sala.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Mi instinto estratégico — veo el tablero mientras otros ven una pieza.', vector: { metodo: 2 } },
      { label: 'Mi cuerpo y mi determinación — no me rindo, no me canso.', vector: { metodo: 3, emocion: 3 } },
      { label: 'Mi capacidad de conectar con la gente o de manipularla según convenga.', vector: { metodo: 4, social: 4 } },
    ],
  },
  {
    id: 7,
    text: 'Perdiste algo o a alguien importante. ¿Cómo reaccionás?',
    options: [
      { label: 'Me rompo por dentro pero no lo muestro. Sigo adelante.', vector: { emocion: 1 } },
      { label: 'Lo proceso con calma y encuentro cómo seguir.', vector: { emocion: 2 } },
      { label: 'El dolor se convierte en combustible — peleo más fuerte.', vector: { emocion: 3, moral: 2 } },
      { label: 'Exploto. Y el mundo lo va a sentir conmigo.', vector: { emocion: 4 } },
    ],
  },
  {
    id: 8,
    text: 'En un conflicto, ¿cuál sería tu rol ideal?',
    options: [
      { label: 'El estratega que diseña el plan sin disparar un tiro.', vector: { metodo: 2, social: 4 } },
      { label: 'El especialista que entra y sale sin que nadie lo vea.', vector: { metodo: 2, social: 1 } },
      { label: 'El que abre la puerta de una patada cuando ya no hay tiempo.', vector: { metodo: 3, social: 1 } },
      { label: 'El líder visible que inspira a otros a moverse.', vector: { social: 3, emocion: 3 } },
    ],
  },
  {
    id: 9,
    text: '¿Qué significa la lealtad para vos?',
    options: [
      { label: 'Es absoluta — doy la vida por los míos sin pensarlo.', vector: { moral: 1, social: 2, emocion: 3 } },
      { label: 'Es una herramienta — funciona mientras conviene a ambas partes.', vector: { moral: 3, metodo: 4 } },
      { label: 'Es mi código — tiene reglas que no negocio con nadie.', vector: { moral: 2, social: 1 } },
      { label: 'Es para el débil. Solo me debo a mí mismo y a mi objetivo.', vector: { moral: 4, social: 1 } },
    ],
  },
  {
    id: 10,
    text: 'Ante una regla que considerás injusta:',
    options: [
      { label: 'La cumplo — el sistema, aunque imperfecto, es necesario.', vector: { moral: 1, social: 4 } },
      { label: 'La rodeo con elegancia sin violarla explícitamente.', vector: { moral: 2, metodo: 2 } },
      { label: 'La ignoro directamente si interfiere con lo que tengo que hacer.', vector: { moral: 3, metodo: 3 } },
      { label: 'La destruyo activamente — las reglas son cadenas del sistema.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 11,
    text: '¿Cómo es tu relación con el poder?',
    options: [
      { label: 'Lo rechazo — prefiero la libertad a la responsabilidad de mandar.', vector: { social: 1, moral: 1 } },
      { label: 'Lo acepto cuando la situación lo exige, aunque me incomoda.', vector: { social: 3, moral: 2 } },
      { label: 'Lo construyo con cuidado — el poder es protección, no ego.', vector: { social: 4, metodo: 2 } },
      { label: 'Lo busco. Es lo único que importa cuando todo lo demás falla.', vector: { social: 4, moral: 4 } },
    ],
  },
  {
    id: 12,
    text: '¿Cómo preferís que te recuerden?',
    options: [
      { label: 'Como alguien que hizo lo correcto cuando nadie más lo haría.', vector: { moral: 1, emocion: 3 } },
      { label: 'Como el más inteligente de la habitación.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Como una leyenda — por lo que logré, no por cómo lo hice.', vector: { moral: 3, emocion: 3 } },
      { label: 'No me importa que me recuerden — actué, eso es suficiente.', vector: { moral: 2, emocion: 2 } },
    ],
  },
  {
    id: 13,
    text: 'Alguien traiciona tu confianza. ¿Qué hacés?',
    options: [
      { label: 'Le doy una segunda oportunidad — todos merecen una chance.', vector: { moral: 1, emocion: 2 } },
      { label: 'Corto el vínculo en silencio. Sin drama, sin explicaciones.', vector: { emocion: 1, social: 1 } },
      { label: 'Cobro lo que me deben, de una forma u otra.', vector: { moral: 3, metodo: 3 } },
      { label: 'Lo convierto en un ejemplo para que nadie más se atreva.', vector: { moral: 4, social: 4 } },
    ],
  },
  {
    id: 14,
    text: 'Si pudieras elegir un lugar para vivir, ¿cuál sería?',
    options: [
      { label: 'Un castillo o bosque antiguo, lleno de historia y secretos.', vector: { mundo: 1 } },
      { label: 'Una ciudad oscura, donde los que mandan hacen tratos en las sombras.', vector: { mundo: 2 } },
      { label: 'Una zona de entrenamiento o campo de operaciones — siempre listo.', vector: { mundo: 3 } },
      { label: 'Una metrópolis de vanguardia, llena de tecnología y posibilidades.', vector: { mundo: 4 } },
    ],
  },
  {
    id: 15,
    text: 'Cuando tomás una decisión difícil, ¿qué pesa más?',
    options: [
      { label: 'Lo que es moralmente correcto, sin importar el costo personal.', vector: { moral: 1 } },
      { label: 'Lo que es más inteligente según el contexto.', vector: { metodo: 1 } },
      { label: 'Lo que protege a los que quiero.', vector: { moral: 2, social: 2 } },
      { label: 'Lo que me da más poder o ventaja a largo plazo.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 16,
    text: 'Alguien que no conocés te pide ayuda en un momento de peligro. ¿Qué hacés?',
    options: [
      { label: 'La ayudo sin pensarlo — es lo correcto.', vector: { moral: 1, social: 2 } },
      { label: 'Evalúo si puedo hacerlo sin comprometer mis objetivos.', vector: { moral: 2, metodo: 2 } },
      { label: 'Depende de qué me ofrece a cambio.', vector: { moral: 3 } },
      { label: 'No tengo tiempo para los problemas ajenos.', vector: { social: 1, moral: 4 } },
    ],
  },
  {
    id: 17,
    text: 'Estás solo en una situación de peligro extremo. ¿Cuál es tu primer movimiento?',
    options: [
      { label: 'Analizar salidas y calcular la mejor opción.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Buscar una posición defensiva y esperar el momento justo.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Atacar primero — la ofensiva es la mejor defensa.', vector: { metodo: 3, emocion: 3 } },
      { label: 'Improvisar con lo que haya — funciona siempre.', vector: { metodo: 4, emocion: 4 } },
    ],
  },
  {
    id: 18,
    text: 'Te ofrecen poder a cambio de algo cuestionable moralmente. ¿Qué hacés?',
    options: [
      { label: 'Lo rechazo de plano — no tiene precio.', vector: { moral: 1 } },
      { label: 'Negocio para reducir el daño moral al mínimo.', vector: { moral: 2, metodo: 2 } },
      { label: 'Lo acepto si el beneficio justifica el costo.', vector: { moral: 3 } },
      { label: 'Lo acepto y además busco sacar más ventaja.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 19,
    text: '¿Cómo manejás el fracaso?',
    options: [
      { label: 'Lo analizo exhaustivamente hasta entender exactamente qué falló.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Lo proceso y veo qué puedo cambiar para la próxima.', vector: { emocion: 2 } },
      { label: 'Me levanto y vuelvo a intentarlo — la perseverancia lo es todo.', vector: { emocion: 3, metodo: 3 } },
      { label: 'Busco al responsable — el fracaso no fue solo mío.', vector: { emocion: 4 } },
    ],
  },
  {
    id: 20,
    text: 'Alguien más poderoso que vos te amenaza. ¿Qué hacés?',
    options: [
      { label: 'Mantengo la postura — nadie me intimida sin consecuencias.', vector: { moral: 1, emocion: 3 } },
      { label: 'Finjo ceder y planifico mi respuesta desde las sombras.', vector: { metodo: 4, emocion: 1 } },
      { label: 'Contraataco directamente — la mejor defensa es el ataque.', vector: { metodo: 3, emocion: 4 } },
      { label: 'Evalúo si puedo convertirlo en aliado antes de enfrentarlo.', vector: { metodo: 2, social: 3 } },
    ],
  },
  {
    id: 21,
    text: '¿Qué valorás más en una persona?',
    options: [
      { label: 'Su honestidad, aunque duela.', vector: { moral: 1 } },
      { label: 'Su inteligencia y capacidad de adaptación.', vector: { metodo: 1 } },
      { label: 'Su lealtad incondicional hacia los suyos.', vector: { social: 2, moral: 2 } },
      { label: 'Su eficiencia — que haga lo que dice sin excusas.', vector: { metodo: 2, emocion: 1 } },
    ],
  },
  {
    id: 22,
    text: 'Tenés información que podría dañar a alguien pero salvar a otros. ¿Qué hacés?',
    options: [
      { label: 'La comparto — la verdad tiene que salir.', vector: { moral: 1, social: 3 } },
      { label: 'La evalúo según el contexto antes de actuar.', vector: { metodo: 2, emocion: 2 } },
      { label: 'La guardo y la uso en el momento más conveniente.', vector: { metodo: 4, moral: 3 } },
      { label: 'La uso para negociar una posición ventajosa.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 23,
    text: '¿Cómo tomás decisiones bajo presión extrema?',
    options: [
      { label: 'Me detengo y analizo todo antes de moverme.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Sigo el plan — la presión no cambia el objetivo.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Actúo por instinto — no hay tiempo para pensar.', vector: { metodo: 3, emocion: 4 } },
      { label: 'Me crezco — la presión me hace mejor.', vector: { emocion: 3, metodo: 3 } },
    ],
  },
  {
    id: 24,
    text: 'Tenés que elegir entre salvar a muchos desconocidos o a un ser querido. ¿Qué hacés?',
    options: [
      { label: 'Salvo a los muchos — es la decisión correcta aunque duela.', vector: { moral: 1, emocion: 1 } },
      { label: 'Salvo a mi ser querido — la lealtad personal es primero.', vector: { social: 2, emocion: 3 } },
      { label: 'Busco una tercera opción — no acepto ese dilema.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Tomo la decisión más fría y eficiente sin involucrar emociones.', vector: { emocion: 1, metodo: 1 } },
    ],
  },
  {
    id: 25,
    text: 'Te encontrás con un recurso valioso que nadie sabe que existe. ¿Qué hacés?',
    options: [
      { label: 'Lo reporto o lo devuelvo a quien corresponde.', vector: { moral: 1 } },
      { label: 'Lo guardo — nadie tiene por qué saberlo.', vector: { moral: 3, social: 1 } },
      { label: 'Lo comparto con los que me importan.', vector: { social: 2, moral: 2 } },
      { label: 'Lo uso para conseguir poder e influencia.', vector: { moral: 4, social: 4 } },
    ],
  },
  {
    id: 26,
    text: '¿Cuál es tu definición de victoria?',
    options: [
      { label: 'Lograr el objetivo sin comprometer mis valores.', vector: { moral: 1, metodo: 2 } },
      { label: 'Terminar el trabajo con el menor daño posible.', vector: { moral: 2, metodo: 1 } },
      { label: 'Ganar, sin importar cómo — los medios los justifica el fin.', vector: { moral: 4 } },
      { label: 'Sobrevivir y aprender para la próxima.', vector: { emocion: 2, metodo: 2 } },
    ],
  },
  {
    id: 27,
    text: '¿Cuál es tu actitud ante el riesgo?',
    options: [
      { label: 'Lo calculo antes de tomarlo — el riesgo sin análisis es estupidez.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Lo acepto si el beneficio potencial lo justifica.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Me atrae — el riesgo es donde me siento vivo.', vector: { emocion: 3 } },
      { label: 'La victoria real es la que no tiene costo — evito el riesgo innecesario.', vector: { metodo: 2, emocion: 1 } },
    ],
  },
  {
    id: 28,
    text: 'Un enemigo te pide tregua. ¿Qué hacés?',
    options: [
      { label: 'La acepto — siempre es preferible la paz al conflicto.', vector: { moral: 1, emocion: 2 } },
      { label: 'La negocio con condiciones claras y verificables.', vector: { metodo: 2, moral: 2 } },
      { label: 'La acepto en la superficie pero sigo mis planes.', vector: { metodo: 4, moral: 3 } },
      { label: 'La rechazo — no confío en enemigos que piden tregua.', vector: { emocion: 3, moral: 2 } },
    ],
  },
  {
    id: 29,
    text: '¿Cómo preferís aprender algo nuevo?',
    options: [
      { label: 'Estudiando en profundidad — quiero entender la teoría completa.', vector: { metodo: 1 } },
      { label: 'Observando y planificando antes de intentar.', vector: { metodo: 2 } },
      { label: 'Practicando directamente, aunque me equivoque.', vector: { metodo: 3, emocion: 3 } },
      { label: 'Rompiéndolo para ver cómo funciona por dentro.', vector: { metodo: 4, emocion: 4 } },
    ],
  },
  {
    id: 30,
    text: 'Alguien te insultó públicamente. ¿Cómo respondés?',
    options: [
      { label: 'Con calma y una respuesta que lo deja en ridículo.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Lo ignoro — no le doy importancia a eso.', vector: { emocion: 2, social: 1 } },
      { label: 'Le devuelvo el golpe ahí mismo, en el momento.', vector: { emocion: 3, metodo: 3 } },
      { label: 'Guardo silencio y me encargo después, cuando nadie mire.', vector: { metodo: 4, emocion: 1 } },
    ],
  },
  {
    id: 31,
    text: '¿Qué tipo de historia te engancha más?',
    options: [
      { label: 'Una épica de redención con héroes que caen y se levantan.', vector: { moral: 1, emocion: 3 } },
      { label: 'Un thriller de espías con traiciones y dobles juegos.', vector: { metodo: 2, mundo: 2 } },
      { label: 'Acción pura — peleas, explosiones y adrenalina sin freno.', vector: { mundo: 3, emocion: 4 } },
      { label: 'Un thriller psicológico donde nadie es lo que parece.', vector: { metodo: 1, mundo: 2 } },
    ],
  },
  {
    id: 32,
    text: 'Tenés que elegir entre dos misiones: una segura con resultado medio o una peligrosa con resultado extraordinario. ¿Cuál elegís?',
    options: [
      { label: 'La segura — el resultado garantizado vale más que la gloria.', vector: { metodo: 2, emocion: 1 } },
      { label: 'La peligrosa — para lo mediocre ya hay otros.', vector: { emocion: 3, metodo: 3 } },
      { label: 'Depende de los recursos que tengo disponibles.', vector: { metodo: 1, emocion: 2 } },
      { label: 'La peligrosa, pero buscando cómo reducir el riesgo antes de entrar.', vector: { metodo: 2, emocion: 2 } },
    ],
  },
  {
    id: 33,
    text: '¿Qué valor no transás bajo ninguna circunstancia?',
    options: [
      { label: 'La honestidad — nunca miento, aunque cueste.', vector: { moral: 1 } },
      { label: 'La lealtad a los míos — traicionar a un aliado no es opción.', vector: { social: 2, moral: 2 } },
      { label: 'Mi libertad — no dependo de nadie para nada.', vector: { social: 1, moral: 3 } },
      { label: 'La eficiencia — el trabajo mal hecho es peor que no hacerlo.', vector: { metodo: 1, emocion: 1 } },
    ],
  },
  {
    id: 34,
    text: 'Estás liderando un grupo y uno de tus mejores miembros falla gravemente. ¿Qué hacés?',
    options: [
      { label: 'Entiendo el contexto antes de actuar — todos fallamos.', vector: { moral: 1, social: 3 } },
      { label: 'Lo saco del rol donde falló y lo reubico donde sirva.', vector: { metodo: 2, social: 4 } },
      { label: 'Lo sanciono públicamente — el estándar tiene que ser claro.', vector: { social: 4, metodo: 4 } },
      { label: 'Lo aparto sin drama — el equipo necesita funcionar.', vector: { metodo: 1, emocion: 1 } },
    ],
  },
  {
    id: 35,
    text: '¿Qué harías con poder absoluto durante un día?',
    options: [
      { label: 'Resolver las injusticias más grandes que veo.', vector: { moral: 1, social: 3 } },
      { label: 'Estudiar y entender el sistema completo para usarlo mejor.', vector: { metodo: 1 } },
      { label: 'Garantizar la seguridad de quienes más me importan.', vector: { social: 2, moral: 2 } },
      { label: 'Reconstruir el sistema desde cero según mi visión.', vector: { moral: 4, social: 4 } },
    ],
  },
  {
    id: 36,
    text: 'Alguien está en peligro, podrías ayudar pero te cuesta caro. ¿Qué hacés?',
    options: [
      { label: 'Intervengo — si puedo y no lo hago, es mi responsabilidad.', vector: { moral: 1, emocion: 3 } },
      { label: 'Evalúo si el costo personal es razonable antes de actuar.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Llamo a alguien más capacitado o mejor posicionado.', vector: { social: 3, metodo: 2 } },
      { label: 'No es mi problema — cada uno resuelve lo suyo.', vector: { moral: 4, social: 1 } },
    ],
  },
  {
    id: 37,
    text: 'Descubrís que tu mentor o líder te mintió. ¿Cómo reaccionás?',
    options: [
      { label: 'Se lo digo directamente — esa confianza no se negocia.', vector: { moral: 1, emocion: 3 } },
      { label: 'Lo proceso y ajusto mi nivel de confianza en él.', vector: { emocion: 2, metodo: 2 } },
      { label: 'Lo archivo como información útil para el futuro.', vector: { metodo: 4, emocion: 1 } },
      { label: 'Busco la manera de revertir esa situación a mi favor.', vector: { moral: 3, metodo: 4 } },
    ],
  },
  {
    id: 38,
    text: 'El plan original ya no funciona. ¿Qué hacés?',
    options: [
      { label: 'Vuelvo al análisis base y diseño uno nuevo desde cero.', vector: { metodo: 1, emocion: 1 } },
      { label: 'Adapto sobre la marcha — un buen plan tiene contingencias.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Confío en el instinto y actúo sin plan.', vector: { metodo: 3, emocion: 3 } },
      { label: 'Improviso completamente — los mejores planes nacen del caos.', vector: { metodo: 4, emocion: 4 } },
    ],
  },
  {
    id: 39,
    text: '¿Cómo tratás a quienes están bajo tu mando?',
    options: [
      { label: 'Con el mismo respeto que a cualquiera — la jerarquía es funcional.', vector: { moral: 1, social: 3 } },
      { label: 'Como recursos que tengo que gestionar de forma óptima.', vector: { social: 4, metodo: 2 } },
      { label: 'Son mi responsabilidad — si están bajo mi mando, los protejo.', vector: { social: 3, moral: 2 } },
      { label: 'Con indiferencia — cada uno ocupa el lugar que se merece.', vector: { moral: 3, social: 4 } },
    ],
  },
  {
    id: 40,
    text: '¿Cuál sería tu reacción si alguien te dice que tu método es incorrecto aunque tus resultados sean buenos?',
    options: [
      { label: 'Escucho y evalúo — los métodos también importan.', vector: { moral: 1, metodo: 2 } },
      { label: 'Lo defiendo — los resultados son lo único que cuenta.', vector: { metodo: 4, moral: 3 } },
      { label: 'Busco entender su punto de vista antes de responder.', vector: { emocion: 2, social: 3 } },
      { label: 'Lo ignoro directamente y sigo.', vector: { social: 1, emocion: 1 } },
    ],
  },
  {
    id: 41,
    text: '¿Cuál sería tu rol ideal en una sociedad organizada?',
    options: [
      { label: 'El guardián de los valores fundacionales.', vector: { moral: 1, social: 3 } },
      { label: 'El arquitecto del sistema — diseñando cómo funciona todo.', vector: { metodo: 1, social: 4 } },
      { label: 'El protector en las sombras — nadie sabe que existo pero todo funciona gracias a mí.', vector: { social: 1, moral: 2 } },
      { label: 'No me interesa la utopía — prefiero la realidad con sus contradicciones.', vector: { emocion: 3, metodo: 4 } },
    ],
  },
  {
    id: 42,
    text: '¿Cómo reaccionás ante algo que te parece inmoral pero es legal?',
    options: [
      { label: 'Me opongo activamente aunque sea legal.', vector: { moral: 1, social: 3 } },
      { label: 'Lo evito sin involucrarme.', vector: { moral: 2, social: 1 } },
      { label: 'Lo tolero si no me afecta directamente.', vector: { moral: 3 } },
      { label: 'Lo uso si me conviene — la moralidad es subjetiva.', vector: { moral: 4, metodo: 4 } },
    ],
  },
  {
    id: 43,
    text: 'Te dan a elegir: ser recordado como héroe tras tu muerte, o vivir en anonimato con buena vida. ¿Cuál elegís?',
    options: [
      { label: 'El héroe — que algo de lo que hice trascienda.', vector: { moral: 1, emocion: 3, social: 3 } },
      { label: 'La buena vida — el reconocimiento póstumo no me sirve.', vector: { emocion: 2, social: 1 } },
      { label: 'Busco las dos cosas — no acepto ese límite.', vector: { metodo: 4, moral: 3 } },
      { label: 'No me importa ninguna — solo el presente.', vector: { emocion: 4, moral: 3 } },
    ],
  },
  {
    id: 44,
    text: '¿Qué hacés cuando tenés tiempo libre inesperado?',
    options: [
      { label: 'Lo uso para aprender algo que siempre pospuse.', vector: { metodo: 1 } },
      { label: 'Lo planificó para maximizar el descanso.', vector: { metodo: 2, emocion: 2 } },
      { label: 'Hago lo que el cuerpo me pide en ese momento.', vector: { emocion: 3, metodo: 3 } },
      { label: 'Busco una oportunidad de hacer algo que normalmente no haría.', vector: { emocion: 4, metodo: 4 } },
    ],
  },
  {
    id: 45,
    text: '¿Cuál de estas frases te describe mejor?',
    options: [
      { label: '"Hago lo correcto aunque nadie lo vea."', vector: { moral: 1 } },
      { label: '"Soy el más preparado en la sala."', vector: { metodo: 1, emocion: 1 } },
      { label: '"La familia y los míos son todo."', vector: { social: 2, moral: 2 } },
      { label: '"El que no arriesga, no gana."', vector: { emocion: 4, metodo: 4 } },
    ],
  },
  {
    id: 46,
    text: '¿Cuál es tu mayor miedo?',
    options: [
      { label: 'Fracasar en algo que realmente importa.', vector: { emocion: 3, moral: 2 } },
      { label: 'Perder a alguien que quiero.', vector: { social: 2, emocion: 3 } },
      { label: 'Quedarme sin control de mi propia vida.', vector: { social: 1, emocion: 2 } },
      { label: 'Ser expuesto como alguien que no es lo que parece.', vector: { metodo: 4, moral: 3 } },
    ],
  },
  {
    id: 47,
    text: 'Cuando alguien cercano toma una mala decisión, ¿qué hacés?',
    options: [
      { label: 'Se lo digo con honestidad aunque no quiera escucharlo.', vector: { moral: 1, social: 2 } },
      { label: 'Lo apoyo igual — es su decisión.', vector: { social: 2, emocion: 2 } },
      { label: 'Intervengo directamente para evitar el daño.', vector: { social: 3, emocion: 3 } },
      { label: 'No me meto — cada uno aprende de sus propios errores.', vector: { social: 1, moral: 3 } },
    ],
  },
  {
    id: 48,
    text: '¿Cómo te relacionás con la violencia como herramienta?',
    options: [
      { label: 'Solo como último recurso, cuando todo lo demás falló.', vector: { moral: 1, metodo: 2 } },
      { label: 'Como una opción más, que evalúo según el contexto.', vector: { moral: 2, metodo: 2 } },
      { label: 'Como la respuesta más directa a ciertos problemas.', vector: { metodo: 3, emocion: 3 } },
      { label: 'Como el lenguaje más honesto que existe.', vector: { moral: 4, metodo: 3 } },
    ],
  },
  {
    id: 49,
    text: '¿Qué tipo de aliado preferís tener?',
    options: [
      { label: 'Alguien que comparta mis valores aunque sea menos capaz.', vector: { moral: 1, social: 2 } },
      { label: 'Alguien muy capaz aunque no lo conozca bien.', vector: { metodo: 1, social: 1 } },
      { label: 'Alguien leal que me cubra las espaldas sin preguntar.', vector: { social: 2, emocion: 2 } },
      { label: 'Alguien que me deba algo — la deuda es el mejor contrato.', vector: { moral: 3, metodo: 4 } },
    ],
  },
  {
    id: 50,
    text: '¿Cuál es tu relación con las reglas no escritas?',
    options: [
      { label: 'Las respeto — son las que realmente importan.', vector: { moral: 1, social: 2 } },
      { label: 'Las conozco y las uso a mi favor.', vector: { metodo: 2, moral: 3 } },
      { label: 'Solo existen para los que no tienen poder.', vector: { moral: 4, social: 4 } },
      { label: 'Prefiero tenerlas escritas — lo ambiguo me incomoda.', vector: { metodo: 1, emocion: 1 } },
    ],
  },
]

/**
 * Devuelve n preguntas elegidas al azar del pool sin repetición.
 */
export function getRandomQuestions(n = 15) {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ── Perfiles de los 52 personajes ────────────────────────────────────────────
// Formato: { moral, metodo, social, emocion, mundo }  (valores 1–4)
export const CHARACTER_PROFILES = {
  'harry-potter':    { moral: 1, metodo: 2, social: 2, emocion: 3, mundo: 1 },
  'gollum':          { moral: 3, metodo: 4, social: 1, emocion: 4, mundo: 1 },
  'john-wick':       { moral: 2, metodo: 3, social: 1, emocion: 2, mundo: 3 },
  'walter-white':    { moral: 3, metodo: 1, social: 1, emocion: 2, mundo: 2 },
  'darth-vader':     { moral: 4, metodo: 4, social: 4, emocion: 1, mundo: 4 },
  'tony-stark':      { moral: 2, metodo: 1, social: 3, emocion: 3, mundo: 4 },
  'sherlock':        { moral: 2, metodo: 1, social: 1, emocion: 1, mundo: 2 },
  'jack-sparrow':    { moral: 2, metodo: 4, social: 1, emocion: 4, mundo: 3 },
  'gandalf':         { moral: 1, metodo: 2, social: 3, emocion: 2, mundo: 1 },
  'ip-man':          { moral: 1, metodo: 2, social: 2, emocion: 2, mundo: 3 },
  'el-profesor':     { moral: 2, metodo: 1, social: 3, emocion: 2, mundo: 2 },
  'capitan-flint':   { moral: 3, metodo: 2, social: 3, emocion: 3, mundo: 3 },
  'jax-teller':      { moral: 2, metodo: 2, social: 3, emocion: 3, mundo: 2 },
  'nathan-algren':   { moral: 1, metodo: 2, social: 2, emocion: 3, mundo: 3 },
  'lara-croft':      { moral: 1, metodo: 2, social: 1, emocion: 2, mundo: 3 },
  'spider-man':      { moral: 1, metodo: 2, social: 2, emocion: 3, mundo: 4 },
  'terminator':      { moral: 2, metodo: 1, social: 1, emocion: 1, mundo: 4 },
  'ragnar-lothbrok': { moral: 2, metodo: 2, social: 3, emocion: 3, mundo: 3 },
  'leonidas':        { moral: 1, metodo: 3, social: 3, emocion: 3, mundo: 3 },
  'tommy-shelby':    { moral: 3, metodo: 1, social: 4, emocion: 1, mundo: 2 },
  'eleven':          { moral: 1, metodo: 3, social: 2, emocion: 3, mundo: 1 },
  'geralt':          { moral: 3, metodo: 2, social: 1, emocion: 2, mundo: 1 },
  'jon-snow':        { moral: 1, metodo: 2, social: 3, emocion: 3, mundo: 1 },
  'kurt-sloane':     { moral: 1, metodo: 3, social: 2, emocion: 3, mundo: 3 },
  'venom':           { moral: 3, metodo: 3, social: 1, emocion: 4, mundo: 4 },
  'furiosa':         { moral: 1, metodo: 2, social: 3, emocion: 2, mundo: 3 },
  'alice':           { moral: 1, metodo: 3, social: 1, emocion: 2, mundo: 4 },
  'katniss':         { moral: 1, metodo: 2, social: 3, emocion: 3, mundo: 3 },
  'bryan-mills':     { moral: 2, metodo: 1, social: 1, emocion: 1, mundo: 3 },
  'frank-martin':    { moral: 2, metodo: 1, social: 1, emocion: 2, mundo: 3 },
  'rocky-balboa':    { moral: 1, metodo: 3, social: 2, emocion: 3, mundo: 3 },
  'tony-ja':         { moral: 1, metodo: 3, social: 2, emocion: 2, mundo: 3 },
  'james-bond':      { moral: 2, metodo: 2, social: 1, emocion: 2, mundo: 4 },
  'la-novia':        { moral: 2, metodo: 2, social: 1, emocion: 3, mundo: 3 },
  'tyler-durden':    { moral: 4, metodo: 4, social: 3, emocion: 4, mundo: 2 },
  'hannibal':        { moral: 4, metodo: 1, social: 1, emocion: 1, mundo: 2 },
  'norman-bates':    { moral: 4, metodo: 4, social: 1, emocion: 4, mundo: 2 },
  'wolverine':       { moral: 2, metodo: 3, social: 1, emocion: 4, mundo: 3 },
  'iko-uwais':       { moral: 1, metodo: 3, social: 2, emocion: 2, mundo: 3 },
  'superman':        { moral: 1, metodo: 3, social: 3, emocion: 2, mundo: 4 },
  'ethan-hunt':      { moral: 1, metodo: 2, social: 2, emocion: 2, mundo: 4 },
  'john-mcclane':    { moral: 1, metodo: 4, social: 1, emocion: 4, mundo: 3 },
  'joker':           { moral: 4, metodo: 4, social: 3, emocion: 4, mundo: 2 },
  'aragorn':         { moral: 1, metodo: 2, social: 3, emocion: 2, mundo: 1 },
  'batman':          { moral: 2, metodo: 1, social: 1, emocion: 1, mundo: 4 },
  'kratos':          { moral: 3, metodo: 3, social: 1, emocion: 4, mundo: 1 },
  'nascimento':      { moral: 2, metodo: 1, social: 4, emocion: 1, mundo: 2 },
  'bruce-lee':       { moral: 1, metodo: 2, social: 2, emocion: 2, mundo: 3 },
  'aquiles':         { moral: 2, metodo: 3, social: 1, emocion: 3, mundo: 3 },
  'the-punisher':    { moral: 2, metodo: 3, social: 1, emocion: 1, mundo: 2 },
  'william-wallace': { moral: 1, metodo: 3, social: 3, emocion: 3, mundo: 3 },
  'casey-ryback':    { moral: 1, metodo: 2, social: 1, emocion: 2, mundo: 3 },
  'captain-america': { moral: 1, metodo: 2, social: 3, emocion: 2, mundo: 4 },
  'deadpool':        { moral: 3, metodo: 3, social: 2, emocion: 4, mundo: 2 },
}

// ── Descripciones de resultado (por qué te parecés a ese personaje) ───────────
export const MATCH_DESCRIPTIONS = {
  'harry-potter':    'Tenés el corazón de alguien que actúa por convicción, no por conveniencia. El peso del mundo no te aplasta — te define. Cargás con la responsabilidad porque entendés que alguien tiene que hacerlo.',
  'gollum':          'Cargás con algo que te consume por dentro. Tus deseos son más poderosos que tu voluntad a veces, y esa lucha interna es lo que te hace profundamente humano... o peligroso.',
  'john-wick':       'Sos letal cuando tenés que serlo, pero lo que te mueve no es el poder — es algo mucho más personal. Guardás tu dolor en silencio y lo convertís en precisión.',
  'walter-white':    'Tenés una mente extraordinaria y la suficiente ambición para usarla. El problema es que tu inteligencia a veces justifica lo que tus valores deberían cuestionar.',
  'darth-vader':     'El poder y el orden te llaman. Tenés autoridad natural y una lógica de hierro que no negocia. Bajo esa frialdad, sin embargo, hay una historia de pérdida que nadie ve.',
  'tony-stark':      'Brillante, sarcástico e incapaz de apagar el cerebro. Usás el humor como escudo y la tecnología como lenguaje. Sabés que podés solo, pero elegís luchar por algo más grande.',
  'sherlock':        'Tu mente va más rápido que cualquier conversación. Ves lo que otros ignoran y te aburre lo que otros encuentran emocionante. La soledad no te molesta — a veces la preferís.',
  'jack-sparrow':    'El caos es tu ecosistema natural. Tomás decisiones imposibles de predecir y sin embargo llegás al mismo lugar. La libertad es tu único dogma.',
  'gandalf':         'Tenés sabiduría que no necesita imponerse. Guiás sin controlar, inspirás sin ordenar. Sabés que el momento correcto importa tanto como la acción correcta.',
  'ip-man':          'Tenés una calma que intimida más que la agresión. Tu disciplina viene de adentro, no de las reglas. Defendés lo que amás con precisión y sin excesos.',
  'el-profesor':     'Planificás cada paso con obsesión y detalle. Liderás desde la sombra y tenés la capacidad de convertir la presión extrema en claridad.',
  'capitan-flint':   'Sos carismático, estratégico y dispuesto a cruzar líneas cuando el objetivo lo vale. Tu ambición no tiene un límite claro, y eso te hace impredecible.',
  'jax-teller':      'Tenés lealtad profunda hacia los tuyos y al mismo tiempo cargás con el peso de las decisiones que esa lealtad exige. Vivís en la tensión entre lo que sos y lo que querés ser.',
  'nathan-algren':   'Llegaste al límite y encontraste algo que valió la pena defender. Tenés honor aunque el sistema en el que creciste no lo tenía. Cambiaste, y eso requirió valentía real.',
  'lara-croft':      'La aventura es tu forma de estar en el mundo. Vas solo cuando hace falta, confiás en tu entrenamiento y no esperás que nadie te salve.',
  'spider-man':      'Tenés mucho poder y lo usás para proteger a los que no pueden protegerse solos. El sacrificio te pesa, pero lo elegís igual. Eso dice todo.',
  'terminator':      'Ejecutás. Sin dudas, sin emociones que interfieran, con una eficiencia que asusta. No es frialdad — es foco total en el objetivo.',
  'ragnar-lothbrok': 'Sos líder porque pensás diferente, no porque seas el más fuerte. Tu curiosidad te lleva más lejos que tu espada. Y tu ambición no conoce horizonte.',
  'leonidas':        'Liderás desde el frente. Tu valor no es la ausencia del miedo sino la decisión de avanzar igual. Y cuando defendés algo, lo hacés hasta el final.',
  'tommy-shelby':    'Tenés una frialdad estratégica que pocos entienden. Calculás cada movimiento mientras el mundo cree que improvisás. El poder es tu idioma y lo hablás con fluidez.',
  'eleven':          'Tenés una fuerza interior que sobrepasa lo que deberías poder cargar. Fuiste formado por el dolor, pero elegís conectar en lugar de destruir. Eso no es debilidad.',
  'geralt':          'Vivís entre dos mundos y no pertenecés completamente a ninguno. Tu código moral es propio — no el de los héroes ni el de los villanos. Hacés lo que podés con lo que tenés.',
  'jon-snow':        'Tenés honor aunque nadie te lo pida y asumís responsabilidades que no pediste. Aprendés de tus errores y eso te hace mejor líder que los que nunca se equivocan.',
  'kurt-sloane':     'Tenés algo que demostrar y no necesitás que nadie lo valide. Entrenás, sufrís y volvés. La derrota no es el final — es el punto de partida.',
  'venom':           'Hay dos voces en tu cabeza y ninguna es del todo buena. Actuás por instinto y ese instinto a veces te sorprende. La línea entre proteger y destruir es delgada para vos.',
  'furiosa':         'Tenés una causa que te consume. No luchás por vos misma — luchás por los que no pueden. Esa diferencia lo cambia todo.',
  'alice':           'Sobreviviste a cosas que nadie debería enfrentar solo. Aprendiste a confiar en vos misma porque no quedó otra. Ahora sos el peligro que antes te amenazaba.',
  'katniss':         'No querías ser el símbolo — te convirtieron en uno. Pero lo usaste para algo real. Tenés la valentía de quien no tiene nada que perder excepto a los que ama.',
  'bryan-mills':     'Tenés un set de habilidades específico y la voluntad de usarlo sin vacilar cuando algo o alguien importante está en juego. Nada más importa en ese momento.',
  'frank-martin':    'Tenés reglas y las respetás. Eso te diferencia de los que dicen tenerlas pero las rompen al primer obstáculo. Tu código es tu identidad.',
  'rocky-balboa':    'No sos el más rápido ni el más inteligente — sos el que más aguanta. Y eso, a la larga, es lo único que importa. Nadie te puede sacar del ring si vos no querés salir.',
  'tony-ja':         'Tenés una conexión entre cuerpo y propósito que pocos alcanzan. Tu disciplina es espiritual tanto como física. Actuás con intención, no con rabia.',
  'james-bond':      'Tenés elegancia bajo presión. Improvisás con estilo y mantenés el control incluso cuando todo se cae. El riesgo no te asusta — lo administrás.',
  'la-novia':        'Tenés una misión personal que no negocias. Lo que empezaste lo vas a terminar, sin importar cuánto tiempo tome ni cuánto cueste.',
  'tyler-durden':    'Ves el sistema como una trampa y querés despertarte de él. Tu energía es contagiosa pero destructiva. La pregunta es si lo que destruís merecía ser destruido.',
  'hannibal':        'Tenés una inteligencia que opera en un nivel diferente. Observás donde otros hablan, deducís donde otros preguntan. Tu refinamiento es real... y eso lo hace más perturbador.',
  'norman-bates':    'Hay algo fragmentado en cómo ves el mundo y las personas que hay en él. La intensidad de tus emociones no siempre se corresponde con la realidad — y eso genera tensión.',
  'wolverine':       'Tenés cicatrices que no se ven pero moldean todo lo que hacés. Luchás solo porque proteger a otros desde cerca siempre termina mal para alguien. La rabia es real, pero debajo hay lealtad.',
  'iko-uwais':       'No mostrás más de lo necesario. Hablás con acciones precisas y controladas. La violencia, cuando aparece, es quirúrgica — no un espectáculo.',
  'superman':        'Tenés la capacidad de hacer mucho daño y elegís no hacerlo. Eso es más difícil de lo que parece. Tu fuerza está al servicio de algo más grande que vos.',
  'ethan-hunt':      'Tomás misiones que nadie más puede completar y las completás con el equipo mínimo posible. Tu confianza en tus habilidades roza lo irracional — y por eso funciona.',
  'john-mcclane':    'Te encontrás en el lugar equivocado en el momento equivocado y de alguna manera lo resolvés. No con elegancia, no con un plan — sino con terquedad y suerte creada a golpes.',
  'joker':           'Ves el absurdo del mundo con una claridad que la mayoría prefiere ignorar. Tu lógica tiene coherencia interna aunque nadie más la entienda. El caos, para vos, es honestidad.',
  'aragorn':         'Tenés el peso de una responsabilidad que no pediste y la elegís igual. Liderás porque podés, no porque lo necesitás. Y eso hace toda la diferencia.',
  'batman':          'Tenés una disciplina que nació del dolor. Cada decisión pasa por un filtro de lógica implacable. No confiás en nadie del todo — eso te protege y también te aísla.',
  'kratos':          'Cargás con culpa que no se resuelve fácilmente. Tu fuerza es innegable pero tu historia te pesa. Estás aprendiendo a ser algo más que tu pasado.',
  'nascimento':      'Tenés una autoridad que no admite cuestionamientos y una eficiencia que no tolera excusas. El sistema te formó y vos lo llevás al extremo — con todo lo que eso implica.',
  'bruce-lee':       'Tenés filosofía detrás del movimiento. Tu búsqueda va más allá de la técnica — es sobre entenderte a vos mismo. La disciplina para vos es un camino, no un destino.',
  'aquiles':         'Tenés una gloria que buscás y un talón que ignorás. Tu valentía es real pero tu ego también. Lo que más deseás puede ser lo que más te cueste.',
  'the-punisher':    'Tenés una guerra personal que no termina. Tu justicia es absoluta y eso te diferencia de los héroes — y de los villanos. Vivís en el gris y lo sabés.',
  'william-wallace': 'Tenés algo que defender y lo defendés aunque el costo sea desproporcionado. La libertad no es un concepto abstracto para vos — es personal y urgente.',
  'casey-ryback':    'No hacés alarde, no explicás, no anunciás. Simplemente actuás cuando hace falta y después seguís. La competencia sin ego es tu forma de estar.',
  'captain-america': 'Tenés un código que no negocia. No por rigidez, sino porque encontraste algo en lo que creer y no lo soltás aunque el mundo cambie a tu alrededor. Ese tipo de constancia es más raro de lo que parece.',
  'deadpool':        'No te tomás en serio y esa es tu mayor fortaleza. Mientras los demás cargan el peso del mundo, vos encontraste una forma de reírte de él. Eso no es superficialidad — es resiliencia disfrazada de caos.',
}

// ── Funciones de scoring ──────────────────────────────────────────────────────
const DIMS = ['moral', 'metodo', 'social', 'emocion', 'mundo']

/**
 * Recibe un array de vectores parciales (uno por pregunta respondida)
 * y devuelve el perfil promedio del usuario { moral, metodo, social, emocion, mundo }.
 * Si ninguna respuesta tocó una dimensión, el valor queda en 2.5 (punto medio).
 */
export function computeUserProfile(answerVectors) {
  const sums   = { moral: 0, metodo: 0, social: 0, emocion: 0, mundo: 0 }
  const counts = { moral: 0, metodo: 0, social: 0, emocion: 0, mundo: 0 }

  for (const vec of answerVectors) {
    for (const dim of DIMS) {
      if (vec[dim] != null) {
        sums[dim]   += vec[dim]
        counts[dim] += 1
      }
    }
  }

  return Object.fromEntries(
    DIMS.map(d => [d, counts[d] > 0 ? sums[d] / counts[d] : 2.5])
  )
}

/**
 * Compara el perfil del usuario contra los 52 personajes (distancia Euclidiana 5D)
 * y devuelve el top 3 ordenado de mayor a menor similitud.
 * matchPct va de 0 a 100.
 */
export function rankCharacters(userProfile) {
  const MAX_DIST = Math.sqrt(5 * 9) // sqrt(45) ≈ 6.708 — distancia máxima teórica

  const results = Object.entries(CHARACTER_PROFILES).map(([id, profile]) => {
    const distSq = DIMS.reduce((sum, d) => {
      const diff = (userProfile[d] ?? 2.5) - profile[d]
      return sum + diff * diff
    }, 0)
    const dist     = Math.sqrt(distSq)
    const matchPct = Math.max(0, Math.round((1 - dist / MAX_DIST) * 100))
    return { id, matchPct }
  })

  return results
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, 3)
}
