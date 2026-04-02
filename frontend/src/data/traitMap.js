/**
 * traitMap — equivalencias de traits para scoring parcial.
 * Cuando un escenario pide el trait X, un personaje con algún equivalente
 * de X recibe crédito parcial (+1) en lugar de cero.
 */
export const traitMap = {
  combate:       ['fuerza', 'letal', 'guerrero', 'precision', 'valentia'],
  planificacion: ['estrategia', 'calculo', 'metodo', 'logica'],
  inteligencia:  ['deduccion', 'calculo', 'memoria', 'sabiduria', 'creatividad'],
  deduccion:     ['inteligencia', 'observacion', 'memoria', 'analisis'],
  sigilo:        ['engano', 'adaptabilidad', 'precision'],
  carisma:       ['oratoria', 'persuasion', 'humor', 'encanto'],
  liderazgo:     ['oratoria', 'carisma', 'autoridad', 'valentia'],
  supervivencia: ['adaptabilidad', 'resistencia', 'improvisa', 'sigilo'],
  empatia:       ['paciencia', 'lealtad', 'sabiduria', 'humor'],
  calma:         ['disciplina', 'precision', 'calculo', 'paciencia'],
  adaptabilidad: ['improvisa', 'creatividad', 'supervivencia', 'humor'],
  sabiduria:     ['inteligencia', 'experiencia', 'estrategia', 'empatia'],
  valentia:      ['combate', 'determinacion', 'lealtad'],
  negociacion:   ['persuasion', 'carisma', 'calma', 'engano', 'inteligencia'],
  engano:        ['sigilo', 'adaptabilidad', 'calma', 'carisma'],
  tecnologia:    ['inteligencia', 'creatividad', 'precision'],
  humor:         ['carisma', 'adaptabilidad', 'creatividad'],
  paciencia:     ['disciplina', 'empatia', 'calma', 'sabiduria'],
  estrategia:    ['planificacion', 'calculo', 'inteligencia', 'deduccion'],
  precision:     ['disciplina', 'calma', 'combate'],
  resistencia:   ['fuerza', 'valentia', 'determinacion'],
  creatividad:   ['inteligencia', 'adaptabilidad', 'improvisa'],
  oratoria:      ['carisma', 'persuasion', 'liderazgo'],
  lealtad:       ['empatia', 'valentia', 'determinacion'],
  obsesion:      ['determinacion', 'monotema'],
  antisocial:    ['obsesion', 'frio', 'monotema'],
  caos:          ['improvisa', 'impredecible', 'adaptabilidad'],
  intimidacion:  ['fuerza', 'liderazgo', 'determinacion', 'intenso'],
}
