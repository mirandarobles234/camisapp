const { Schema, model } = require('mongoose');

const usuarioSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  clave: {
    type: String,
    required: true
  },

  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

const Usuario = model('Usuario', usuarioSchema);

module.exports = Usuario;