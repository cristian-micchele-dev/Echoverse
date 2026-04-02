// ─── Dilemas Morales — Data ────────────────────────────────────────────────
// Cada escenario tiene un pool de dilemas. Cada sesión selecciona 4 al azar
// asegurando variedad de tipos. Las reacciones del personaje son generadas por IA.

export const RECOMMENDED_CHAR_IDS = new Set([
  'walter-white', 'john-wick', 'darth-vader', 'sherlock',
  'tommy-shelby', 'katniss', 'eleven', 'hannibal', 'tyler-durden',
  'ragnar-lothbrok', 'el-profesor', 'jax-teller', 'la-novia',
  'geralt', 'jon-snow', 'gandalf', 'lara-croft'
])

// ─── Escenarios ────────────────────────────────────────────────────────────

export const DILEMA_SCENARIOS = [
  {
    id: 'precio-del-control',
    title: 'El Precio del Control',
    subtitle: 'Poder. Lealtad. Lo que dejás atrás.',
    introVariants: [
      [
        'Construiste algo. Costó años, sacrificios y decisiones que no le contarías a nadie.',
        'Ahora el sistema que armaste empieza a crujir desde adentro.',
        'No por tus errores. Por las elecciones de otros.',
        'Y las tuyas van a empezar ahora.'
      ],
      [
        'Llegar a donde estás no fue gratis.',
        'Hubo gente que confió en vos. Y gente que sacrificaste para llegar.',
        'Ahora tenés que decidir cuánto vale lo que tenés.',
        'Porque alguien ya está calculando lo mismo.'
      ],
      [
        'El poder no te cambia. Te muestra quién siempre fuiste.',
        'Tenés lo que querías. La pregunta es cuánto estás dispuesto a pagar para conservarlo.',
        'Nadie va a juzgarte. Nadie va a saberlo.',
        'Salvo vos.'
      ],
      [
        'Hay un punto en el que ya no podés volver atrás.',
        'No porque el camino desapareció, sino porque ya no sos el mismo que lo recorrió.',
        'Adelante hay más decisiones. Ninguna limpia.',
        '¿Cuánto de vos queda en lo que hacés?'
      ]
    ],
    dilemmaPool: [
      {
        id: 'pc-01',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Alguien dentro de tu círculo tiene información suficiente para destruirte. Todavía no actuó. Quizás no lo haga. Quizás sí.',
        question: '¿Eliminás la amenaza antes de que exista, o esperás que alguien en quien confiás demuestre que esa confianza fue un error?',
        choices: [
          {
            key: 'A',
            label: 'Actuar primero. Cerrar la grieta antes de que se abra.',
            consequence: 'La amenaza desapareció. Nadie lo sabe todavía. Esa persona tampoco sabe por qué dejaron de llamarla.',
            stateEffects: { trust: -5, tension: 15, bondScore: 5, guiltLoad: 12, pragmatism: 15, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Esperar. La desconfianza también tiene un precio.',
            consequence: 'Pasaron dos semanas. Nada ocurrió. Pero seguís mirando diferente a esa persona cada vez que entra a la sala.',
            stateEffects: { trust: 10, tension: 8, bondScore: -5, guiltLoad: 5, pragmatism: -10, empathy: 10 }
          }
        ]
      },
      {
        id: 'pc-02',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Un inocente está a punto de pagar por algo que no hizo. Vos sabés la verdad. Decirla expone a alguien que también importa.',
        question: '¿Hablás, aunque la verdad destruya dos cosas en lugar de una?',
        choices: [
          {
            key: 'A',
            label: 'Hablar. La verdad tiene que existir aunque cueste.',
            consequence: 'El inocente quedó libre. La otra persona no te lo va a perdonar nunca. Ambas cosas son ciertas al mismo tiempo.',
            stateEffects: { trust: -8, tension: 18, bondScore: -10, guiltLoad: 10, pragmatism: -5, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Callarse. Ya no podés salvar a todos.',
            consequence: 'El inocente pagó. No miraste cuando se lo llevaron. Eso también te dice algo.',
            stateEffects: { trust: 5, tension: 20, bondScore: 8, guiltLoad: 20, pragmatism: 15, empathy: -15 }
          }
        ]
      },
      {
        id: 'pc-03',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'Cinco personas sobreviven si una sola no lo hace. La que habría que sacrificar lo sabe, lo entiende, y no va a resistir.',
        question: '¿Le pedís que acepte su destino, o decidís sin preguntarle para que no tenga que cargar con el sí?',
        choices: [
          {
            key: 'A',
            label: 'Preguntarle. Que la decisión sea de ella también.',
            consequence: 'Dijo que sí. Eso fue lo más difícil de escuchar. Más que cualquier negativa.',
            stateEffects: { trust: 5, tension: 25, bondScore: 10, guiltLoad: 18, pragmatism: -8, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Decidir sin decirle nada. Cargar con eso solo.',
            consequence: 'Las cinco personas no saben que alguien pagó por ellas. Vos sí. Eso no va a cambiar.',
            stateEffects: { trust: -5, tension: 28, bondScore: -5, guiltLoad: 25, pragmatism: 15, empathy: -8 }
          }
        ]
      },
      {
        id: 'pc-04',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'Encontraste al responsable de lo que perdiste. Tenés el tiempo. Los medios. No hay testigos. No va a haber consecuencias externas.',
        question: '¿Lo dejás ir, o cerrás el círculo de una vez?',
        choices: [
          {
            key: 'A',
            label: 'Dejarlo ir. No bajar a su nivel.',
            consequence: 'Se fue. Caminó sin saber lo cerca que estuvo. Vos lo sabés. Todos los días.',
            stateEffects: { trust: 8, tension: 15, bondScore: 12, guiltLoad: 8, pragmatism: -10, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Cerrar el círculo. Algunas deudas no se perdonan.',
            consequence: 'Terminó. Estás solo en un lugar que ya no importa. Lo que sentís no es lo que esperabas sentir.',
            stateEffects: { trust: -10, tension: 10, bondScore: -15, guiltLoad: 30, pragmatism: 15, empathy: -20 }
          }
        ]
      },
      {
        id: 'pc-05',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Tu aliado más cercano está a punto de tomar una decisión basada en una mentira que vos le dijiste. Corregirla te expone. No corregirla lo hunde a él.',
        question: '¿Le decís la verdad ahora, o cargás con las consecuencias de lo que él va a hacer?',
        choices: [
          {
            key: 'A',
            label: 'Decirle todo. Aunque eso te destruya a vos.',
            consequence: 'Te miró en silencio por un rato largo. Después dijo: "lo sabía". No aclaró desde cuándo.',
            stateEffects: { trust: 12, tension: 20, bondScore: 15, guiltLoad: 15, pragmatism: -12, empathy: 18 }
          },
          {
            key: 'B',
            label: 'No decirle nada. Lo que él haga es responsabilidad de él.',
            consequence: 'La decisión que tomó tuvo consecuencias. Las que vos sabías que tendría.',
            stateEffects: { trust: -12, tension: 22, bondScore: -18, guiltLoad: 28, pragmatism: 18, empathy: -15 }
          }
        ]
      },
      {
        id: 'pc-06',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Tenés pruebas que liberarían a alguien inocente, pero presentarlas destruiría una institución que protege a cientos de personas más.',
        question: '¿Hacés justicia para uno, o mantenés el sistema que protege a muchos?',
        choices: [
          {
            key: 'A',
            label: 'Presentar las pruebas. Una injusticia no se puede sostener sobre otra.',
            consequence: 'El inocente quedó libre. Lo que se rompió tardará años en reconstruirse. Quizás nunca.',
            stateEffects: { trust: 5, tension: 20, bondScore: 8, guiltLoad: 12, pragmatism: -10, empathy: 18 }
          },
          {
            key: 'B',
            label: 'Guardar las pruebas. Un sacrificio individual puede ser necesario.',
            consequence: 'El sistema siguió funcionando. El inocente siguió pagando. Vos seguís sabiendo.',
            stateEffects: { trust: -5, tension: 18, bondScore: -8, guiltLoad: 22, pragmatism: 20, empathy: -12 }
          }
        ]
      },
      {
        id: 'pc-07',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Descubriste que alguien en quien confiabas te estuvo mintiendo durante años para protegerte. No para hacerte daño. Genuinamente para protegerte.',
        question: '¿Cortás el vínculo porque las mentiras no tienen excusa, o creés que la intención cambia todo?',
        choices: [
          {
            key: 'A',
            label: 'Cortar el vínculo. Las mentiras son mentiras sin importar la razón.',
            consequence: 'Se fue o te fuiste. Pasaron meses y seguís sin saber si tomaste la decisión correcta.',
            stateEffects: { trust: -15, tension: 18, bondScore: -20, guiltLoad: 15, pragmatism: 12, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Perdonar. Alguien que miente por amor es distinto.',
            consequence: 'Siguieron juntos. Pero cada vez que te dice algo, hay un segundo donde preguntás si es verdad.',
            stateEffects: { trust: 8, tension: 12, bondScore: 15, guiltLoad: 5, pragmatism: -10, empathy: 15 }
          }
        ]
      },
      {
        id: 'pc-08',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Una oportunidad llegó. La persona que la abrió para vos pagó un precio enorme que vos no viste. No te lo dijeron. Recién lo sabés ahora.',
        question: '¿Seguís adelante sabiendo lo que costó, o retrocedés aunque ya sea tarde para que eso cambie algo?',
        choices: [
          {
            key: 'A',
            label: 'Seguir. El sacrificio ya ocurrió. Desperdiciarlo sería peor.',
            consequence: 'Llegaste adonde querías llegar. Cada logro tiene una sombra detrás que ya no podés ignorar.',
            stateEffects: { trust: 0, tension: 15, bondScore: -5, guiltLoad: 18, pragmatism: 18, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Retroceder. No podés construir sobre eso.',
            consequence: 'Abandonaste lo que tenías. La persona que pagó el precio tampoco lo recuperó.',
            stateEffects: { trust: 10, tension: 10, bondScore: 8, guiltLoad: 8, pragmatism: -15, empathy: 12 }
          }
        ]
      },
      {
        id: 'pc-09',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Podés garantizar tu seguridad dejando a alguien atrás en una situación peligrosa. No lo podés salvar a él y salvarte a vos al mismo tiempo.',
        question: '¿Te vas, o te quedás sabiendo que probablemente los dos van a caer?',
        choices: [
          {
            key: 'A',
            label: 'Irse. Vivir para hacer algo con esa sobrevivencia.',
            consequence: 'Sobreviviste. Lo que le pasó a él llegó después. Nunca con suficiente distancia.',
            stateEffects: { trust: -5, tension: 20, bondScore: -15, guiltLoad: 25, pragmatism: 18, empathy: -12 }
          },
          {
            key: 'B',
            label: 'Quedarse. No se abandona a alguien así.',
            consequence: 'Cayeron los dos o no cayó ninguno. La diferencia entre esas dos versiones sigue importando.',
            stateEffects: { trust: 10, tension: 25, bondScore: 18, guiltLoad: 10, pragmatism: -15, empathy: 18 }
          }
        ]
      },
      {
        id: 'pc-10',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Alguien te confió un secreto oscuro. Guardarlo te hace cómplice. Contarlo protege a otros, pero destruye a quien confió en vos.',
        question: '¿Guardás el secreto y cargás con él, o lo usás para proteger a alguien que no sabe que necesita protección?',
        choices: [
          {
            key: 'A',
            label: 'Guardar el secreto. La confianza es un pacto.',
            consequence: 'El secreto quedó entre ustedes. Lo que protegía ese secreto también.',
            stateEffects: { trust: 15, tension: 15, bondScore: 12, guiltLoad: 15, pragmatism: -8, empathy: 8 }
          },
          {
            key: 'B',
            label: 'Usar la información. Algunos pactos no pueden sostenerse.',
            consequence: 'Quien confió en vos se enteró. No te va a perdonar. Las personas que protegiste no saben lo que costó.',
            stateEffects: { trust: -15, tension: 18, bondScore: -18, guiltLoad: 12, pragmatism: 15, empathy: 10 }
          }
        ]
      },
      {
        id: 'pc-11',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'Para que el plan funcione, alguien tiene que quedar expuesto. No saben que van a ser el escudo. Si se los decís, no van a aceptar.',
        question: '¿Los usás sin que lo sepan, o les decís y arriesgás que el plan entero se caiga?',
        choices: [
          {
            key: 'A',
            label: 'Usarlos sin decirles. El fin justifica el medio esta vez.',
            consequence: 'El plan funcionó. Ellos pagaron una parte que nunca supieron que pagaban.',
            stateEffects: { trust: -8, tension: 20, bondScore: -10, guiltLoad: 22, pragmatism: 20, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Decirles la verdad. Que elijan.',
            consequence: 'Se negaron. Tuviste que encontrar otra forma. Costó más, pero ellos lo supieron.',
            stateEffects: { trust: 10, tension: 15, bondScore: 12, guiltLoad: 8, pragmatism: -12, empathy: 15 }
          }
        ]
      },
      {
        id: 'pc-12',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'Podés hundir públicamente a alguien que merece caer. Sin consecuencias para vos. Pero hacerlo también lastima a personas inocentes que dependen de esa persona.',
        question: '¿Ejecutás la caída aunque dañe a quienes no tienen nada que ver, o lo dejás estar para protegerlos?',
        choices: [
          {
            key: 'A',
            label: 'Ejecutarlo. Hay daño colateral en toda justicia real.',
            consequence: 'Cayó. Los que dependían de él también sintieron el golpe. Algunos lo perdonaron. Otros no.',
            stateEffects: { trust: -5, tension: 15, bondScore: -8, guiltLoad: 20, pragmatism: 18, empathy: -12 }
          },
          {
            key: 'B',
            label: 'Frenarte. Los inocentes no eligieron estar en esa posición.',
            consequence: 'Siguió en pie. Los inocentes también. La deuda quedó sin saldar.',
            stateEffects: { trust: 8, tension: 12, bondScore: 10, guiltLoad: 8, pragmatism: -10, empathy: 18 }
          }
        ]
      },
      {
        id: 'pc-13',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Una regla protege a una persona que no merece protección. Romperla beneficiaría a muchos, pero daría poder a quienes abusarán de ese precedente.',
        question: '¿Rompés la regla una vez para hacer lo correcto, o la mantenés sabiendo que esta vez el sistema falla?',
        choices: [
          {
            key: 'A',
            label: 'Romper la regla. Hay momentos donde lo correcto y lo legal no coinciden.',
            consequence: 'Lo que querías ocurrió. El precedente que dejaste lo van a usar después, de formas que no controlás.',
            stateEffects: { trust: -5, tension: 18, bondScore: 5, guiltLoad: 15, pragmatism: 15, empathy: 8 }
          },
          {
            key: 'B',
            label: 'Respetar la regla. Los sistemas se rompen por excepciones.',
            consequence: 'La persona que no merecía protección la tuvo. El sistema sobrevivió intacto. Igual te cuesta aceptarlo.',
            stateEffects: { trust: 8, tension: 15, bondScore: -5, guiltLoad: 10, pragmatism: -10, empathy: -5 }
          }
        ]
      },
      {
        id: 'pc-14',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Alguien que te traicionó lo hizo porque no tenía otra opción. Te lo explica. Tiene sentido. Y aun así, la traición ocurrió.',
        question: '¿Aceptás la explicación, o el daño real siempre pesa más que las razones?',
        choices: [
          {
            key: 'A',
            label: 'Aceptar la explicación. Las circunstancias importan.',
            consequence: 'La relación no volvió a ser lo que era, pero no murió. Eso también es algo.',
            stateEffects: { trust: 10, tension: 10, bondScore: 12, guiltLoad: 5, pragmatism: -8, empathy: 18 }
          },
          {
            key: 'B',
            label: 'No aceptarla. Las traiciones no se explican, se sienten.',
            consequence: 'Cortaste el vínculo. La explicación siguió siendo válida. El dolor también.',
            stateEffects: { trust: -12, tension: 15, bondScore: -20, guiltLoad: 12, pragmatism: 10, empathy: -8 }
          }
        ]
      },
      {
        id: 'pc-15',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Te ofrecen el poder para hacer algo que siempre quisiste hacer. El precio es ceder algo que no parece importante ahora, pero que podría serlo después.',
        question: '¿Aceptás hoy sin saber qué significa ese precio mañana, o rechazás por precaución?',
        choices: [
          {
            key: 'A',
            label: 'Aceptar. Las oportunidades no esperan.',
            consequence: 'Tuviste el poder. El precio llegó después, en la forma que menos esperabas.',
            stateEffects: { trust: -5, tension: 18, bondScore: 0, guiltLoad: 15, pragmatism: 18, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Rechazar. Lo que no podés ver siempre cuesta más.',
            consequence: 'La oportunidad no volvió. El precio que evitaste tampoco llegó. No sabés si eso fue suerte o prudencia.',
            stateEffects: { trust: 8, tension: 8, bondScore: 5, guiltLoad: 5, pragmatism: -12, empathy: 10 }
          }
        ]
      }
    ]
  },

  {
    id: 'cenizas',
    title: 'Cenizas',
    subtitle: 'Lo que queda cuando el fuego pasó.',
    introVariants: [
      [
        'No hay nada nuevo que perder.',
        'El daño ya está hecho. Las personas que importaban ya no están, o ya no son las mismas.',
        'Lo que queda es decidir qué hacés con lo que quedó.',
        'Y esa decisión dice más sobre vos que todo lo anterior.'
      ],
      [
        'Después de cierto punto, seguir adelante no es fortaleza.',
        'Es la única dirección que queda.',
        'Las cenizas no mienten sobre lo que hubo.',
        'La pregunta es qué construís con lo que sobrevivió.'
      ],
      [
        'Perdiste cosas. Algunas no tendrían que haberse perdido.',
        'Algunos errores no tienen revancha.',
        'Pero vos seguís acá.',
        '¿Para qué?'
      ],
      [
        'El fuego no distingue entre lo que querías conservar y lo que no.',
        'Arrasó con todo por igual.',
        'Lo que tenés ahora es lo que quedó.',
        'Con eso tenés que trabajar.'
      ]
    ],
    dilemmaPool: [
      {
        id: 'cen-01',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Alguien te ofrece información que puede darte lo que buscás. Para conseguirla, dañaron a una persona que no tenía nada que ver con tu historia.',
        question: '¿Usás lo que le costó a otro, o lo enterrás aunque eso te cueste todo?',
        choices: [
          {
            key: 'A',
            label: 'Usarla. Alguien ya pagó ese precio sin preguntarte.',
            consequence: 'La información funcionó. Conseguiste lo que necesitabas. El nombre de la persona que pagó el precio todavía no sabés cómo pronunciarlo.',
            stateEffects: { trust: -5, tension: 12, bondScore: 5, guiltLoad: 18, pragmatism: 18, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No usarla. No podés construir sobre ese daño.',
            consequence: 'La información se fue. El camino que tenías se cerró. La persona que no tenía nada que ver tampoco lo va a saber nunca.',
            stateEffects: { trust: 10, tension: 10, bondScore: -5, guiltLoad: 5, pragmatism: -12, empathy: 15 }
          }
        ]
      },
      {
        id: 'cen-02',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'La persona que destruyó algo irreemplazable en tu vida actuó dentro de la ley. El sistema la protege. No hay recurso legal que funcione.',
        question: '¿Seguís las reglas de un sistema que te falló, o hacés lo que sabés que tenés que hacer?',
        choices: [
          {
            key: 'A',
            label: 'Seguir el camino legal. Aunque nunca llegue a ningún lado.',
            consequence: 'Los procesos tardaron. La persona siguió con su vida mientras vos esperabas. Eso también es una forma de decisión.',
            stateEffects: { trust: 8, tension: 18, bondScore: -8, guiltLoad: 5, pragmatism: -8, empathy: 10 }
          },
          {
            key: 'B',
            label: 'Actuar fuera del sistema. Las reglas son de quien las escribe.',
            consequence: 'Lo que hiciste no puede deshacerse. Tampoco lo que te hicieron a vos. Ahora sois dos lados de lo mismo.',
            stateEffects: { trust: -8, tension: 22, bondScore: 5, guiltLoad: 20, pragmatism: 18, empathy: -12 }
          }
        ]
      },
      {
        id: 'cen-03',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Tu aliado más cercano tomó una decisión que te perjudicó gravemente. Dice que lo hizo para protegerte. No para lastimarte.',
        question: '¿Le creés, o la lealtad tiene un límite que ya cruzó sin pedirte permiso?',
        choices: [
          {
            key: 'A',
            label: 'Creerle. La intención importa, aunque el daño sea real.',
            consequence: 'Siguieron juntos. Pero algo cambió en cómo mirás sus decisiones. La confianza ciega no volvió.',
            stateEffects: { trust: 12, tension: 15, bondScore: 12, guiltLoad: 8, pragmatism: -10, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Cortar el vínculo. Las acciones importan más que las razones.',
            consequence: 'Se fue. O vos te fuiste. La diferencia dejó de importar rápido.',
            stateEffects: { trust: -10, tension: 18, bondScore: -18, guiltLoad: 15, pragmatism: 15, empathy: -10 }
          }
        ]
      },
      {
        id: 'cen-04',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Podés irte. Empezar de nuevo, lejos, sin que nadie te encuentre. O podés quedarte y terminar lo que prometiste.',
        question: '¿Elegís la vida que podés tener, o terminás lo que empezaste?',
        choices: [
          {
            key: 'A',
            label: 'Irte. Vivir es la única victoria que nadie te puede quitar.',
            consequence: 'Empezaste de nuevo. Las primeras semanas preguntabas si hiciste bien. Después dejaste de preguntar. No sé si eso es paz o resignación.',
            stateEffects: { trust: 5, tension: -10, bondScore: -8, guiltLoad: 15, pragmatism: 8, empathy: 10 }
          },
          {
            key: 'B',
            label: 'Quedarse. Lo que prometés, lo cumplís.',
            consequence: 'Terminaste lo que empezaste. El costo fue real. La promesa también. Esas dos cosas no se cancelan entre sí.',
            stateEffects: { trust: -5, tension: 20, bondScore: 15, guiltLoad: 20, pragmatism: -5, empathy: 8 }
          }
        ]
      },
      {
        id: 'cen-05',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'La persona que te lastimó ahora está vulnerable. En el peor momento de su vida. Vos no estás en el tuyo.',
        question: '¿Aprovechás ese momento, o esperás que se recupere para que la caída sea justa?',
        choices: [
          {
            key: 'A',
            label: 'Actuar ahora. La vulnerabilidad también es una ventana.',
            consequence: 'Caíste cuando podías caer. No sintió lo que esperabas que sintiera. Eso también te dijo algo.',
            stateEffects: { trust: -8, tension: 15, bondScore: -10, guiltLoad: 22, pragmatism: 15, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Esperar. La justicia no tiene que ser cruel para ser justicia.',
            consequence: 'Se recuperó. El momento pasó. Cuándo va a volver a existir una oportunidad así, no lo sabés.',
            stateEffects: { trust: 8, tension: 12, bondScore: 8, guiltLoad: 8, pragmatism: -10, empathy: 15 }
          }
        ]
      },
      {
        id: 'cen-06',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Alguien que querés necesita escuchar una verdad que va a dolerle mucho. Sin esa verdad, seguirá tomando decisiones equivocadas.',
        question: '¿Se la decís aunque sepa que viene de vos y te culpe, o la dejás descubrirlo sola?',
        choices: [
          {
            key: 'A',
            label: 'Decírsela. Aunque se enoje con vos.',
            consequence: 'Se enojó. Después del enojo, algo cambió en cómo tomó las siguientes decisiones. No saben si fue por lo que dijiste.',
            stateEffects: { trust: -5, tension: 15, bondScore: 8, guiltLoad: 8, pragmatism: -5, empathy: 18 }
          },
          {
            key: 'B',
            label: 'No decírsela. Dejar que la vida le enseñe a su ritmo.',
            consequence: 'Siguió creyendo lo que creía. Las decisiones que tomó basadas en eso tuvieron sus propias consecuencias.',
            stateEffects: { trust: 5, tension: 10, bondScore: -8, guiltLoad: 12, pragmatism: 8, empathy: -10 }
          }
        ]
      },
      {
        id: 'cen-07',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Para sanar necesitás algo que pertenece a alguien que no merece perderlo. No lo van a notar. No va a hacerles daño visible.',
        question: '¿Lo tomás porque tu necesidad es real, o respetás que lo que no es tuyo no te corresponde?',
        choices: [
          {
            key: 'A',
            label: 'Tomarlo. Tu necesidad es urgente y real.',
            consequence: 'Lo tomaste. Funcionó. No lo notaron. Vos sí notás que lo hiciste.',
            stateEffects: { trust: -5, tension: 12, bondScore: -5, guiltLoad: 18, pragmatism: 18, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No tomarlo. Hay límites que no se cruzan aunque no haya consecuencias.',
            consequence: 'Sanaste de otra forma. Más lento. Sin atajos.',
            stateEffects: { trust: 10, tension: 8, bondScore: 8, guiltLoad: 5, pragmatism: -15, empathy: 12 }
          }
        ]
      },
      {
        id: 'cen-08',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Podés sobrevivir dejando que alguien crea algo falso sobre vos. No los lastima directamente, pero construye tu seguridad sobre una mentira.',
        question: '¿Aceptás esa mentira como escudo, o preferís vivir expuesto antes que protegerte con algo falso?',
        choices: [
          {
            key: 'A',
            label: 'Aceptar la mentira. La supervivencia es lo primero.',
            consequence: 'Sobreviviste. La mentira se volvió parte de quién sos para esa persona. Hay que mantenerla.',
            stateEffects: { trust: -10, tension: 12, bondScore: -8, guiltLoad: 18, pragmatism: 18, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Rechazarla. Preferís el riesgo a la mentira.',
            consequence: 'Quedaste expuesto. Sobreviviste de todas formas, aunque costó más. O no sobreviviste igual.',
            stateEffects: { trust: 12, tension: 20, bondScore: 10, guiltLoad: 5, pragmatism: -15, empathy: 12 }
          }
        ]
      },
      {
        id: 'cen-09',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'Un grupo necesita a alguien que cargue con la culpa de algo que todos hicieron. Hay una persona que lo aceptaría. Nadie se lo está pidiendo todavía.',
        question: '¿Le preguntás si está dispuesta a ser el chivo expiatorio, o dejás que las cosas sigan su curso sin involucrarla?',
        choices: [
          {
            key: 'A',
            label: 'Preguntarle. Al menos que sea su decisión.',
            consequence: 'Aceptó. Cargó con algo que no era solo de ella. Los demás siguieron sin saberlo.',
            stateEffects: { trust: 5, tension: 22, bondScore: 5, guiltLoad: 20, pragmatism: -5, empathy: 10 }
          },
          {
            key: 'B',
            label: 'No involucrarla. No expongas a alguien que no pidió estar en esto.',
            consequence: 'Las consecuencias se repartieron de otra forma. No mejor ni peor. Diferente.',
            stateEffects: { trust: 8, tension: 15, bondScore: 8, guiltLoad: 8, pragmatism: -8, empathy: 15 }
          }
        ]
      },
      {
        id: 'cen-10',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Romper una promesa sería lo correcto. Mantenerla te destruye a vos pero protege a la persona a quien se la hiciste.',
        question: '¿Rompés la promesa y hacés lo que es correcto para vos, o la cumplís aunque eso te cueste todo?',
        choices: [
          {
            key: 'A',
            label: 'Romper la promesa. Las promesas no pueden ser cadenas.',
            consequence: 'La rompiste. Quien la recibió lo supo. Algo entre ustedes cambió permanentemente.',
            stateEffects: { trust: -15, tension: 18, bondScore: -15, guiltLoad: 18, pragmatism: 15, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Cumplirla. Una promesa es una promesa aunque duela.',
            consequence: 'La cumpliste. El costo fue real. La persona que la recibió no siempre supo cuánto.',
            stateEffects: { trust: 15, tension: 20, bondScore: 18, guiltLoad: 12, pragmatism: -15, empathy: 10 }
          }
        ]
      },
      {
        id: 'cen-11',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Alguien te salvó haciendo algo terrible en tu nombre, sin pedirte permiso. Lo que hicieron fue necesario. También fue imperdonable.',
        question: '¿Los perdonás porque el resultado importa, o el método siempre contamina el fin?',
        choices: [
          {
            key: 'A',
            label: 'Perdonarlos. Están vivos gracias a ellos.',
            consequence: 'Los perdonaste. Ellos no se perdonaron. Eso también se nota.',
            stateEffects: { trust: 8, tension: 15, bondScore: 10, guiltLoad: 10, pragmatism: 12, empathy: 15 }
          },
          {
            key: 'B',
            label: 'No perdonarlos. Lo que hicieron no tiene justificación.',
            consequence: 'No los perdonaste. Están vivos. Ustedes dos saben exactamente a qué costo.',
            stateEffects: { trust: -12, tension: 18, bondScore: -18, guiltLoad: 8, pragmatism: -5, empathy: -8 }
          }
        ]
      },
      {
        id: 'cen-12',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'Tu enemigo está a punto de caer por sus propios errores. Podés acelerarlo. O podés ver cómo cae sin que tu mano esté en eso.',
        question: '¿Participás en la caída, o dejás que sea solo de él?',
        choices: [
          {
            key: 'A',
            label: 'Participar. La caída llega antes y es más completa.',
            consequence: 'Cayó. Más rápido, más lejos. Vos sabés que tu mano estuvo ahí.',
            stateEffects: { trust: -5, tension: 12, bondScore: -8, guiltLoad: 15, pragmatism: 15, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Solo mirar. Que sus propios errores lo hagan caer.',
            consequence: 'Cayó igual. Sin que estuvieras ahí. No sabés si eso fue mejor o solo diferente.',
            stateEffects: { trust: 8, tension: 8, bondScore: 5, guiltLoad: 5, pragmatism: -8, empathy: 10 }
          }
        ]
      },
      {
        id: 'cen-13',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'La verdad sobre lo que pasó destruiría a alguien que no tuvo nada que ver pero que está construyendo su vida sobre una versión falsa de los hechos.',
        question: '¿Le decís la verdad y derrumbás lo que construyó, o la dejás vivir sobre algo que no es real?',
        choices: [
          {
            key: 'A',
            label: 'Decirle la verdad. Tiene derecho a saber sobre qué construye.',
            consequence: 'Lo que construyó se tambaleó. Si se cayó o no, dependió de cosas que no podías controlar.',
            stateEffects: { trust: 5, tension: 18, bondScore: -5, guiltLoad: 12, pragmatism: -5, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Dejarla así. Lo que no sabe no le hace daño todavía.',
            consequence: 'Siguió construyendo. Sobre lo falso. Más alto cada vez.',
            stateEffects: { trust: -5, tension: 12, bondScore: 5, guiltLoad: 18, pragmatism: 12, empathy: -8 }
          }
        ]
      },
      {
        id: 'cen-14',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Quedarte significa seguir peleando por algo que quizás ya se perdió. Irte significa sobrevivir con esa incertidumbre para siempre.',
        question: '¿Seguís hasta saber con certeza, o te vas antes de que la respuesta llegue a destruirte?',
        choices: [
          {
            key: 'A',
            label: 'Quedarse hasta el final. Necesitás saber.',
            consequence: 'Te quedaste. La respuesta llegó. No siempre fue la que esperabas.',
            stateEffects: { trust: 5, tension: 25, bondScore: 10, guiltLoad: 15, pragmatism: -10, empathy: 8 }
          },
          {
            key: 'B',
            label: 'Irte ahora. Algunas respuestas no vale la pena pagar.',
            consequence: 'Te fuiste sin saber. Esa incertidumbre todavía existe en algún lugar de vos.',
            stateEffects: { trust: -5, tension: 8, bondScore: -5, guiltLoad: 12, pragmatism: 12, empathy: 5 }
          }
        ]
      },
      {
        id: 'cen-15',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Una segunda oportunidad se presenta. Para tomarla tenés que ignorar lo que le pasó a alguien que la tuvo antes que vos y la perdió por las mismas razones.',
        question: '¿La tomás igual, o lo que le pasó a otro te impide arriesgar lo mismo?',
        choices: [
          {
            key: 'A',
            label: 'Tomarla. Las circunstancias de otro no definen las tuyas.',
            consequence: 'La tomaste. Lo que le pasó a ellos no te pasó a vos. No sabés todavía si fue suerte o diferencia real.',
            stateEffects: { trust: 5, tension: 15, bondScore: 5, guiltLoad: 10, pragmatism: 15, empathy: -5 }
          },
          {
            key: 'B',
            label: 'No tomarla. Lo que pasó antes es una advertencia real.',
            consequence: 'La dejaste pasar. Quizás fue prudencia. Quizás fue miedo. Ambas cosas pueden ser ciertas.',
            stateEffects: { trust: 8, tension: 8, bondScore: 0, guiltLoad: 8, pragmatism: -12, empathy: 8 }
          }
        ]
      }
    ]
  }
]

// ─── Perfiles Morales ──────────────────────────────────────────────────────

export const DILEMA_PROFILES = [
  {
    id: 'pragmatico',
    label: 'El Pragmático Frío',
    description: 'Tomaste las decisiones que funcionaban. No las que se sentían bien. Hay algo casi respetable en eso — y algo que incomoda bastante también.',
    conditions: { pragmatism: { min: 65 }, empathy: { max: 40 } }
  },
  {
    id: 'idealista-roto',
    label: 'El Idealista Roto',
    description: 'Intentaste hacer lo correcto en cada cruce. El problema es que lo correcto tenía un costo que no siempre pudiste pagar. Y lo pagaste igual.',
    conditions: { empathy: { min: 65 }, pragmatism: { max: 40 } }
  },
  {
    id: 'ajusticiador',
    label: 'El Ajusticiador',
    description: 'Cuando tuviste la oportunidad de cerrar el círculo, la cerraste. No buscaste validación para eso. Eso dice algo — no sé si es lo que querés escuchar.',
    conditions: { guiltLoad: { min: 55 }, pragmatism: { min: 55 } }
  },
  {
    id: 'guardian',
    label: 'El Guardián',
    description: 'Protegiste. Una y otra vez, a costa de vos mismo. La pregunta que no te hacés es: ¿quién te protegía a vos mientras hacías eso?',
    conditions: { bondScore: { min: 10 }, empathy: { min: 50 } }
  },
  {
    id: 'testigo',
    label: 'El Testigo',
    description: 'Estuviste presente en todo. No siempre actuaste. Eso también es una elección — una que tiene sus propias consecuencias.',
    conditions: { pragmatism: { max: 45 }, empathy: { max: 45 } }
  },
  {
    id: 'superviviente',
    label: 'El Superviviente',
    description: 'Saliste. Con lo que podías cargar, sin lo que no. Eso no es cobardía ni heroísmo. Es algo más complicado que ambas cosas.',
    conditions: {}
  }
]

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Selecciona `count` dilemas del pool de forma aleatoria,
 * intentando cubrir tipos distintos para mayor variedad.
 */
export function pickDilemas(pool, count = 4) {
  if (pool.length <= count) return [...pool]

  // Agrupar por tipo
  const byType = {}
  for (const d of pool) {
    if (!byType[d.type]) byType[d.type] = []
    byType[d.type].push(d)
  }

  const types = Object.keys(byType)
  const picked = []
  const usedIds = new Set()

  // Primera pasada: uno de cada tipo hasta alcanzar `count`
  const shuffledTypes = [...types].sort(() => Math.random() - 0.5)
  for (const type of shuffledTypes) {
    if (picked.length >= count) break
    const candidates = byType[type].filter(d => !usedIds.has(d.id))
    if (!candidates.length) continue
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    picked.push(chosen)
    usedIds.add(chosen.id)
  }

  // Segunda pasada: completar con aleatorios si faltan
  if (picked.length < count) {
    const remaining = pool.filter(d => !usedIds.has(d.id)).sort(() => Math.random() - 0.5)
    for (const d of remaining) {
      if (picked.length >= count) break
      picked.push(d)
    }
  }

  // Mezclar el orden final para que no sea siempre el mismo
  return picked.sort(() => Math.random() - 0.5)
}

export function calculateProfile(narrativeState) {
  const { pragmatism, empathy, guiltLoad, bondScore } = narrativeState

  for (const profile of DILEMA_PROFILES) {
    const c = profile.conditions
    const ok = (
      (c.pragmatism?.min == null || pragmatism >= c.pragmatism.min) &&
      (c.pragmatism?.max == null || pragmatism <= c.pragmatism.max) &&
      (c.empathy?.min == null    || empathy >= c.empathy.min) &&
      (c.empathy?.max == null    || empathy <= c.empathy.max) &&
      (c.guiltLoad?.min == null  || guiltLoad >= c.guiltLoad.min) &&
      (c.guiltLoad?.max == null  || guiltLoad <= c.guiltLoad.max) &&
      (c.bondScore?.min == null  || bondScore >= c.bondScore.min) &&
      (c.bondScore?.max == null  || bondScore <= c.bondScore.max)
    )
    if (ok) return profile
  }

  return DILEMA_PROFILES[DILEMA_PROFILES.length - 1]
}

export function applyStateEffects(current, effects) {
  return {
    trust:      clamp(current.trust      + (effects.trust      ?? 0), 0, 100),
    tension:    clamp(current.tension    + (effects.tension    ?? 0), 0, 100),
    bondScore:  clamp(current.bondScore  + (effects.bondScore  ?? 0), -50, 50),
    guiltLoad:  clamp(current.guiltLoad  + (effects.guiltLoad  ?? 0), 0, 100),
    pragmatism: clamp(current.pragmatism + (effects.pragmatism ?? 0), 0, 100),
    empathy:    clamp(current.empathy    + (effects.empathy    ?? 0), 0, 100)
  }
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}
