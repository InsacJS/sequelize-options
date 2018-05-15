const { Field } = require('field-creator')

module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('libro', {
    id_libro : Field.ID(),
    titulo   : Field.STRING(),
    precio   : Field.FLOAT()
  })

  MODEL.associate = (models) => {
    models.libro.belongsTo(models.autor, {
      as         : 'autor',
      foreignKey : { name: 'fid_autor', targetKey: 'id_autor', allowNull: false }
    })
  }

  return MODEL
}
