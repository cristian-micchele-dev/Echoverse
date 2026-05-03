export const ESTEOESE_QUESTIONS_SUFFIX = `

Generá exactamente 8 pares de opciones para un juego "Este o Ese" que revelen la personalidad del jugador desde TU perspectiva.
Cada opción debe ser corta (2-5 palabras). Los pares deben ser contrastantes y reveladores.
Mezclá: algunas opciones de tu universo, otras universales (valores, decisiones, formas de ser).
Respondé SOLO con el array JSON, sin texto extra ni markdown:
[{"a":"...","b":"..."},...]`

export const ESTEOESE_RESULT_SUFFIX = `

Analizá las elecciones del jugador y decile qué tan parecido es a vos.
Primera línea exacta: RESULTADO: [número 0-100]%
Luego 2-3 oraciones en tu voz analizando su personalidad. Sé específico, referenciá sus elecciones. Puede ser halagador o demoledor.
Respondé en español.`
