# Sequelize Options

Sequelize es un potente Framework ORM de NodeJS, utilizado para realizar consultas y operaciones con la base de datos. Estas consultas se crean definiendo un objeto que contiene todos los parámetros de la consulta.

Esta librería se encarga de construir el objeto `options` que utiliza sequelize para realizar consultas, a partir de un objeto `query` que incluye algunos filtros básicos y la instancia de un modelo Sequelize `model` para tomar en cuenta solamente los atributos definidos dentro del modelo.

Aprovechando que se utiliza Sequelize para definir los modelos, también es posible filtrar un resultado, utilizando un objeto de tipo `FieldGroup`.

## Características

- Es posible crear este objeto utilizando la query que se envía en la URL de una petición.
- Es posible forzar a que los atributos sean parte de un modelo Sequelize.
- Es posible indicar que se inlcuya de manera obligatoria todas las claves primarias y foráneas.
- Se puede filtrar un resultado, utilizando como base un objeto de tipo `FieldGroup`.

## Función `create`

| Parámetro              | Descripción |
|------------------------|-------------|
| `options`              | Opciones de consulta. |
| `options.query`        | Objeto que contiene los filtros de la consulta. |
| `options.query.fields` | Cadena de texto que contiene los atributos. |
| `options.query.limit`  | Cantidad de registros a devolver por página. |
| `options.query.page`   | Número de página. |
| `options.query.order`  | Nombre del atributo de ordenación. |
| `options.query.col`    | Nombre del atributo que se utilizará para identificar registros distintos. |
| `options.query.distinct` | Indica si se devolverá solamente los registros que sean distintos tomando como base el atributo `query.col`. |
| `options.output`       | Objeto de tipo `FieldGroup` que contiene los atributos. |
| `options.model`        | Instancia de un modelo Sequelize. |
| `options.keys`         | Indica si se incluirán las claves primarias y foráneas. |
| `options.plain`        | Indica si se devolverá un objeto plano. |

Para crear el objeto `options.output`, se recomienda utilizar la librería [field-creator](https://github.com/insacjs/field-creator).

## Función `filter`

| Parámetro   | Descripción |
|-------------|-------------|
| `data`      | Objeto o lista de objetos cuyas propieades serán filtradas. |
| `options`   | Opciones de consulta. |

## Propiedad `options.query`

| Filtro    | Descripción                                       | Valor por defecto |
|-----------|---------------------------------------------------|-------------------|
| `fields`  | Campos que serán devueltos en el resultado.       | `ALL`             |
| `limit`   | Cantidad de registros por página.                 | `50`              |
| `page`    | Número de página.                                 | `1`               |
| `order`   | Ordena el resultado (`field`, `-field`)           | `<ninguno>`       |
| `<field>` | Consulta simple (`field=valor`)                   | `<ninguno>`       |

## Filtro `fields`

Todos los campos.
- `/personas`
- `/personas?fields=all`

Todos los campos. Incluyendo a los objetos.
- `/personas?fields=ALL`

Todos los campos, excluyendo algunos.
- `/personas?fields=-_fecha_creacion,-_fecha_modificacion`
- `/personas?fields=-id,-ci`

Incluyendo objetos.
- `/personas?fields=usuario()`
- `/personas?fields=usuario(id,username)`
- `/personas?fields=usuario(roles(rol()))`

Incluyendo consultas. **[ required = false ]**
- `/personas?fields=id,nombre=john`
- `/personas?fields=id,usuario(roles(estado=ACTIVO))`

Al incluir este tipo de filtros, si el objeto no cumple con la condición, el valor de este campo será `undefined`.

## Filtro `<field>`

Incluyendo consultas. **[ required = true ]**
- `/personas?id=1`
- `/personas?id=1,2,3`
- `/personas?nombre=john`
- `/personas?usuario.username=admin`
- `/personas?usuario.roles.estado=ACTIVO`

Al incluir este tipo de filtros, si el objeto no cumple con la condición, el registro al que pertenece este campo no será incluido en el resultado.

## Filtros `limit` y `page`

Devuelve una cierta cantidad de registros, indicando el número de página.
- `/personas?limit=50&page=1`

## Filtro `order`

Devuelve una lista ordenada de forma ascendente `field` o descendente `-field`.
- `/personas?order=id`
- `/personas?order=-ci`
- `/personas?order=nombre,paterno,materno`
- `/personas?order=-_fecha_creacion,-_fecha_modificacion`

## Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `npm install --save sequelize-options`

## Ejemplo 1. Construir el output.

Objeto de entrada (query) y un modelo de salida (output).
``` js
const { Options } = require('sequelize-options')
const { Field, THIS } = require('field-creator')

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
  page   : 1
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
```

## Ejemplo 2. Filtrar un resultado.

Puede filtrar los campos de un objeto.

``` js
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
```

También podemos desplazar los atributos de los submodelos dentro del objeto raiz.
``` js
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
```
