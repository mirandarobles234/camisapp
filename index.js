const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const Usuario = require('./esquemaUsuario');
const Camiseta = require('./esquemaCamiseta');

const app = express();
const PORT = 3000;

// ==========================
// MIDDLEWARES
// ==========================

// Permite recibir JSON desde el frontend
app.use(express.json());

// Sirve los archivos HTML, CSS y JS desde la carpeta Public
app.use(express.static(path.join(__dirname, 'Public')));

// ==========================
// CONEXIÓN A MONGODB LOCAL
// ==========================

mongoose.connect('mongodb://localhost:27017/camisaApp')
  .then(() => {
    console.log('MongoDB local conectado correctamente');
  })
  .catch((error) => {
    console.error('Error al conectar con MongoDB:', error);
  });


  // Middleware para verificar JWT
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];  // Espera formato "Bearer token"
  try {
    const decoded = jwt.verify(token, secreto);    // Verifica y decodifica el token
    req.usuarioId = decoded.id;                    // Guardamos el id del token en la request para usarlo después
    next();                                       // Token válido, continuar a la siguiente función
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}




// ==========================
// RUTAS PRINCIPALES
// ==========================

// Cargar la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Cargar también si escriben /index.html
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// ==========================
// RUTAS DE USUARIOS
// ==========================

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email, clave } = req.body;

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      clave
    });

    const usuarioGuardado = await nuevoUsuario.save();

    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: usuarioGuardado
    });

  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear el usuario',
      error: error.message
    });
  }
});

// Obtener usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();

    res.json(usuarios);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

// ==========================
// RUTAS DE CAMISETAS - CRUD
// ==========================

// CREATE - Crear una camiseta
app.post('/api/camisetas', async (req, res) => {
  try {
    const {
      nombreDiseno,
      autor,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    } = req.body;

    const nuevaCamiseta = new Camiseta({
      nombreDiseno,
      autor,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    });

    const camisetaGuardada = await nuevaCamiseta.save();

    res.status(201).json({
      mensaje: 'Diseño de camiseta guardado correctamente',
      camiseta: camisetaGuardada
    });

  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al guardar la camiseta',
      error: error.message
    });
  }
});

// READ - Obtener todas las camisetas
app.get('/api/camisetas', async (req, res) => {
  try {
    const camisetas = await Camiseta.find().sort({ fechaCreacion: -1 });

    res.json(camisetas);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las camisetas',
      error: error.message
    });
  }
});

// READ - Obtener una camiseta por ID
app.get('/api/camisetas/:id', async (req, res) => {
  try {
    const camiseta = await Camiseta.findById(req.params.id);

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada'
      });
    }

    res.json(camiseta);

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener la camiseta',
      error: error.message
    });
  }
});

// UPDATE - Actualizar una camiseta
app.put('/api/camisetas/:id', async (req, res) => {
  try {
    const {
      nombreDiseno,
      autor,
      descripcion,
      torsoColor,
      mangaIzquierdaColor,
      mangaDerechaColor,
      cuelloColor
    } = req.body;

    const camisetaActualizada = await Camiseta.findByIdAndUpdate(
      req.params.id,
      {
        nombreDiseno,
        autor,
        descripcion,
        torsoColor,
        mangaIzquierdaColor,
        mangaDerechaColor,
        cuelloColor,
        actualizadoEn: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!camisetaActualizada) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada'
      });
    }

    res.json({
      mensaje: 'Diseño actualizado correctamente',
      camiseta: camisetaActualizada
    });

  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al actualizar la camiseta',
      error: error.message
    });
  }
});

// DELETE - Eliminar una camiseta
app.delete('/api/camisetas/:id', async (req, res) => {
  try {
    const camisetaEliminada = await Camiseta.findByIdAndDelete(req.params.id);

    if (!camisetaEliminada) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada'
      });
    }

    res.json({
      mensaje: 'Camiseta eliminada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la camiseta',
      error: error.message
    });
  }
});

// ==========================
// RUTA DE VOTACIÓN
// ==========================

// Votar por una camiseta
app.post('/api/camisetas/:id/votar', async (req, res) => {
  try {
    const { valor } = req.body;

    if (!valor || valor < 1 || valor > 5) {
      return res.status(400).json({
        mensaje: 'El voto debe estar entre 1 y 5'
      });
    }

    const camiseta = await Camiseta.findById(req.params.id);

    if (!camiseta) {
      return res.status(404).json({
        mensaje: 'Camiseta no encontrada'
      });
    }

    camiseta.votos += 1;
    camiseta.totalPuntos += Number(valor);
    camiseta.calificacion = camiseta.totalPuntos / camiseta.votos;
    camiseta.actualizadoEn = Date.now();

    await camiseta.save();

    res.json({
      mensaje: 'Voto registrado correctamente',
      camiseta
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al votar',
      error: error.message
    });
  }
});





const bcrypt = require('bcryptjs');

// Registro de un nuevo usuario
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, clave } = req.body;
    
    // 1. Generar un salt (semilla aleatoria) para el hash
    const salt = await bcrypt.genSalt(10);                  // 10 rondas de generación de salt
    // 2. Hashear la contraseña proporcionada usando el salt generado
    const hash = await bcrypt.hash(clave, salt);
    
    // 3. Crear y guardar el nuevo usuario con la contraseña hasheada
    const nuevoUsuario = new Usuario({ nombre, email, clave: hash });
    await nuevoUsuario.save();
    
    res.status(201).json({ mensaje: 'Usuario registrado con éxito', id: nuevoUsuario._id });
  } catch (error) {
    res.status(400).json({ error: 'No se pudo registrar el usuario' });
  }
});



const jwt = require('jsonwebtoken');

// Login de usuario (autenticación)
app.post('/api/login', async (req, res) => {
  try {
    const { email, clave } = req.body;
    
    // 1. Buscar al usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' }); // No se encontró el email
    }
    // 2. Verificar la contraseña con bcrypt.compare
    const passwordOk = await bcrypt.compare(clave, usuario.clave);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas' }); // Contraseña incorrecta
    }
    
    // 3. Credenciales válidas: Generar token JWT
    const datosToken = { id: usuario._id };            // Podemos incluir datos en el token (p.ej. el ID de usuario)
    const secreto = 'SECRETO_SUPER_SEGUR0';            // Clave secreta para firmar el token (en producción, mantener en una variable de entorno)
    const opciones = { expiresIn: '1h' };              // El token expirará en 1 hora
    const token = jwt.sign(datosToken, secreto, opciones);
    
    // 4. Enviar el token al cliente
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});




app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});



















// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find();    // Busca todos los documentos de usuarios en la BD
    res.json(usuarios);                       // Responde con la lista en formato JSON
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' }); // Error genérico en caso de fallo
  }
});

// Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id); // Busca usuario por el ID proporcionado
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' }); // Si no existe, 404
    }
    res.json(usuario); // Si existe, lo devolvemos en JSON
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const datosUsuario = req.body;            // Obtenemos los datos enviados en la petición
    const nuevo = new Usuario(datosUsuario);  // Creamos un nuevo documento Usuario
    const usuarioGuardado = await nuevo.save();      // Guardamos en la base de datos
    res.status(201).json(usuarioGuardado);    // Devolvemos el usuario creado con código 201 (Creado)
  } catch (error) {
    res.status(400).json({ error: 'Error al crear usuario' }); // Posibles errores de validación
  }
});

// Actualizar un usuario existente
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const datosActualizados = req.body;
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      { new: true } // opción new:true para obtener el documento actualizado
    );
    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuarioActualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuarioEliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});
