var Key = require('../build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./test.pem');