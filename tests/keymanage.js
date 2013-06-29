var Key = require('../tools/build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./test.pem');