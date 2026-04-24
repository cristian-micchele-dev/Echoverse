// ─── Dilemas Morales — Data ────────────────────────────────────────────────
// Cada escenario tiene un pool de dilemas. Cada sesión selecciona 4 al azar
// asegurando variedad de tipos. Las reacciones del personaje son generadas por IA.

export const RECOMMENDED_CHAR_IDS = new Set([
  'walter-white', 'john-wick', 'darth-vader', 'sherlock',
  'tommy-shelby', 'katniss', 'eleven', 'hannibal', 'tyler-durden',
  'ragnar-lothbrok', 'el-profesor', 'jax-teller', 'la-novia',
  'geralt', 'jon-snow', 'gandalf', 'lara-croft', 'captain-america', 'deadpool'
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
  },

  // ─── Familia 3: Lealtad o Justicia ─────────────────────────────────────────
  {
    id: 'lealtad-o-justicia',
    title: 'Lealtad o Justicia',
    subtitle: 'Códigos. Traición. El precio de saber.',
    introVariants: [
      [
        'Hay cosas que sabés y que nunca debiste haber visto.',
        'Ahora ese conocimiento es tuyo. Y también su peso.',
        'La pregunta no es si hacés algo con lo que sabés.',
        'La pregunta es con qué versión de vos querés vivir después.'
      ],
      [
        'La lealtad no se declara. Se prueba cuando cuesta algo.',
        'Vos ya llegaste al momento en el que cuesta.',
        'De un lado: lo que alguien necesita de vos.',
        'Del otro: lo que vos necesitás de vos mismo.'
      ],
      [
        'Todos tienen un código. El problema es que los códigos colisionan.',
        'Alguien que confiaba en vos, alguien que debería poder confiar, alguien que no sabe nada.',
        'Y vos en el medio de todo eso, sabiendo lo que sabés.',
        'La justicia es fácil cuando no te cuesta nada.'
      ],
      [
        'Hay un precio para cada elección. Lo pagás ahora o lo pagás después.',
        'La lealtad ciega tiene sus propias consecuencias. La justicia fría también.',
        'Nadie sale limpio de estas decisiones.',
        '¿Desde dónde querés mirar hacia atrás?'
      ]
    ],
    dilemmaPool: [
      {
        id: 'lj-01',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Tu aliado más cercano hizo algo que no tiene vuelta atrás. Algo que, si se supiera, lo destruiría a él y a todo lo que construyeron juntos. Vos sos la única persona que lo sabe.',
        question: '¿Lo cubrís, o aceptás que la lealtad tiene límites y lo exponés?',
        choices: [
          {
            key: 'A',
            label: 'Cubrirlo. Lo que hizo no cambia lo que fue para vos.',
            consequence: 'Lo cubriste. Él lo sabe. Eso creó algo entre los dos que ninguno va a nombrar jamás.',
            stateEffects: { trust: -8, tension: 18, bondScore: 15, guiltLoad: 20, pragmatism: 12, empathy: -5 }
          },
          {
            key: 'B',
            label: 'Exponerlo. La lealtad no puede convertirse en complicidad.',
            consequence: 'Lo expusiste. Fue devastador para los dos. No sabés si hiciste lo correcto, pero sabés que no podías hacer otra cosa.',
            stateEffects: { trust: 10, tension: 25, bondScore: -20, guiltLoad: 15, pragmatism: 8, empathy: 10 }
          }
        ]
      },
      {
        id: 'lj-02',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Tu líder te ordenó algo. No es ilegal. Pero sabés que está mal, y que las consecuencias las van a pagar otros que no tienen voz en esto.',
        question: '¿Obedecés porque la estructura depende de que alguien diga que sí, o desafiás porque algunas cosas no se delegan?',
        choices: [
          {
            key: 'A',
            label: 'Obedecer. No podés ganar desde afuera si primero perdés el lugar desde donde peleás.',
            consequence: 'Obedeciste. El daño se hizo. Seguís adentro. Todavía no sabés si eso fue una estrategia o una rendición.',
            stateEffects: { trust: -5, tension: 15, bondScore: 5, guiltLoad: 18, pragmatism: 18, empathy: -12 }
          },
          {
            key: 'B',
            label: 'Desafiar. No hay posición que valga proteger a ese precio.',
            consequence: 'Desafiaste. Pagaste el costo. Lo que construiste con ese gesto todavía no tiene nombre.',
            stateEffects: { trust: 8, tension: 22, bondScore: -10, guiltLoad: 10, pragmatism: -12, empathy: 18 }
          }
        ]
      },
      {
        id: 'lj-03',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Podés salvar a alguien que no conocés o proteger a alguien que amás. El tiempo y la distancia hacen que no puedas hacer las dos cosas.',
        question: '¿La sangre —o lo que se construye como sangre— manda primero, o hay algo más grande que eso?',
        choices: [
          {
            key: 'A',
            label: 'Proteger a quien amás. No existe lealtad abstracta más grande que la concreta.',
            consequence: 'Los protegiste. El desconocido pagó un precio que nunca vas a conocer del todo. Eso también te pertenece ahora.',
            stateEffects: { trust: 5, tension: 20, bondScore: 18, guiltLoad: 25, pragmatism: 8, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Salvar al desconocido. La justicia no distingue quién te importa a vos.',
            consequence: 'Hiciste lo que podías defender en voz alta. El costo fue algo que no se puede defender en voz alta.',
            stateEffects: { trust: 8, tension: 15, bondScore: -12, guiltLoad: 18, pragmatism: -5, empathy: 18 }
          }
        ],
        affinityChoice: {
          minLevel: 3,
          choice: {
            key: 'C',
            label: 'Hay una tercera salida. Pero necesitás confiar completamente en alguien para que funcione.',
            consequence: 'Encontraste el camino que nadie más hubiera visto. Solo es posible cuando conocés bien el terreno — y a las personas que hay en él.',
            stateEffects: { trust: 15, tension: 12, bondScore: 20, guiltLoad: 8, pragmatism: 10, empathy: 10 }
          }
        }
      },
      {
        id: 'lj-04',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Alguien que en su momento se jugó por vos ahora necesita algo de vuelta. Lo que piden compromete algo tuyo que no querés comprometer.',
        question: '¿Las deudas de lealtad tienen fecha de vencimiento, o se pagan aunque el precio ya no sea el mismo?',
        choices: [
          {
            key: 'A',
            label: 'Pagarla. Una deuda es una deuda, y no elegís cuándo se cobra.',
            consequence: 'Pagaste. La deuda se cerró. Lo que perdiste para pagarla todavía está abierto.',
            stateEffects: { trust: 5, tension: 12, bondScore: 12, guiltLoad: 15, pragmatism: -8, empathy: 12 }
          },
          {
            key: 'B',
            label: 'No pagarla. Lo que debías era a una versión anterior de los dos.',
            consequence: 'No pagaste. Eso también tiene un precio. Uno que todavía estás calculando.',
            stateEffects: { trust: -10, tension: 10, bondScore: -15, guiltLoad: 20, pragmatism: 15, empathy: -10 }
          }
        ]
      },
      {
        id: 'lj-05',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Descubrís que la causa por la que te jugaste —y pediste a otros que se jugaran— estaba basada en algo falso desde el principio. No una distorsión. Una mentira calculada.',
        question: '¿Asumís la responsabilidad de lo que construiste sobre esa base, o priorizás exponerla aunque el derrumbe sea total?',
        choices: [
          {
            key: 'A',
            label: 'Asumir la responsabilidad. No podés controlar la base, pero sí lo que construiste sobre ella.',
            consequence: 'Te hiciste cargo. El edificio no se cayó. Lo que construiste cambió de forma cuando supiste en qué estaba parado.',
            stateEffects: { trust: 8, tension: 20, bondScore: 10, guiltLoad: 22, pragmatism: 10, empathy: 5 }
          },
          {
            key: 'B',
            label: 'Exponerla. Todo lo construido sobre una mentira merece caer.',
            consequence: 'La expusiste. El derrumbe fue real. Algo nuevo va a tener que construirse. Quizás ya empezó.',
            stateEffects: { trust: 15, tension: 28, bondScore: -8, guiltLoad: 12, pragmatism: 5, empathy: 8 }
          }
        ]
      },
      {
        id: 'lj-06',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Alguien cometió algo que te afecta directamente. Denunciarlo destruiría algo que construyeron juntos durante años. Quedarte callado también te destruye, pero de otra forma.',
        question: '¿La justicia personal tiene que esperar cuando lo que está en juego afecta a más personas que vos?',
        choices: [
          {
            key: 'A',
            label: 'Denunciarlo. Lo construido sobre la impunidad de alguien no merece sobrevivir.',
            consequence: 'Lo denunciaste. Lo que construyeron juntos no sobrevivió. Tampoco estás seguro de que debía haberlo hecho.',
            stateEffects: { trust: 10, tension: 22, bondScore: -18, guiltLoad: 15, pragmatism: 5, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Quedarte callado. Hay cosas más grandes que el ajuste de cuentas propio.',
            consequence: 'Te quedaste callado. Eso también te cambió. No de la forma en que te lo prometiste cuando tomaste la decisión.',
            stateEffects: { trust: -8, tension: 15, bondScore: 8, guiltLoad: 25, pragmatism: 12, empathy: -5 }
          }
        ]
      }
    ]
  },

  // ─── Familia 4: El Precio del Poder ────────────────────────────────────────
  {
    id: 'el-precio-del-poder',
    title: 'El Precio del Poder',
    subtitle: 'Decisiones que solo vos podés tomar. Y que solo vos vas a cargar.',
    introVariants: [
      [
        'Tenés poder. No como privilegio: como herramienta que algún día alguien eligió ponerte en la mano.',
        'Y las herramientas tienen un uso. Y ese uso tiene consecuencias.',
        'Las decisiones que tomás desde donde estás no solo te afectan a vos.',
        '¿Cuánto de eso sos capaz de cargar?'
      ],
      [
        'El poder no se lleva bien con la inocencia.',
        'Para llegar a donde estás tuviste que dejar algo atrás. Para quedarte, también.',
        'Las decisiones que nadie más puede tomar ahora son tuyas.',
        'El problema no es si sos capaz de tomarlas. Es si podés vivir con haberlas tomado.'
      ],
      [
        'Mandar es saber que siempre hay alguien pagando las consecuencias de tus elecciones.',
        'Alguien que no eligió estar en esa posición.',
        'Vos sí elegiste. O no supiste a qué estabas diciendo que sí.',
        '¿Lo sabés ahora?'
      ],
      [
        'Las decisiones difíciles son las únicas que importan.',
        'Las fáciles las puede tomar cualquiera.',
        'Las tuyas no lo son. Y tampoco lo son las personas que afectan.',
        'Eso es lo que hace que este momento sea lo que es.'
      ]
    ],
    dilemmaPool: [
      {
        id: 'pp-01',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'Podés sacrificar a uno para salvar a muchos. La persona que vas a sacrificar confía en vos. Las que vas a salvar no saben que existís.',
        question: '¿Los números mandan, o hay un punto en el que la aritmética del poder se convierte en algo que no querés ser?',
        choices: [
          {
            key: 'A',
            label: 'Los números mandan. Desde donde estás, es lo único que podés defender sin mentirte.',
            consequence: 'Lo hiciste. Los números salieron bien. La persona que confiaba en vos ya no puede confiar en nadie.',
            stateEffects: { trust: -10, tension: 25, bondScore: -15, guiltLoad: 28, pragmatism: 22, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Hay una línea. Y del otro lado de esa línea no querés estar.',
            consequence: 'No cruzaste la línea. El costo fue diferente. Algunas de esas personas que ibas a salvar pagaron algo que no debían.',
            stateEffects: { trust: 5, tension: 20, bondScore: 5, guiltLoad: 20, pragmatism: -18, empathy: 18 }
          }
        ]
      },
      {
        id: 'pp-02',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'La verdad hundiría la moral de los que dependen de vos en el peor momento posible. La mentira los mantiene en movimiento. Por ahora.',
        question: '¿El liderazgo incluye decidir qué verdades son demasiado pesadas para que otros las carguen en este momento?',
        choices: [
          {
            key: 'A',
            label: 'Sí. Algunos momentos requieren que alguien cargue la verdad solo para que los demás puedan seguir.',
            consequence: 'Los mantuviste en movimiento. Con una versión de la realidad que vos construiste para que pudieran funcionar. Eso también te pertenece.',
            stateEffects: { trust: -8, tension: 15, bondScore: 5, guiltLoad: 20, pragmatism: 18, empathy: -8 }
          },
          {
            key: 'B',
            label: 'No. La gente tiene derecho a elegir con qué información se mueve.',
            consequence: 'Se los dijiste. Algunos se pararon. Otros siguieron con más peso del que deberían cargar. No sabés todavía cuál fue la diferencia.',
            stateEffects: { trust: 12, tension: 22, bondScore: -5, guiltLoad: 12, pragmatism: -12, empathy: 15 }
          }
        ]
      },
      {
        id: 'pp-03',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Podrías salir ahora. Conservar lo que todavía no está manchado. O quedarte y seguir siendo el engranaje que hace funcionar algo que te da asco, pero que sin vos sería peor.',
        question: '¿Quedarse es resistencia o complicidad? ¿Irse es integridad o abandono?',
        choices: [
          {
            key: 'A',
            label: 'Quedarse. Irse es el lujo del que no tiene que responder por lo que deja atrás.',
            consequence: 'Te quedaste. Seguís siendo el engranaje. No sabés en qué momento ese rol dejó de ser una decisión y se convirtió en una identidad.',
            stateEffects: { trust: -5, tension: 18, bondScore: 8, guiltLoad: 22, pragmatism: 20, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Irse. Hay cosas que no podés salvar desde adentro sin perder lo que te hacía diferente.',
            consequence: 'Te fuiste. Lo que dejaste atrás siguió sin vos. Diferente, quizás peor, quizás igual. No te lo van a decir.',
            stateEffects: { trust: 10, tension: 15, bondScore: -10, guiltLoad: 15, pragmatism: -15, empathy: 12 }
          }
        ]
      },
      {
        id: 'pp-04',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Hay alguien en tu equipo que es mejor que vos en esto. Si lo promovés, perdés tu posición. Si no lo hacés, el sistema funciona peor, y vos seguís donde estás.',
        question: '¿El poder bien ejercido incluye reconocer cuándo alguien más debería tenerlo?',
        choices: [
          {
            key: 'A',
            label: 'Promoverlo. El sistema importa más que tu lugar en él.',
            consequence: 'Lo promoviste. El sistema mejoró. Tu lugar cambió. Todavía estás decidiendo si eso fue generosidad o resignación.',
            stateEffects: { trust: 12, tension: 15, bondScore: 10, guiltLoad: 8, pragmatism: 5, empathy: 15 }
          },
          {
            key: 'B',
            label: 'No promoverlo. El sistema siempre va a necesitar a alguien que sepa cómo funciona desde adentro.',
            consequence: 'No lo promoviste. El sistema siguió. Vos también. Esa justificación todavía necesita un poco más de trabajo.',
            stateEffects: { trust: -5, tension: 12, bondScore: -8, guiltLoad: 18, pragmatism: 15, empathy: -12 }
          }
        ],
        affinityChoice: {
          minLevel: 3,
          choice: {
            key: 'C',
            label: 'Construir algo diferente con él. Sin jerarquías que alguno de los dos tenga que perder.',
            consequence: 'Lo que armaron no tiene precedente. Tampoco tiene garantías. Pero tiene algo que las otras opciones no podían darte.',
            stateEffects: { trust: 15, tension: 10, bondScore: 18, guiltLoad: 5, pragmatism: 10, empathy: 12 }
          }
        }
      },
      {
        id: 'pp-05',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'El sistema que construiste empieza a funcionar sin vos. No porque falló, sino porque funcionó demasiado bien. Podés intervenir y controlarlo. O dejarlo crecer y aceptar que ya no te necesita.',
        question: '¿El creador tiene derecho a moldear lo que creó una vez que ya tiene vida propia?',
        choices: [
          {
            key: 'A',
            label: 'Intervenir. Nada de lo que se construyó puede ignorar la dirección del que lo construyó.',
            consequence: 'Interveniste. Lo que tenía vida propia ahora tiene tu mano de vuelta. No sabés si eso lo hizo mejor o solo más tuyo.',
            stateEffects: { trust: -5, tension: 18, bondScore: 5, guiltLoad: 12, pragmatism: 18, empathy: -8 }
          },
          {
            key: 'B',
            label: 'Dejarlo crecer. Construiste algo que puede vivir sin vos. Esa es la única victoria real.',
            consequence: 'Lo dejaste. Creció en direcciones que no esperabas. Algunas te gustaron. Otras no. Ya no era completamente tuyo. Quizás nunca lo fue.',
            stateEffects: { trust: 10, tension: 10, bondScore: -5, guiltLoad: 8, pragmatism: -10, empathy: 15 }
          }
        ]
      },
      {
        id: 'pp-06',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Una victoria posible requiere un costo que sabés que te va a cambiar. No el tipo de cambio que podés racionalizar después. El tipo que simplemente sos, de manera diferente, desde ese momento en adelante.',
        question: '¿Hay victorias que no vale la pena ganar si el precio es dejar de reconocerte?',
        choices: [
          {
            key: 'A',
            label: 'Vale la pena. El que eras antes de esa decisión no tenía acceso a lo que viene después.',
            consequence: 'Pagaste el precio. Ganaste. Sos diferente ahora. Todavía estás midiendo si "diferente" era lo que querías decir con "necesario".',
            stateEffects: { trust: -5, tension: 22, bondScore: -5, guiltLoad: 25, pragmatism: 22, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No vale la pena. Una victoria que requiere dejar de ser reconocible no es una victoria.',
            consequence: 'No la tomaste. El costo fue otro. No menor. Pero al menos fue uno que reconocés como tuyo.',
            stateEffects: { trust: 8, tension: 15, bondScore: 5, guiltLoad: 12, pragmatism: -18, empathy: 15 }
          }
        ]
      }
    ]
  },

  // ─── Escenario 5: Verdades Incómodas ──────────────────────────────────────
  {
    id: 'verdades-incomodas',
    title: 'Verdades Incómodas',
    subtitle: 'Secretos. Silencios. Lo que sabés y no decís.',
    introVariants: [
      [
        'Sabés algo que no deberías saber, o algo que deberías haber dicho hace tiempo.',
        'La verdad no siempre llega en el momento justo.',
        'A veces llega tarde. A veces llega antes de que alguien esté listo.',
        'Y vos tenés que decidir si decirla cambia algo o solo cambia el daño.'
      ],
      [
        'Hay cosas que se guardan para proteger. Y cosas que se guardan por miedo.',
        'La diferencia, desde adentro, no siempre es tan clara.',
        'Lo que callaste moldeó lo que vino después.',
        'Ahora tenés la chance de hablar. La pregunta es si hacerlo sirve para algo.'
      ],
      [
        'Callarse también es una decisión.',
        'Y como toda decisión, tiene un peso que no se distribuye parejo.',
        'Alguien siempre paga por lo que otro no dice.',
        '¿Cuánto vale la verdad cuando el daño ya está hecho?'
      ],
      [
        'La verdad incómoda no pide permiso para existir.',
        'Lo que pedís es decidir qué hacés con ella.',
        'Decirla, guardarla, o vivir en el espacio exacto entre las dos.',
        'Ninguna de las tres opciones sale gratis.'
      ]
    ],
    dilemmaPool: [
      {
        id: 'vi-01',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Una persona cercana está construyendo algo importante sobre una historia que no es del todo cierta. No sabe que sabés. La historia no daña a nadie... todavía.',
        question: '¿Dejás que siga construyendo sobre eso, o le decís lo que sabés aunque destruyas lo que ya armó?',
        choices: [
          {
            key: 'A',
            label: 'Decirle. La verdad es la verdad aunque llegue tarde.',
            consequence: 'Lo escuchó. Tardó un momento en procesar. Lo que construyó se tambaleó, pero no cayó. Todavía no sabe si eso es bueno o malo.',
            stateEffects: { trust: -5, tension: 14, bondScore: -5, guiltLoad: 8, pragmatism: -8, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Callarte. Nadie sale ganando de una verdad que ya no cambia nada.',
            consequence: 'Siguió construyendo. Vos seguiste sabiendo. Esa distancia entre los dos ahora tiene nombre, aunque ninguno lo diga.',
            stateEffects: { trust: 8, tension: 6, bondScore: 5, guiltLoad: 14, pragmatism: 10, empathy: -8 }
          }
        ]
      },
      {
        id: 'vi-02',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Tu aliado más confiable te mintió durante meses para protegerte de algo que nunca llegó. La intención fue buena. Un tercero pagó el costo sin saber nada.',
        question: '¿Lo confrontás y exponés lo que hizo, o absorbés el impacto y seguís como si no supieras?',
        choices: [
          {
            key: 'A',
            label: 'Confrontarlo. La intención no exonera el daño.',
            consequence: 'Lo confrontaste. Lo reconoció. Eso no alcanzó para borrar lo que hizo ni para borrar que vos lo necesitabas creer incapaz de hacerlo.',
            stateEffects: { trust: -12, tension: 18, bondScore: -12, guiltLoad: 6, pragmatism: 8, empathy: 10 }
          },
          {
            key: 'B',
            label: 'Absorberlo. La lealtad se construye también sobre lo que perdonás sin decirlo.',
            consequence: 'No dijiste nada. El tercero sigue sin saber. Vos seguís sabiendo. La lealtad que tenían tiene ahora un peso diferente.',
            stateEffects: { trust: 5, tension: 10, bondScore: 8, guiltLoad: 18, pragmatism: 12, empathy: -5 }
          }
        ]
      },
      {
        id: 'vi-03',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Tenés información que liberaría a alguien que está pagando por algo que no hizo. Revelarla implica admitir que callaste durante meses mientras eso pasaba.',
        question: '¿Hablás ahora y admitís lo que callaste, o dejás que el tiempo haga lo que vos no pudiste hacer?',
        choices: [
          {
            key: 'A',
            label: 'Hablar ahora. El daño de callarse no para de crecer.',
            consequence: 'Hablaste. La persona quedó libre. Lo que salió sobre vos también. Algunas miradas cambiaron. No todas para bien.',
            stateEffects: { trust: -8, tension: 20, bondScore: -8, guiltLoad: 22, pragmatism: -5, empathy: 18 }
          },
          {
            key: 'B',
            label: 'Callarte. Tu silencio no fue malicia — fue cobardía, y eso ya no tiene arreglo con una confesión tardía.',
            consequence: 'Seguiste callado. La persona sigue pagando. Vos seguís cargando con lo que callaste. Una de las dos cargas es más pesada.',
            stateEffects: { trust: 5, tension: 8, bondScore: 0, guiltLoad: 30, pragmatism: 15, empathy: -12 }
          }
        ]
      },
      {
        id: 'vi-04',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Para mantenerte donde estás necesitás información que tiene alguien de confianza. Pedírsela directamente te expone. Conseguirla de otra forma la traiciona.',
        question: '¿La pedís de frente aunque te exponga, o la conseguís igual aunque eso te cambie?',
        choices: [
          {
            key: 'A',
            label: 'Pedirla de frente. Lo que hacés para protegerte dice más de vos que lo que protegés.',
            consequence: 'Se la pediste. Se sorprendió. Te la dio. No sabés si fue confianza o si fue que no tuvo tiempo de negarse.',
            stateEffects: { trust: 10, tension: 12, bondScore: 8, guiltLoad: 5, pragmatism: -8, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Conseguirla igual. Sobrevivir primero, procesar después.',
            consequence: 'La conseguiste. Funcionó. Nadie lo sabe. Pero vos sabés exactamente lo que cruzaste para llegar hasta acá.',
            stateEffects: { trust: -8, tension: 15, bondScore: -10, guiltLoad: 20, pragmatism: 18, empathy: -10 }
          }
        ]
      },
      {
        id: 'vi-05',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'Las pruebas que tenés absolverían a alguien de un cargo menor pero lo expondrían a un proceso por algo mucho más grave. La ley pide que las presentes.',
        question: '¿Las presentás porque es lo que corresponde, o las guardás porque lo que corresponde no siempre es lo correcto?',
        choices: [
          {
            key: 'A',
            label: 'Presentarlas. El sistema no es perfecto pero existe por algo.',
            consequence: 'Las presentaste. El cargo menor desapareció. El proceso mayor empezó. No sabés si eso es lo que buscabas o lo que se merecía.',
            stateEffects: { trust: 5, tension: 22, bondScore: -5, guiltLoad: 15, pragmatism: 8, empathy: -5 }
          },
          {
            key: 'B',
            label: 'Guardarlas. Activar la ley sobre alguien cuando sabés lo que viene no es justicia.',
            consequence: 'Las guardaste. El cargo menor siguió. Lo más grave quedó sin proceso. No sabés si eso es protegerlo o protegerte a vos.',
            stateEffects: { trust: -5, tension: 10, bondScore: 5, guiltLoad: 20, pragmatism: -10, empathy: 8 }
          }
        ]
      },
      {
        id: 'vi-06',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Alguien que murió creyó algo falso sobre vos hasta el final. Esa persona nunca va a saber. Decirles la verdad a quienes quedan no cambia nada concreto, solo el dolor.',
        question: '¿Corregís la historia aunque no sirva para nada, o la dejás como estaba porque el muerto merece lo que creyó?',
        choices: [
          {
            key: 'A',
            label: 'Corregirla. La verdad no depende de si le sirve a alguien.',
            consequence: 'Corregiste la historia. Los que quedaron la procesaron de formas distintas. Algunas te acercaron. Otras te alejaron. La verdad hizo lo que siempre hace.',
            stateEffects: { trust: -5, tension: 12, bondScore: -8, guiltLoad: 10, pragmatism: -10, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Dejarla. Hay cosas que se mueren con quien las tenía.',
            consequence: 'Dejaste la historia como estaba. El muerto se quedó con su versión. Vos te quedaste con la tuya. Esa diferencia solo existe en vos.',
            stateEffects: { trust: 8, tension: 5, bondScore: 5, guiltLoad: 15, pragmatism: 12, empathy: -8 }
          }
        ]
      },
      {
        id: 'vi-07',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Alguien en quien no confiabas te reveló un secreto de alguien en quien sí confiás. Lo hizo "para ayudarte". Esa información cambia todo lo que creías saber.',
        question: '¿Usás lo que te dieron aunque venga de donde viene, o lo ignorás porque el precio fue la confianza de alguien más?',
        choices: [
          {
            key: 'A',
            label: 'Usarla. La fuente no invalida la información.',
            consequence: 'La usaste. Funcionó. La persona en quien confiabas nunca supo que alguien la vendió. Vos sí sabés, y eso cambia cómo la mirás.',
            stateEffects: { trust: -10, tension: 15, bondScore: -8, guiltLoad: 18, pragmatism: 20, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Ignorarla. Una lealtad que se vende fácil no debería comprarse.',
            consequence: 'La ignoraste. La información se quedó sin usar. No sabés cuánto te costó. Tampoco sabés si la persona en quien confiabas lo habría apreciado.',
            stateEffects: { trust: 12, tension: 8, bondScore: 10, guiltLoad: 5, pragmatism: -12, empathy: 12 }
          }
        ]
      },
      {
        id: 'vi-08',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Tu silencio en el momento justo permitió que alguien tomara una decisión basada en información incompleta. Esa decisión les salió muy cara. No sabían que vos sabías.',
        question: '¿Lo admitís ahora aunque lo cambie todo entre ustedes, o lo cargás solo porque la verdad a destiempo solo crea más daño?',
        choices: [
          {
            key: 'A',
            label: 'Admitirlo. Cargar con eso solo es una forma de castigo que no te decidiste a aceptar.',
            consequence: 'Lo admitiste. La reacción fue lo que esperabas. Algo se rompió. No sabés si lo que quedó en pie es más real que lo que era antes.',
            stateEffects: { trust: -15, tension: 20, bondScore: -15, guiltLoad: 25, pragmatism: -5, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Cargarlo. A veces el precio de callarse es propio y no se puede redistribuir.',
            consequence: 'Lo cargaste. La relación siguió. Vos cambiaste. Esa carga no es visible para nadie excepto para vos cada vez que los ves.',
            stateEffects: { trust: 8, tension: 10, bondScore: 5, guiltLoad: 30, pragmatism: 15, empathy: -8 }
          }
        ]
      },
      {
        id: 'vi-09',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Años de una versión consistente de los hechos te protegieron. Decir la verdad ahora no arregla nada concreto, pero expone años de omisión.',
        question: '¿Corregís el registro aunque eso te exponga, o sostenés la versión porque a estas alturas cambiarla cuesta más de lo que vale?',
        choices: [
          {
            key: 'A',
            label: 'Corregirla. Una mentira que vivió demasiado tiempo ya pesaba de todas formas.',
            consequence: 'Corregiste el registro. Lo que salió fue lo que esperabas. La versión nueva se sostiene peor que la anterior, pero al menos es tuya.',
            stateEffects: { trust: -8, tension: 25, bondScore: -8, guiltLoad: 22, pragmatism: -10, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Sostenerla. Hay un punto en que la versión que sobrevivió es la única que importa.',
            consequence: 'La sostuviste. La versión aguantó. Lo que no aguantó igual fue algo interno que habías estado ignorando con éxito hasta ahora.',
            stateEffects: { trust: 8, tension: 8, bondScore: 5, guiltLoad: 20, pragmatism: 18, empathy: -10 }
          }
        ]
      },
      {
        id: 'vi-10',
        type: 'law_vs_justice',
        roundLabel: 'DILEMA',
        setup: 'La normativa te obliga a reportar. Si reportás, una vida que ya fue bastante destruida queda expuesta de una forma que no tiene vuelta atrás.',
        question: '¿Cumplís porque las reglas existen por algo, o no reportás porque a veces las reglas le llegan tarde a la realidad?',
        choices: [
          {
            key: 'A',
            label: 'Cumplir. La estructura existe para casos donde el individuo no puede ver claro.',
            consequence: 'Reportaste. El proceso se activó. La vida que ya estaba rota ahora tiene una exposición nueva. No sabés si el sistema va a hacer algo útil con eso.',
            stateEffects: { trust: 5, tension: 18, bondScore: -5, guiltLoad: 20, pragmatism: 12, empathy: -8 }
          },
          {
            key: 'B',
            label: 'No reportar. Hay casos donde la norma no alcanza para contener lo que está pasando.',
            consequence: 'No reportaste. La normativa quedó incumplida. La vida en cuestión no sabe que alguien tomó esa decisión por ella. Tampoco sabe que le debería algo.',
            stateEffects: { trust: -5, tension: 8, bondScore: 8, guiltLoad: 15, pragmatism: -12, empathy: 15 }
          }
        ]
      },
      {
        id: 'vi-11',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'La persona que más querés tiene una imagen de sí misma que no se sostiene con lo que vos sabés. Esa imagen los sostiene. También los ciega.',
        question: '¿Le decís lo que ves aunque fracture algo que los mantiene de pie, o respetás la historia que eligieron contarse?',
        choices: [
          {
            key: 'A',
            label: 'Decirlo. La verdad que no se dice se convierte en distancia.',
            consequence: 'Lo dijiste. La imagen tembló. No se rompió del todo. Pero ahora los dos saben que vos lo sabías y callaste hasta este momento.',
            stateEffects: { trust: -8, tension: 18, bondScore: -10, guiltLoad: 8, pragmatism: -5, empathy: 18 }
          },
          {
            key: 'B',
            label: 'Callarlo. Hay imágenes que no son mentiras: son lo que alguien necesita creer para seguir.',
            consequence: 'Callaste. Siguieron. La imagen siguió sosteniéndolos. Vos seguiste viendo la grieta que ellos no ven. Eso también es una forma de distancia.',
            stateEffects: { trust: 8, tension: 8, bondScore: 8, guiltLoad: 12, pragmatism: 8, empathy: -5 }
          }
        ]
      },
      {
        id: 'vi-12',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Descubrís que quien te salvó en el peor momento tenía razones propias para hacerlo. El acto fue real. La motivación no era lo que te dijeron.',
        question: '¿Cambia eso lo que sentís por lo que hicieron, o el acto vale independientemente de lo que había detrás?',
        choices: [
          {
            key: 'A',
            label: 'Cambia. Lo que alguien hace por vos importa diferente si lo hizo por sí mismo.',
            consequence: 'Le dijiste que sabías. No negó. Tampoco pidió disculpas. Lo que creías que era deuda dejó de serlo de una forma que no sabés si te alivia o te vacía.',
            stateEffects: { trust: -12, tension: 15, bondScore: -15, guiltLoad: 8, pragmatism: 10, empathy: 5 }
          },
          {
            key: 'B',
            label: 'No cambia. Juzgar motivos en vez de actos es una forma cómoda de no agradecer.',
            consequence: 'No dijiste nada. El acto siguió siendo real. La motivación siguió siendo lo que era. Decidiste que lo primero pesa más que lo segundo.',
            stateEffects: { trust: 10, tension: 5, bondScore: 10, guiltLoad: 10, pragmatism: -5, empathy: 12 }
          }
        ]
      },
      {
        id: 'vi-13',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Para ganarte la confianza de alguien que necesitabas, usaste información sobre una tercera persona. Esa persona nunca autorizó que se usara. A todos les sirvió menos a ella.',
        question: '¿Confesás lo que hiciste, o cargás con eso como parte del precio de llegar a donde llegaste?',
        choices: [
          {
            key: 'A',
            label: 'Confesarlo. Seguir construyendo sobre eso es construir sobre algo que no te pertenecía.',
            consequence: 'Confesaste. La reacción fue dura. Lo que se construyó sobre eso tambaleó pero no cayó. El precio de la honestidad tardía es siempre más caro que la honestidad a tiempo.',
            stateEffects: { trust: -10, tension: 18, bondScore: -10, guiltLoad: 20, pragmatism: -8, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Cargarlo. Arrepentirse en voz alta a veces es más para uno que para quien fue afectado.',
            consequence: 'Lo cargaste. Lo construido siguió en pie. La persona que pagó el costo nunca lo supo. Vos sí. Eso es exactamente lo que decidiste cuando elegiste cargar en silencio.',
            stateEffects: { trust: 5, tension: 10, bondScore: 5, guiltLoad: 28, pragmatism: 15, empathy: -10 }
          }
        ]
      },
      {
        id: 'vi-14',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Hay una grieta en tu historia. Taparla hoy lastima a alguien que no tiene nada que ver. Dejarla abierta te destruye a vos.',
        question: '¿Tapás la grieta aunque eso dañe a alguien inocente, o la dejás porque no podés protegerte a costa de otro?',
        choices: [
          {
            key: 'A',
            label: 'Taparla. A veces la única opción disponible es la que menos querés.',
            consequence: 'Tapaste la grieta. El inocente pagó el costo. No lo sabe. La historia siguió en pie. Vos también seguiste en pie con algo nuevo que cargar.',
            stateEffects: { trust: -8, tension: 20, bondScore: -5, guiltLoad: 25, pragmatism: 20, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Dejarla. Hay cosas que no podés hacer aunque te cuesten todo.',
            consequence: 'La dejaste. La grieta se abrió. Pagaste el costo. El inocente quedó fuera del daño. Hay algo que se siente extrañamente limpio en eso, aunque duela.',
            stateEffects: { trust: 10, tension: 15, bondScore: 8, guiltLoad: 10, pragmatism: -18, empathy: 18 }
          }
        ]
      },
      {
        id: 'vi-15',
        type: 'truth_vs_loyalty',
        roundLabel: 'DILEMA',
        setup: 'Tenés algo que decir que cambiaría la forma en que alguien ve su propia historia. No su futuro: su pasado. Lo que ya pasó no se puede deshacer con una verdad tardía.',
        question: '¿Se lo decís porque tienen derecho a saber, o lo guardás porque algunos derechos llegan después de que ya no sirven para nada?',
        choices: [
          {
            key: 'A',
            label: 'Decírselo. Saber siempre vale más que no saber, aunque duela.',
            consequence: 'Se lo dijiste. Tardó en procesarlo. Su historia cambió de forma. No mejoró. No empeoró. Se volvió más real, que es lo más cerca que la historia llega de la verdad.',
            stateEffects: { trust: -5, tension: 15, bondScore: -5, guiltLoad: 12, pragmatism: -8, empathy: 20 }
          },
          {
            key: 'B',
            label: 'Guardarlo. Hay verdades que solo crean dolor sin dar nada a cambio.',
            consequence: 'Lo guardaste. Siguió con su versión. Más incompleta, más sostenible. A veces el silencio es lo más considerado que podés hacer.',
            stateEffects: { trust: 8, tension: 5, bondScore: 8, guiltLoad: 15, pragmatism: 10, empathy: -5 }
          }
        ],
        affinityChoice: {
          minLevel: 2,
          choice: {
            key: 'C',
            label: 'Decírselo, pero solo lo que pueden procesar ahora. El resto puede esperar.',
            consequence: 'Le dijiste una parte. La suficiente para que la historia sea más real sin romperse. No sabés si eso fue valentía o una forma refinada de seguir cuidándote.',
            stateEffects: { trust: 5, tension: 10, bondScore: 10, guiltLoad: 8, pragmatism: 5, empathy: 15 }
          }
        }
      }
    ]
  },

  // ─── Escenario 6: El Límite ────────────────────────────────────────────────
  {
    id: 'el-limite',
    title: 'El Límite',
    subtitle: 'Hasta dónde llegás. Qué cruzaría la línea que juraste no cruzar.',
    introVariants: [
      [
        'Dijiste que había cosas que no ibas a hacer.',
        'Eso fue antes de que la situación te pusiera exactamente frente a esas cosas.',
        'Ahora tenés que decidir si esa línea era real o era algo que te dijiste para sentirte distinto.',
        'El límite no desaparece. Pero la distancia a él cambia.'
      ],
      [
        'Todos tienen un límite hasta que tienen que encontrarlo de verdad.',
        'No en abstracto. En concreto, con peso, con consecuencias, con alguien mirando.',
        'Lo que hacés cuando llegás ahí no es una sorpresa para nadie que te conozca bien.',
        'Puede serlo para vos.'
      ],
      [
        'La línea que dijiste que no ibas a cruzar estaba cómoda cuando no había nada del otro lado.',
        'Ahora hay algo.',
        'Y la pregunta es si esa línea era un principio o era solo la distancia entre vos y la tentación.',
        'Vas a averiguarlo ahora.'
      ],
      [
        'Hay decisiones que no se practican. Llegan y ya.',
        'Lo que sos en ese momento es lo que sos.',
        'No lo que dijiste que ibas a ser. No lo que te imaginaste siendo.',
        'Lo que hacés cuando ya no hay tiempo de pensarlo.'
      ]
    ],
    dilemmaPool: [
      {
        id: 'el-01',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'Podés evitar que algo grave les pase a varios si actuás sobre alguien que todavía no hizo nada. La lógica es limpia. El acto no.',
        question: '¿Actuás sobre alguien inocente para proteger a varios, o esperás que el daño sea real antes de intervenir?',
        choices: [
          {
            key: 'A',
            label: 'Actuar. Un inocente contra varios inocentes sigue siendo una cuenta.',
            consequence: 'Actuaste. Los varios quedaron protegidos. El inocente pagó un precio que no eligió. La cuenta salió. Eso no la hace limpia.',
            stateEffects: { trust: -5, tension: 25, bondScore: -5, guiltLoad: 28, pragmatism: 22, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Esperar. Actuar sobre quien todavía no hizo nada cruza una línea que no se descrucza.',
            consequence: 'Esperaste. El daño llegó. Los varios lo pagaron. Vos te quedaste con el principio intacto y el resultado encima.',
            stateEffects: { trust: 8, tension: 18, bondScore: 5, guiltLoad: 15, pragmatism: -18, empathy: 10 }
          }
        ]
      },
      {
        id: 'el-02',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'Finalmente tenés al alcance hacerle pagar de verdad a quien destruyó algo que amabas. El precio de hacerlo es ser, al menos en ese momento, exactamente lo que pasaste años odiando.',
        question: '¿Lo hacés aunque seas por un momento exactamente lo que decías que no ibas a ser?',
        choices: [
          {
            key: 'A',
            label: 'Hacerlo. Hay daños que solo se cierran así y el precio es tuyo.',
            consequence: 'Lo hiciste. El círculo se cerró. El precio fue lo que esperabas. Ahora tenés los dos: lo que cerraste y lo en lo que te convertiste para cerrarlo.',
            stateEffects: { trust: -5, tension: 20, bondScore: -5, guiltLoad: 25, pragmatism: 20, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No hacerlo. Lo que sos cuando no tenés que serlo dice más que lo que hacés cuando tenés razón.',
            consequence: 'No lo hiciste. La oportunidad pasó. Algo quedó sin cerrar. También quedó algo que no se convirtió en lo que odiabas, y eso no es poca cosa.',
            stateEffects: { trust: 8, tension: 15, bondScore: 5, guiltLoad: 10, pragmatism: -15, empathy: 15 }
          }
        ]
      },
      {
        id: 'el-03',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'El último paso para conseguir lo que más querías implica cruzar la única línea que juraste que no ibas a cruzar. Una vez. Nadie lo va a saber.',
        question: '¿La cruzás aunque sea una sola vez y nadie lo sepa, o la sostenés aunque eso sea lo único que te costó el objetivo?',
        choices: [
          {
            key: 'A',
            label: 'Cruzarla. Las líneas absolutas son un lujo que no siempre podés pagarte.',
            consequence: 'La cruzaste. Conseguiste lo que querías. Nadie lo sabe. Vos sí. La próxima vez que llegues a esa línea vas a llegar sabiendo que ya la cruzaste una vez.',
            stateEffects: { trust: -5, tension: 18, bondScore: -5, guiltLoad: 22, pragmatism: 22, empathy: -10 }
          },
          {
            key: 'B',
            label: 'Sostenerla. Si la cruzás "una sola vez", ya la cruzaste.',
            consequence: 'No la cruzaste. El objetivo quedó sin conseguir. La línea quedó en pie. Eso tiene un peso diferente al de haberla cruzado, pero tiene peso igual.',
            stateEffects: { trust: 8, tension: 12, bondScore: 8, guiltLoad: 8, pragmatism: -20, empathy: 12 }
          }
        ]
      },
      {
        id: 'el-04',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Los métodos de quien te perseguía son los únicos que funcionan para escapar. Usarlos te salva. También te cambian de formas que no vas a poder explicar después.',
        question: '¿Adoptás lo que funciona aunque te convierta en algo parecido a lo que huías, o te quedás con lo que sos aunque eso te cueste la salida?',
        choices: [
          {
            key: 'A',
            label: 'Adoptarlos. Sobrevivir primero, ser quien eras después.',
            consequence: 'Los adoptaste. Funcionaron. Saliste. Lo que usaste para salir se quedó en vos de una forma que no siempre podés controlar.',
            stateEffects: { trust: -8, tension: 20, bondScore: -5, guiltLoad: 18, pragmatism: 25, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Quedarte con lo que sos. Hay cosas que si las sacrificás para sobrevivir, lo que sobrevive no sos realmente vos.',
            consequence: 'Te quedaste. No saliste de la misma forma. Lo que sos quedó intacto. También quedó el costo de lo que pagaste por mantenerlo.',
            stateEffects: { trust: 10, tension: 15, bondScore: 8, guiltLoad: 10, pragmatism: -20, empathy: 18 }
          }
        ]
      },
      {
        id: 'el-05',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Traicionar a alguien que confía completamente en vos te da acceso a algo que protege a más personas. La cuenta sale. La persona no lo va a saber nunca.',
        question: '¿La traicionás porque la cuenta sale, o la protegés porque no todas las cuentas que salen son cuentas que podés hacer?',
        choices: [
          {
            key: 'A',
            label: 'Traicionarla. Las decisiones que nadie sabe que tomaste también te forman.',
            consequence: 'La traicionaste. El acceso funcionó. Las personas que protegiste nunca van a saber a qué costo. La que traicionaste tampoco. Solo vos.',
            stateEffects: { trust: -15, tension: 18, bondScore: -18, guiltLoad: 22, pragmatism: 22, empathy: -12 }
          },
          {
            key: 'B',
            label: 'Protegerla. Si empezás a hacer cuentas con personas, no parás.',
            consequence: 'La protegiste. El acceso no se consiguió. Lo que esa decisión te costó es concreto. Lo que te preservó es más difícil de medir.',
            stateEffects: { trust: 12, tension: 12, bondScore: 15, guiltLoad: 8, pragmatism: -18, empathy: 18 }
          }
        ]
      },
      {
        id: 'el-06',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'El daño no pasó todavía pero las señales son claras. Podés contenerlo antes de que empiece, pero tendría que ser ahora y de una forma que no admite dudas.',
        question: '¿Actuás antes de que el daño sea real, o esperás porque actuar sobre lo que todavía no ocurrió define lo que sos?',
        choices: [
          {
            key: 'A',
            label: 'Actuar ahora. Esperar el daño cuando podés evitarlo no es ética, es cobardía con mejor prensa.',
            consequence: 'Actuaste antes. El daño no llegó. Nadie sabe qué hubiera pasado si no lo hacías. Tampoco podés deshacer lo que hiciste para evitarlo.',
            stateEffects: { trust: -5, tension: 22, bondScore: -5, guiltLoad: 20, pragmatism: 22, empathy: -12 }
          },
          {
            key: 'B',
            label: 'Esperar. El principio de no actuar sobre lo que no pasó es el único que separa ciertos actos de otros.',
            consequence: 'Esperaste. El daño llegó. Pudiste contenerlo pero no evitarlo. Lo que te quedó fue el principio intacto y el peso de lo que no hiciste a tiempo.',
            stateEffects: { trust: 8, tension: 15, bondScore: 5, guiltLoad: 18, pragmatism: -15, empathy: 8 }
          }
        ]
      },
      {
        id: 'el-07',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'La persona que buscabas está frente a vos. Sin defensa. La justicia formal tomaría años y probablemente no llegaría. Tenés segundos.',
        question: '¿Cerrás el círculo ahora con tus propias manos, o lo dejás en manos de un sistema que probablemente no lo va a cerrar?',
        choices: [
          {
            key: 'A',
            label: 'Cerrarlo. Hay daños que el sistema no fue diseñado para responder.',
            consequence: 'Lo cerraste. En esos segundos. El círculo se cerró. Lo que sos en esos segundos se quedó con vos de una manera que los segundos no alcanzan a explicar.',
            stateEffects: { trust: -8, tension: 22, bondScore: -5, guiltLoad: 28, pragmatism: 18, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Dejarlo al sistema. Lo que hacés en esos segundos define más que todo lo que te hicieron.',
            consequence: 'Lo dejaste. El sistema hará lo que hace, que puede ser nada. Vos te quedaste con los segundos en que pudiste y no lo hiciste. Eso también tiene nombre.',
            stateEffects: { trust: 10, tension: 12, bondScore: 8, guiltLoad: 12, pragmatism: -15, empathy: 12 }
          }
        ]
      },
      {
        id: 'el-08',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Cruzaste el límite una vez. Funcionó. Nadie lo sabe. La próxima vez esa decisión va a ser más fácil de tomar. Eso es exactamente el problema.',
        question: '¿Reconocés el patrón y lo detenés, o seguís porque los resultados son reales y el costo lo pagás vos solo?',
        choices: [
          {
            key: 'A',
            label: 'Detenerlo. Reconocer el patrón y no actuar es elegir lo que viene después.',
            consequence: 'Lo detuviste. El costo fue no tener acceso a lo que el patrón producía. No es un costo visible. Es exactamente por eso que es difícil sostener.',
            stateEffects: { trust: 8, tension: 12, bondScore: 5, guiltLoad: 15, pragmatism: -15, empathy: 12 }
          },
          {
            key: 'B',
            label: 'Seguir. El costo personal es tuyo y los resultados son reales. No todo tiene que parar por una incomodidad.',
            consequence: 'Seguiste. Los resultados siguieron. El patrón se instaló de una manera más permanente. Ahora es parte de cómo funcionás, no una excepción.',
            stateEffects: { trust: -5, tension: 15, bondScore: -5, guiltLoad: 22, pragmatism: 22, empathy: -10 }
          }
        ]
      },
      {
        id: 'el-09',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Seguir siendo quien eras tiene un precio que ya no podés pagar. La alternativa funciona, resuelve, protege. No te reconocés en ella, pero funciona.',
        question: '¿Seguís siendo reconocible aunque eso te cueste la capacidad de resolver lo que tenés adelante, o te convertís en algo que funciona aunque no puedas explicar qué fue?',
        choices: [
          {
            key: 'A',
            label: 'Seguir siendo reconocible. Hay un punto en que si no podés explicarlo, no debería existir.',
            consequence: 'Te quedaste con lo que podías explicar. El costo fue lo que no pudiste resolver. Eso también quedó sin explicación, pero al menos fue un costo que elegiste.',
            stateEffects: { trust: 10, tension: 15, bondScore: 8, guiltLoad: 10, pragmatism: -18, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Convertirte en lo que funciona. Lo que eras ya no alcanza y aferrarte a eso es una forma de rendirse disfrazada.',
            consequence: 'Te convertiste en lo que funcionaba. Resolviste lo que tenías adelante. No te reconocés del todo en cómo lo hiciste, pero el resultado es real.',
            stateEffects: { trust: -8, tension: 18, bondScore: -8, guiltLoad: 18, pragmatism: 25, empathy: -15 }
          }
        ]
      },
      {
        id: 'el-10',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Para proteger lo que importa tenés que destruir la reputación de alguien que no merece eso. No hay salida limpia. La elección es a quién le cae el daño.',
        question: '¿Cargás el daño en alguien inocente para proteger lo que importa, o buscás otra salida aunque no exista todavía?',
        choices: [
          {
            key: 'A',
            label: 'Cargar el daño en quien no lo merece. Hay momentos donde no hay opciones que no lastimen a nadie.',
            consequence: 'Lo hiciste. Lo que importa quedó protegido. El inocente pagó. No sabe que fuiste vos. Eso no cambia que fuiste vos.',
            stateEffects: { trust: -12, tension: 20, bondScore: -5, guiltLoad: 28, pragmatism: 22, empathy: -15 }
          },
          {
            key: 'B',
            label: 'Buscar otra salida. Si no existe, la creás. Pero no arrancás destruyendo a alguien que no tiene nada que ver.',
            consequence: 'La buscaste. La salida fue más cara y más difícil. Lo que importaba quedó protegido de otra forma. El inocente quedó fuera del daño. Eso también vale.',
            stateEffects: { trust: 8, tension: 18, bondScore: 8, guiltLoad: 10, pragmatism: -15, empathy: 20 }
          }
        ]
      },
      {
        id: 'el-11',
        type: 'trolley',
        roundLabel: 'DILEMA',
        setup: 'El daño ya está hecho. Podés contener las consecuencias pero de una manera que no vas a poder justificar después ante nadie que no haya estado ahí.',
        question: '¿Hacés lo que contiene el daño aunque no puedas sostenerlo después, o no lo hacés porque al menos eso es algo que podés defender?',
        choices: [
          {
            key: 'A',
            label: 'Hacerlo. Hay acciones que se justifican en lo que impiden, no en lo que se puede explicar.',
            consequence: 'Lo hiciste. Las consecuencias se contuvieron. Lo que hiciste para contenerlas no tiene una defensa clara. Tampoco tiene una alternativa que hubiera funcionado igual.',
            stateEffects: { trust: -5, tension: 22, bondScore: -5, guiltLoad: 22, pragmatism: 20, empathy: -10 }
          },
          {
            key: 'B',
            label: 'No hacerlo. Actuar de formas que no podés sostener es el primer paso de algo de lo que es difícil volver.',
            consequence: 'No lo hiciste. Las consecuencias corrieron. Lo que te quedó fue un principio intacto y el peso de lo que ese principio costó a otros.',
            stateEffects: { trust: 10, tension: 15, bondScore: 5, guiltLoad: 15, pragmatism: -18, empathy: 10 }
          }
        ]
      },
      {
        id: 'el-12',
        type: 'vengeance',
        roundLabel: 'DILEMA',
        setup: 'Encontraste la forma de que lo que le pase a quien te destruyó sea completamente trazable a sus propias decisiones. Nadie va a saber que lo armaste vos. Perfecto. Sucio.',
        question: '¿Lo activás aunque sea exactamente el tipo de operación que decías despreciar, o no lo activás aunque eso signifique que no hay consecuencias reales para lo que te hicieron?',
        choices: [
          {
            key: 'A',
            label: 'Activarlo. La justicia que no viene sola a veces se construye.',
            consequence: 'Lo activaste. Funcionó. La caída fue exactamente lo que diseñaste. La satisfacción que sentiste no fue lo que esperabas. Eso también dice algo.',
            stateEffects: { trust: -8, tension: 20, bondScore: -5, guiltLoad: 20, pragmatism: 18, empathy: -10 }
          },
          {
            key: 'B',
            label: 'No activarlo. Construir la condena de alguien desde las sombras, aunque lo merezca, te cambia de maneras que no se resetean.',
            consequence: 'No lo activaste. Quien te destruyó siguió sin consecuencias visibles. Vos seguiste sin haber construido nada en las sombras. Eso es más difícil de sostener de lo que parece.',
            stateEffects: { trust: 10, tension: 12, bondScore: 5, guiltLoad: 10, pragmatism: -15, empathy: 12 }
          }
        ],
        affinityChoice: {
          minLevel: 2,
          choice: {
            key: 'C',
            label: 'Activarlo, pero solo si podés vivir con que la satisfacción no va a ser lo que esperabas.',
            consequence: 'Lo activaste con esa claridad. La caída llegó. La satisfacción fue exactamente lo que te habías advertido que iba a ser: menos de lo que imaginaste y más difícil de procesar.',
            stateEffects: { trust: -5, tension: 15, bondScore: 5, guiltLoad: 15, pragmatism: 12, empathy: 5 }
          }
        }
      },
      {
        id: 'el-13',
        type: 'hidden_cost',
        roundLabel: 'DILEMA',
        setup: 'Cada límite que moviste fue razonable en su momento. Juntos forman algo que no reconocés. No hay un momento específico en que todo cambió. Fue gradual.',
        question: '¿Hacés el inventario y retrocedés aunque eso signifique deshacer cosas que funcionan, o seguís porque los pasos individuales fueron todos justificables?',
        choices: [
          {
            key: 'A',
            label: 'Hacer el inventario. El proceso que lleva a algo que no reconocés merece ser detenido aunque cada paso haya tenido sentido.',
            consequence: 'Hiciste el inventario. Lo que encontraste fue difícil de mirar. Retroceder costó lo que costó. Lo que recuperaste fue algo que ya no sabías que habías perdido.',
            stateEffects: { trust: 10, tension: 18, bondScore: 8, guiltLoad: 20, pragmatism: -18, empathy: 15 }
          },
          {
            key: 'B',
            label: 'Seguir. El resultado importa más que el recorrido y el recorrido era lo que la situación pedía.',
            consequence: 'Seguiste. Los resultados siguieron siendo reales. El recorrido siguió siendo lo que era. La distancia con lo que eras antes siguió creciendo de a poco.',
            stateEffects: { trust: -5, tension: 12, bondScore: -5, guiltLoad: 18, pragmatism: 20, empathy: -12 }
          }
        ]
      },
      {
        id: 'el-14',
        type: 'survival',
        roundLabel: 'DILEMA',
        setup: 'Lo que necesitás para salir sería razonable si lo hiciera otra persona en otro contexto. Pero sos vos, en este contexto, y las consecuencias caen en gente que no eligió estar en tu camino.',
        question: '¿Usás lo que necesitás aunque las consecuencias caigan en quien no lo eligió, o no lo usás aunque eso te cueste la salida?',
        choices: [
          {
            key: 'A',
            label: 'Usarlo. El daño no elegido no es lo mismo que el daño elegido.',
            consequence: 'Lo usaste. Saliste. Las consecuencias cayeron donde cayeron. La distinción entre daño no elegido y daño elegido es real. Eso no la hace más fácil de cargar.',
            stateEffects: { trust: -8, tension: 20, bondScore: -5, guiltLoad: 25, pragmatism: 22, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No usarlo. Si las consecuencias caen en quienes no eligieron estar ahí, la salida no justifica el camino.',
            consequence: 'No lo usaste. La salida se complicó. Las personas que hubieran pagado el costo no lo pagaron. Vos pagaste el tuyo de otra forma.',
            stateEffects: { trust: 10, tension: 15, bondScore: 10, guiltLoad: 10, pragmatism: -18, empathy: 20 }
          }
        ]
      },
      {
        id: 'el-15',
        type: 'betrayal',
        roundLabel: 'DILEMA',
        setup: 'Alguien te dio acceso a algo importante porque creyó en vos. Usar ese acceso como lo necesitás usarlo es traicionarlos de una manera que no van a poder entender aunque se los expliques.',
        question: '¿Usás el acceso aunque eso destruya algo real entre ustedes, o no lo usás aunque eso te cueste lo único que podías hacer?',
        choices: [
          {
            key: 'A',
            label: 'Usarlo. Las personas que importan a veces terminan siendo el costo de lo que era necesario hacer.',
            consequence: 'Lo usaste. Lo que tenías que hacer se hizo. Lo que esa persona te dio se convirtió en algo diferente a lo que creyó que te estaba dando. Eso no tiene arreglo.',
            stateEffects: { trust: -15, tension: 18, bondScore: -18, guiltLoad: 22, pragmatism: 22, empathy: -12 }
          },
          {
            key: 'B',
            label: 'No usarlo. Hay accesos que no podés usar sin convertir lo que alguien te dio en algo que no merece el nombre que le pusieron.',
            consequence: 'No lo usaste. Lo que tenías que hacer no se hizo de esa forma. Lo que esa persona te dio conservó lo que era. Encontraste otra salida o no la encontraste, pero no usaste esa.',
            stateEffects: { trust: 15, tension: 15, bondScore: 15, guiltLoad: 8, pragmatism: -20, empathy: 20 }
          }
        ],
        affinityChoice: {
          minLevel: 2,
          choice: {
            key: 'C',
            label: 'Usarlo, pero decírselo después aunque no lo entiendan.',
            consequence: 'Lo usaste. Se los dijiste. No lo entendieron, como sabías que no iban a entender. Pero lo saben. Eso es diferente a haberlo hecho en silencio.',
            stateEffects: { trust: -5, tension: 15, bondScore: -5, guiltLoad: 15, pragmatism: 15, empathy: 12 }
          }
        }
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
    id: 'rebelde',
    label: 'El Rebelde',
    description: 'No seguiste las reglas de nadie que no hubiera ganado tu respeto. Eso tiene un costo y una forma de libertad que pocas personas se permiten.',
    conditions: { tension: { min: 60 }, pragmatism: { min: 55 } }
  },
  {
    id: 'sacrificado',
    label: 'El Sacrificado',
    description: 'Pusiste a otros antes que a vos, una y otra vez. En algún punto eso dejó de ser generosidad y se convirtió en algo que no sabés cómo nombrar todavía.',
    conditions: { guiltLoad: { min: 60 }, bondScore: { min: 10 } }
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
 * `seen` es un array de ids ya jugados en sesiones anteriores — se priorizan los no vistos.
 * Si el pool de no-vistos tiene menos de `count`, se resetea y usa el pool completo.
 */
export function pickDilemas(pool, count = 4, seen = []) {
  const unseenPool = seen.length > 0 ? pool.filter(d => !seen.includes(d.id)) : pool
  const activePool = unseenPool.length >= count ? unseenPool : pool

  if (activePool.length <= count) return [...activePool]

  // Agrupar por tipo
  const byType = {}
  for (const d of activePool) {
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
    const remaining = activePool.filter(d => !usedIds.has(d.id)).sort(() => Math.random() - 0.5)
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
