# Sequelize Options

Facilita la creación del objeto options que utiliza Sequelize para realizar consultas a la base de datos.

Adicionalmente, puede filtrar los datos de un resultado.

# Características

1. Se puede crear a partir de la query que se envía desde la URL. [`query`]
2. Puede incluir todos los atributos de un modelo Sequelize. [`model`]
3. Puede utilizar un objeto que contenga atributos Sequelize. [`output`]
4. Puede incluir todos los campos que sean llaves primarias y foráneas. [`key`]

## Formato de la propiedad `query`

| Filtro    | Descripción                                     | Valor por defecto |
|-----------|-------------------------------------------------|-------------------|
| `fields`  | Campos que serán devueltos en el resultado.     | `all`             |
| `limit`   | Cantidad de registros por página.               | `50`              |
| `page`    | Número de página.                               | `0`               |
| `order`   | Ordena el resultado (`field`, `-field`)         | `<ninguno>`       |
| `<field>` | Consulta simple (`field=valor`)                 | `<ninguno>`       |

### Modo de uso del filtro `fields`

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

### Modo de uso del filtro `<field>`

Incluyendo consultas. **[ required = true ]**
- `/personas?id=1`
- `/personas?id=1,2,3`
- `/personas?nombre=john`
- `/personas?usuario.username=admin`
- `/personas?usuario.roles.estado=ACTIVO`

#### Nota.-
Al incluir consultas sobre un objeto (`usuario(estado=ACTIVO)` o `usuario.estado=ACTIVO`), si el objeto no cumple con la condición, el valor de este campo será `undefined` y si la condición es requerida el registro al que pertenece el objeto no se incluirá en el resultado.

### Modo de uso de los filtros `limit` y `page`

Devuelve una cierta cantidad de registros, indicando el número de página.
- `/personas?limit=50&page=1`

### Modo de uso del filtro `order`

Devuelve una lista ordenada de forma ascendente `field` o descendente `-field`.
- `/personas?order=id`
- `/personas?order=-ci`
- `/personas?order=nombre,paterno,materno`
- `/personas?order=-_fecha_creacion,-_fecha_modificacion`

## Formato de la propiedad `output`.

Puede representar a un simple objeto o una lista de objetos:
``` js
const output = { // Objeto
  id     : FIELD,
  titulo : FIELD,
  precio : FIELD
}
const output = [{ // Lista de objetos
  id     : FIELD,
  titulo : FIELD,
  precio : FIELD
}]
```
Puede incluir objetos anidados (asociaciones de los modelos):
``` js
const output = [{
  id     : FIELD,
  titulo : FIELD,
  precio : FIELD,
  autor  : {
    id      : FIELD,
    nombre  : FIELD,
    usuario : {
      id       : FIELD,
      username : FIELD,
      password : FIELD,
      roles    : [{
        id     : FIELD,
        nombre : FIELD
      }]
    }
  }
}]
```

**Nota.-** Para crear un objeto de tipo `output`, puede utilizar la librería  [field-creator](https://github.com/waquispe/field-creator).

# Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `sudo npm install --save sequelize-options`

# Ejemplos

## Ejemplo 1. Construir el output.

Objeto de entrada (query) y un modelo de salida (output).
``` js
const { Options } = require('sequelize-options')

const AUTOR = sequelize.define('autor', {
  id_autor : { type: Sequelize.INTEGER(), primaryKey: true },
  nombre   : Sequelize.STRING(),
  ci       : Sequelize.INTEGER(),
  telefono : Sequelize.INTEGER()
})

const LIBRO = sequelize.define('libro', {
  id_libro : { type: Sequelize.INTEGER(), primaryKey: true },
  titulo   : Sequelize.STRING(),
  precio   : Sequelize.FLOAT()
})

AUTOR.hasMany(LIBRO, { as: 'libros', foreignKey: { name: 'fid_autor' } })
LIBRO.belongsTo(AUTOR, { as: 'autor', foreignKey: { name: 'fid_autor', targetKey: 'id_autor' } })

const QUERY = {
  fields: 'titulo,precio,autor(nombre,ci,telefono)',
  order: '-autor.nombre'
}

const OUTPUT = [{
  id_libro : LIBRO.attributes.id_libro,
  titulo   : LIBRO.attributes.titulo,
  precio   : LIBRO.attributes.precio,
  autor    : {
    id_autor : AUTOR.attributes.id_autor
    nombre   : AUTOR.attributes.nombre
  }
}]

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

También podemos incluir los atributos de los submodelos dentro del objeto raiz.
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
