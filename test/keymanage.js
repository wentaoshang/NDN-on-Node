var Key = require('../build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./testpub.pem', './testpri.pem');