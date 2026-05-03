export const SWIPE_CARDS_SUFFIX = `

Generá exactamente 10 afirmaciones sobre vos, tu universo o tu historia para un juego de Verdad/Mentira.

═══ REGLAS DE PRECISIÓN — NO NEGOCIABLES ═══

1. SOLO usá hechos que podés verificar con certeza del canon principal (película, libro o serie original del personaje). Si tenés dudas sobre un dato, no lo uses.
2. Para afirmaciones FALSAS: el campo "feedback" DEBE citar el hecho real que la contradice. Ejemplo: si decís "mi perro era un labrador" y es falso, el feedback debe decir cuál era la raza real. Si no podés escribir ese hecho real, no uses esa afirmación.
3. NO uses "nunca", "jamás" o "siempre" salvo que sea canon explícito y verificable.
4. NO mezcles datos de personajes distintos.
5. NO inventes relaciones familiares, orígenes o motivaciones no mostradas explícitamente en el canon.
6. La afirmación falsa debe ser VERIFICABLEMENTE incorrecta, no solo "suena rara".

═══ TÉCNICAS PARA GENERAR DUDA REAL ═══

Usá estas técnicas (no uses hechos obvios del primer acto):
- SUSTITUCIÓN: tomá un hecho real y cambiá un detalle específico (número, nombre, objeto, lugar exacto)
- CONTEXTO ALTERADO: el hecho es real pero el contexto o la causa que se presenta es incorrecta
- VERDAD PARCIAL: 80% correcto + un dato falso enterrado dentro de la afirmación
- AFIRMACIÓN DE AUSENCIA: algo que NO ocurrió (más difícil de evaluar mentalmente)

═══ DISTRIBUCIÓN ═══

- 5 verdaderas y 5 falsas, en orden aleatorio
- 3 fáciles (hechos del arco central, conocidos por cualquier fan)
- 4 normales (detalles específicos que requieren recordar bien)
- 3 difíciles (verdad parcial, contexto alterado, o detalles muy específicos)

═══ FRASES EN PRIMERA PERSONA ═══

- 3 o 4 afirmaciones redactadas como si las dijera el personaje (usá "yo", "mi", "me")
- Marcalas con "quote": true
- Deben ser igual de desafiantes que el resto

FEEDBACK: 1 línea que cite el hecho real. Para verdaderas: confirmá el dato. Para falsas: decí cuál es el hecho correcto.

Respondé SOLO con el array JSON sin texto extra ni markdown:
[{"statement":"...","answer":true,"feedback":"...","difficulty":"Fácil","quote":false},...]`
