# Insac Options
Facilita la creación del objeto options que utiliza Sequelize para realizar consultas a la base de datos.

Adicionalmente, puede filtrar los datos de un resultado.

# Características
- Se puede crear a partir de la query que se envía desde la URL.
- Puede incluir todos los atributos de un modelo Sequelize.
- Puede utilizar un objeto que contenga atributos Sequelize (OUTPUT).
- Puede incluir todos los campos que sean llaves primarias y foráneas.

# Ejemplo
``` js
const { Option } = require('insac-option')
const { Field } = require('insac-field')

const QUERY = {
  fields: 'titulo,precio,autor(nombre,ci,telefono)',
  order: '-autor.nombre'
}

const OUTPUT = [{
  id: Field.ID(),
  titulo: Field.STRING(),
  precio: Field.STRING(),
  autor: {
    nombre: Field.STRING()
  }
}]

const options = Option.create({ query: QUERY, output: OUTPUT })
// {
//   attributes: ['titulo','precio'],
//   includes: [{
//     association: 'autor',
//     attributes: ['nombre']
//   }],
//   order: [['autor','nombre','DESC']]
// }

const DATA = [
  {
    id: 1,
    titulo: 'El gato negro',
    precio: 11.99,
    autor: {
      id: 1,
      nombre: 'Edgar Allan Poe',
      ci: 64857683,
      telefono: 78849484
    }
  },
  {
    id: 2,
    titulo: 'El cuervo',
    precio: 15.99,
    autor: {
      id: 2,
      nombre: 'Edgar Allan Poe',
      ci: 64857683,
      telefono: 78849484
    }
  }
]

const RESULT = Option.result({ query: QUERY, output: OUTPUT, data: DATA })
// [
//   {
//     titulo: 'El gato negro',
//     precio: 11.99,
//     autor: {
//       nombre: 'Edgar Allan Poe'
//     }
//   },
//   {
//     titulo: 'El cuervo',
//     precio: 15.99,
//     autor: {
//       nombre: 'Edgar Allan Poe'
//     }
//   }
// ]
```
