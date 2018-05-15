/* global describe it expect */
const Options   = require('../../lib/class/Options')
const path      = require('path')
const Sequelize = require('sequelize')
const { Field, THIS } = require('field-creator')

const PARAMS = {
  dialect : 'postgres',
  lang    : 'es',
  logging : false,
  define  : {
    underscored     : true,
    freezeTableName : true,
    timestamps      : false
  },
  operatorsAliases: false
}

describe('\n - Clase: Options\n', () => {
  describe(` Método: create`, () => {
    it('Ejecución con parámetros', () => {
      const sequelize = new Sequelize(null, null, null, PARAMS)
      const pathModels = path.resolve(__dirname, './models')
      sequelize.import(`${pathModels}/autor.model.js`)
      sequelize.import(`${pathModels}/libro.model.js`)
      sequelize.models.autor.associate(sequelize.models)
      sequelize.models.libro.associate(sequelize.models)

      const LIBRO = sequelize.models.libro

      const QUERY = {
        fields : 'titulo,precio,autor(nombre,ci,telefono)',
        order  : '-autor.nombre',
        limit  : 50,
        offset : 0
      }

      const OUTPUT = Field.group(LIBRO, [{
        id_libro : THIS(),
        titulo   : THIS(),
        precio   : THIS(),
        autor    : {
          id_autor : THIS(),
          nombre   : THIS()
        }
      }])

      const options = Options.create({ query: QUERY, output: OUTPUT })
      expect(options).to.have.property('attributes').to.be.an('array').to.have.lengthOf(2)
      expect(options).to.have.property('include').to.be.an('array').to.have.lengthOf(1)
      expect(options).to.have.property('order').to.be.an('array').to.have.lengthOf(1)
      expect(options.attributes[0]).to.equal('titulo')
      const include = options.include[0]
      expect(include).to.have.property('attributes').to.be.an('array').to.have.lengthOf(1)
      expect(include.attributes[0]).to.equal('nombre')
      expect(include).to.have.property('association', 'autor')
      expect(options.order).to.be.an('array').to.have.lengthOf(1)
      expect(options.order[0]).to.be.an('array').to.have.lengthOf(3)
      expect(options.order[0][0]).to.equal('autor')
      expect(options.order[0][1]).to.equal('nombre')
      expect(options.order[0][2]).to.equal('DESC')
      console.log(JSON.stringify(options, null, 2))
      // {
      //   "attributes": [
      //     "titulo",
      //     "precio"
      //   ],
      //   "include": [
      //     {
      //       "attributes": [
      //         "nombre"
      //       ],
      //       "association": "autor"
      //     }
      //   ],
      //   "limit": 50,
      //   "offset": 0,
      //   "order": [
      //     [
      //       "autor",
      //       "nombre",
      //       "DESC"
      //     ]
      //   ]
      // }
    })
  })

  describe(` Método: result`, () => {
    it('Ejecución con parámetros', () => {
      const sequelize = new Sequelize(null, null, null, PARAMS)
      const AUTOR = sequelize.define('autor', {
        id_autor : Field.ID(),
        nombre   : Field.STRING(),
        ci       : Field.INTEGER(),
        telefono : Field.INTEGER()
      })

      const LIBRO = sequelize.define('libro', {
        id_libro : Field.ID(),
        titulo   : Field.STRING(),
        precio   : Field.FLOAT()
      })

      AUTOR.hasMany(LIBRO, { as: 'libros', foreignKey: { name: 'fid_autor' } })
      LIBRO.belongsTo(AUTOR, { as: 'autor', foreignKey: { name: 'fid_autor', targetKey: 'id_autor' } })

      const QUERY = {
        fields : 'titulo,precio,autor(nombre,ci,telefono)',
        order  : '-autor.nombre',
        limit  : 50,
        offset : 0
      }

      const OUTPUT = Field.group(LIBRO, [{
        id_libro : THIS(),
        titulo   : THIS(),
        precio   : THIS(),
        autor    : {
          id_autor : THIS(),
          nombre   : THIS()
        }
      }])

      const DATA = [
        {
          id_libro : 1,
          titulo   : 'El gato negro',
          precio   : 11.99,
          autor    : {
            id_autor : 1,
            nombre   : 'Edgar Allan Poe',
            ci       : 64857683,
            telefono : 78849484
          }
        },
        {
          id_libro : 2,
          titulo   : 'El cuervo',
          precio   : 15.99,
          autor    : {
            id_autor : 2,
            nombre   : 'Edgar Allan Poe',
            ci       : 64857683,
            telefono : 78849484
          }
        }
      ]

      const result = Options.filter(DATA, { query: QUERY, output: OUTPUT })
      console.log(JSON.stringify(result, null, 2))
      // [
      //   {
      //     "titulo": "El gato negro",
      //     "precio": 11.99,
      //     "autor": {
      //       "nombre": "Edgar Allan Poe"
      //     }
      //   },
      //   {
      //     "titulo": "El cuervo",
      //     "precio": 15.99,
      //     "autor": {
      //       "nombre": "Edgar Allan Poe"
      //     }
      //   }
      // ]

      const resultPlain = Options.filter(DATA, { query: QUERY, output: OUTPUT, plain: true })
      console.log(JSON.stringify(resultPlain, null, 2))
      // [
      //   {
      //     "titulo": "El gato negro",
      //     "precio": 11.99,
      //     "autor.nombre": "Edgar Allan Poe"
      //   },
      //   {
      //     "titulo": "El cuervo",
      //     "precio": 15.99,
      //     "autor.nombre": "Edgar Allan Poe"
      //   }
      // ]
    })
  })
})
