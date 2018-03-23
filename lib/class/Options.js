/**
* Clase Options
*/
class Options {
  /**
  * Crea el objeto options.
  * @param {Object}         options              - Opciones de configuración.
  * @param {Object}         [options.query]      - Filtros de una consulta.
  * @param {Object}         [options.output]     - Formato de salida.
  * @param {SequelizeModel} [options.model]      - Modelo que se usará para filtrar campos.
  * @param {Boolean}        [options.keys=false] - Indica si se incluirán de forma obligatoria
  *                                                los campos que sean claves primarias y foráneas.
  * @return {Object}
  */
  static create (options = {}) {
    const QUERY  = options.query || {}
    const OUTPUT = options.output
    const MODEL  = options.model
    const KEYS   = (typeof options.keys !== 'undefined') ? options.keys : false
    let fieldsSTR = QUERY.fields || 'all'
    let OPT = {}
    if (fieldsSTR.indexOf('ALL') !== -1) {
      if (OUTPUT) {
        OPT = Array.isArray(OUTPUT) ? optionsALL(OUTPUT[0], MODEL) : optionsALL(OUTPUT, MODEL)
      } else {
        OPT = { include: [{ all: true }] }
      }
    } else {
      while (fieldsSTR.indexOf('()') !== -1) {
        fieldsSTR = fieldsSTR.replace('()', '(all)')
      }
      const OUTPUT2 = (OUTPUT && Array.isArray(OUTPUT)) ? OUTPUT[0] : OUTPUT
      OPT = parseFieldsSTR(fieldsSTR, OUTPUT2, MODEL, KEYS, undefined, '', QUERY)
    }
    if (QUERY.limit)  { OPT.limit  = QUERY.limit }
    if (QUERY.offset) { OPT.offset = QUERY.offset }
    if (QUERY.col)    { OPT.col    = QUERY.col }
    if (typeof QUERY.distinct !== 'undefined') { OPT.distinct = QUERY.distinct }
    if (QUERY.order) {
      OPT.order = []
      QUERY.order.split(',').forEach(fieldName => {
        OPT.order.push(parseOrder(fieldName))
      })
    }
    return OPT
  }

  /**
  * Filtra los campos de un objeto (Elimina aquellos campos no requeridos).
  * @param {Object}   data                  - Datos a filtrar.
  * @param {Object[]} options               - Opciones de configuración.
  * @param {Object}   [options.query]       - Filtros de una consulta.
  * @param {Object}   [options.output]      - Formato de salida.
  * @param {Boolean}  [options.plain=false] - Indica si los campos de los submodelos se
  *                                           moverán al objeto raiz.
  *                                           los campos que sean claves primarias y foráneas.
  * @return {Object}
  */
  static filter (data, options = {}) {
    if (!options.output) { return data }
    const OUTPUT  = options.output
    const QUERY   = options.query || {}
    const OPTIONS = Options.create({ query: QUERY, output: OUTPUT })
    if (options.plain === true) {
      if (Array.isArray(OUTPUT)) {
        const RESULT = []
        for (let i in data) {
          const OBJ = {}
          copyPlain(data[i], OUTPUT[0], OPTIONS, '', OBJ)
          RESULT.push(OBJ)
        }
        return RESULT
      } else {
        const OBJ = {}
        copyPlain(data, OUTPUT, OPTIONS, '', OBJ)
        return OBJ
      }
    }
    return copy(data, OUTPUT, OPTIONS)
  }
}

/**
* Copia los valores de los campos de un objeto en base a un modelo base.
* @param {Object} DATA    - Objeto que contiene los datos.
* @param {Object} OUTPUT  - Objeto que tiene el formato de los campos.
* @param {Object} OPTIONS - Objeto que contiene los campos permitidos.
* @return {Object}
*/
function copy (DATA, OUTPUT, OPTIONS) {
  if ((typeof DATA === 'undefined') || (DATA === null)) { return undefined }
  if (Array.isArray(OUTPUT)) {
    if (!Array.isArray(DATA)) {
      return undefined
    }
    const result = []
    for (let i in DATA) {
      const resultTemp = copy(DATA[i], OUTPUT[0], OPTIONS)
      if (typeof resultTemp !== 'undefined') { result.push(resultTemp) }
    }
    return result
  }
  const result = {}
  for (let prop in OUTPUT) {
    if (_isField(OUTPUT[prop])) {
      if (OPTIONS.attributes.includes(prop)) {
        result[prop] = DATA[prop]
      }
    } else {
      let assoc
      if (OPTIONS && OPTIONS.include) {
        OPTIONS.include.forEach(as => {
          if (as.association === prop) {
            assoc = as
          }
        })
      }
      if (assoc) {
        result[prop] = copy(DATA[prop], OUTPUT[prop], assoc)
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

/**
* Copia los valores de los campos de un objeto en base a un modelo base.
* Para el formato de salida, se copian todos los campos de los objetos anidados, en el objeto raiz.
* @param {Object} DATA    - Objeto que contiene los datos.
* @param {Object} OUTPUT  - Objeto que tiene el formato de los campos.
* @param {Object} OPTIONS - Objeto que contiene los campos permitidos.
* @param {String} PATH    - Nombre completo del campo.
* @param {Object} OBJ     - Objeto raiz.
* @return {Object}
*/
function copyPlain (DATA, OUTPUT, OPTIONS, PATH, OBJ) {
  if ((typeof DATA === 'undefined') || (DATA === null)) { return undefined }
  if (Array.isArray(OUTPUT)) {
    if (!Array.isArray(DATA)) {
      return undefined
    }
    for (let i in DATA) {
      const fullPath = (PATH === '') ? i : `${PATH}.${i}`
      copyPlain(DATA[i], OUTPUT[0], OPTIONS, fullPath, OBJ)
    }
  }
  for (let prop in OUTPUT) {
    if (_isField(OUTPUT[prop])) {
      if (OPTIONS.attributes.includes(prop)) {
        const fullPath = (PATH === '') ? prop : `${PATH}.${prop}`
        OBJ[fullPath] = DATA[prop]
      }
    } else {
      let assoc
      if (OPTIONS && OPTIONS.include) {
        OPTIONS.include.forEach(as => {
          if (as.association === prop) {
            assoc = as
          }
        })
      }
      if (assoc) {
        const fullPath = (PATH === '') ? prop : `${PATH}.${prop}`
        copyPlain(DATA[prop], OUTPUT[prop], assoc, fullPath, OBJ)
      }
    }
  }
  return OBJ
}

/**
* Devuelve el formato del filtro order,
* @param {String} fieldName - Nombre del campo.
* @return {String[]}
*/
function parseOrder (fieldName) {
  const split = fieldName.split('.')
  if (fieldName.charAt(0) === '-') {
    split[0] = split[0].substr(1)
    split.push('DESC')
  } else {
    split.push('ASC')
  }
  return split
}

/**
* Crea el objeto options, con todos los campos posibles.
* @param {Object}         OUTPUT  - Objeto que se toma como referencia.
* @param {SequelizeModel} [MODEL] - Modelo Sequelize de referencia.
* @param {String}         [as]    - Nombre de la asociacion.
* @return {Object}
*/
function optionsALL (OUTPUT, MODEL, as) {
  const attributes = []
  const include    = []
  for (let prop in OUTPUT) {
    let FIELD = OUTPUT[prop]
    if (_isField(FIELD)) {
      if (!MODEL || MODEL.attributes[prop]) {
        attributes.push(prop)
      }
    } else {
      if (Array.isArray(FIELD)) {
        FIELD = FIELD[0]
      }
      const SUB_MODEL = MODEL ? MODEL.associations[prop].target : undefined
      include.push(optionsALL(FIELD, SUB_MODEL, prop))
    }
  }
  const OPT = { attributes }
  if (include.length > 0) { OPT.include = include }
  if (as) { OPT.association = as }
  return OPT
}

/**
* Adiciona un atributo si corresponde.
* @param {String}         word       - Palabra obtenida desde la query.
* @param {Object}         [OUTPUT]   - Objeto que contiene el formato.
* @param {SequelizeModel} [MODEL]    - Modelo Sequelize de referencia.
* @param {Boolean}        KEYS       - Indica si se incluiran por defecto las claves primarias y foraneas.
* @param {Object}         where      - Objeto que almacena la propiedad where del options.
* @param {String[]}       attributes - Objeto que almacena la propiedad attributes del options.
* @param {String[]}       exclude    - Objeto que almacena la propiedad exclude del options.
* @param {Boolean}        allFields  - Bandera que indica si se adicionarón todos los fields.
*/
function addAttribute (word, OUTPUT, MODEL, KEYS, where, attributes, exclude, allFields) {
  const split = word.split('=')
  if (split.length === 2) {
    word = split[0]
    if (!OUTPUT || OUTPUT[word]) {
      if (!MODEL || MODEL.attributes[word]) {
        if (KEYS) {
          // TODO validar el campo
          where[word] = split[1]
        }
      }
    }
  }
  if (!allFields) {
    if (word.startsWith('-')) {
      word = word.substr(1)
      if (!OUTPUT || OUTPUT[word]) {
        if (!MODEL || MODEL.attributes[word]) {
          exclude.push(word)
        }
      }
    } else {
      if (!OUTPUT || OUTPUT[word]) {
        if (!MODEL || MODEL.attributes[word]) {
          attributes.push(word)
        }
      }
    }
  }
}

/**
* Parsea el valor del campo query.fields, devolviendo un include.
* @param {String}         fieldsSTR - Valor del campo query.fields.
* @param {Object}         [OUTPUT]  - Objeto que contiene el formato.
* @param {SequelizeModel} [MODEL]   - Modelo Sequelize de referencia.
* @param {Boolean}        KEYS      - Indica si se incluiran por defecto las claves primarias y foraneas.
* @param {String}         as        - Nombre de la asociación.
* @param {String}         trace     - Ruta del campo.
* @param {Object}         QUERY     - Objeto query.
* @return {Object}
*/
function parseFieldsSTR (fieldsSTR, OUTPUT, MODEL, KEYS, as, trace, QUERY) {
  let attributes = []
  const include = []
  const exclude = []
  const where   = {}
  let allFields = false
  let word = ''
  for (let i = 0; i < fieldsSTR.length; i++) {
    const ch = fieldsSTR[i]
    if (ch === ',') {
      if (word !== '') {
        if (word === 'all' && !allFields) {
          attributes = getAllAttributes(OUTPUT, MODEL)
          allFields = true
        } else {
          addAttribute(word, OUTPUT, MODEL, KEYS, where, attributes, exclude, allFields)
        }
      }
      word = ''
      continue
    }
    if (ch === '(') {
      const a = i + 1
      const b = findIndex(fieldsSTR, a)
      const c = b - a
      const subFieldSTR = fieldsSTR.substr(a, c)
      if (OUTPUT[word]) {
        const SUB_OUTPUT = Array.isArray(OUTPUT[word]) ? OUTPUT[word][0] : OUTPUT[word]
        const SUB_MODEL  = MODEL ? MODEL.associations[word].target : undefined
        const trace2     = (trace === '') ? word : `${trace}.${word}`
        include.push(parseFieldsSTR(subFieldSTR, SUB_OUTPUT, SUB_MODEL, KEYS, word, trace2, QUERY))
      }
      word = ''
      i = b
      continue
    }
    word += ch
  }
  if (word !== '') {
    if (word === 'all' && !allFields) {
      attributes = getAllAttributes(OUTPUT, MODEL)
      allFields  = true
    } else {
      addAttribute(word, OUTPUT, MODEL, KEYS, where, attributes, exclude, allFields)
    }
  }
  const OPT = { attributes }
  if (as) { OPT.association = as }
  if (exclude.length > 0) { OPT.attributes = { exclude } }
  if (include.length > 0) { OPT.include = include }
  OPT.attributes = normalizeAttributes(OPT.attributes, OUTPUT, MODEL, KEYS)
  // WHERE required = false. Son opcionales los filtros efectuados desde la propiedad fields.
  if (Object.keys(where).length > 0) { OPT.where = where; OPT.required = false }
  // WHERE required = true. Son requeridos los filtros efectuados desde el objeto QUERY
  if (Array.isArray(OPT.attributes)) {
    OPT.attributes.forEach(attrib => {
      const path = (trace === '') ? attrib : `${trace}.${attrib}`
      if (QUERY[path]) {
        if (!OPT.where) { OPT.where = {} }
        const value = ((typeof QUERY[path] === 'string') && (QUERY[path].indexOf(',') !== -1)) ? QUERY[path].split(',') : QUERY[path]
        OPT.where[attrib] = value
        OPT.required = true
      }
    })
  }
  return OPT
}

/**
* Normaliza la propiedad attributes.
* @param {Object}         ATTRIB   - Propiedad attributes.
* @param {Object}         [OUTPUT] - Objeto que contiene el formato.
* @param {SequelizeModel} [MODEL]  - Modelo Sequelize de referencia.
* @param {Boolean}        KEYS     - Indica si se incluiran por defecto las
*                                    claves primarias y foraneas.
* @return {Object}
*/
function normalizeAttributes (ATTRIB, OUTPUT, MODEL, KEYS) {
  const EXCLUDE  = (ATTRIB && ATTRIB.exclude) ? ATTRIB.exclude : []
  let attributes = (ATTRIB && Array.isArray(ATTRIB)) ? ATTRIB : []
  if (!KEYS) {
    if (EXCLUDE.length > 0) {
      if (OUTPUT) {
        for (let prop in OUTPUT) {
          if (_isField(OUTPUT[prop])) {
            if (!EXCLUDE.includes(prop)) {
              if (!MODEL || MODEL.attributes[prop]) {
                attributes.push(prop)
              }
            }
          }
        }
      } else if (MODEL) {
        Object.keys(MODEL.attributes).forEach(key => {
          if (!attributes.includes(key) && !EXCLUDE.includes(key)) {
            attributes.push(key)
          }
        })
      } else {
        attributes = ATTRIB
      }
    }
  } else {
    if (OUTPUT) {
      for (let prop in OUTPUT) {
        if (_isField(OUTPUT[prop]) && !attributes.includes(prop)) {
          if ((OUTPUT[prop].primaryKey && OUTPUT[prop].primaryKey === true) || OUTPUT[prop].references) {
            if (!MODEL || MODEL.attributes[prop]) {
              attributes.push(prop)
            }
          } else {
            if (EXCLUDE.length > 0 && !EXCLUDE.includes(prop)) {
              if (!MODEL || MODEL.attributes[prop]) {
                attributes.push(prop)
              }
            }
          }
        }
      }
    } else if (MODEL) {
      Object.keys(MODEL.attributes).forEach(key => {
        if (MODEL.attributes[key].primaryKey && (MODEL.attributes[key].primaryKey === true) && !attributes.includes(key)) {
          if (EXCLUDE.length > 0 && !EXCLUDE.includes(key)) {
            attributes.push(key)
          }
        }
      })
    } else {
      attributes = ATTRIB
    }
  }
  return attributes
}

/**
* Devuelve la propiedad attributes con todos los campos posibles.
* @param {Object}         [OUTPUT] - Objeto que contiene el formato.
* @param {SequelizeModel} [MODEL]  - Modelo Sequelize de referencia.
* @return {String[]}
*/
function getAllAttributes (OUTPUT, MODEL) {
  const ATTRIBUTES = []
  if (OUTPUT) {
    for (let prop in OUTPUT) {
      if (_isField(OUTPUT[prop])) {
        if (!MODEL || MODEL.attributes[prop]) {
          ATTRIBUTES.push(prop)
        }
      }
    }
  } else if (MODEL) {
    Object.keys(MODEL.attributes).forEach(prop => {
      if (!ATTRIBUTES.includes(prop)) {
        ATTRIBUTES.push(prop)
      }
    })
  } else {
    return undefined
  }
  return ATTRIBUTES
}

/**
* Devuelve el indice del parentesis de cierre que corresponde al nivel actual.
* @param {String} str - Cadena de texto.
* @param {Number} pos - Posición desde la que se comienza la búsqueda.
* @return {Number}
*/
function findIndex (str, pos) {
  let level = 0
  for (let i = pos; i < str.length; i++) {
    if (str[i] === ')' && level === 0) { return i }
    if (str[i] === '(') { level++ }
    if (str[i] === ')') { level-- }
  }
}

/**
* Función que indica si un objeto es un campo o no.
* @param {Object} obj - Objeto.
* @return {String}
*/
function _isField (obj) {
  if (obj && obj._modelAttribute && (obj._modelAttribute === true)) {
    return true
  }
  return false
}

module.exports = Options
