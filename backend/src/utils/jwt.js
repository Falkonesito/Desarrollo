// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET  || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '2h';

/**
 * Emite un JWT con los datos mínimos del usuario.
 * @param {{ id:number, rol:string, email:string, nombre?:string }} payload
 * @returns {string} token
 */
function emitirToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

module.exports = { emitirToken, JWT_SECRET };
