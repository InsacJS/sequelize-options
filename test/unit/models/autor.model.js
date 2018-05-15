const { Field } = require('field-creator')

module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('autor', {
    id_autor : Field.ID(),
    nombre   : Field.STRING(),
    ci       : Field.INTEGER(),
    telefono : Field.INTEGER()
  })

  MODEL.associate = (models) => {
    models.autor.hasMany(models.libro, { as: 'libros', foreignKey: { name: 'fid_autor' } })
  }

  return MODEL
}
