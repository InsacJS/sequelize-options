module.exports = (sequelize, Sequelize) => {
  const MODEL = sequelize.define('libro', {
    id_libro: { type: Sequelize.INTEGER(), primaryKey: true },
    titulo: Sequelize.STRING(),
    precio: Sequelize.FLOAT()
  })

  MODEL.associate = (models) => {
    models.libro.belongsTo(models.autor, { as: 'autor',
      foreignKey: { name: 'fid_autor', targetKey: 'id_autor', allowNull: false }
    })
  }

  return MODEL
}
