var Key = require('../build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./non.pub', './non.pem');

console.log('Public key DER:\n' + key.publicKeyDer.toString('hex'));
console.log('Public key PEM:\n' + key.publicKeyPem);
console.log('Private key PEM:\n' + key.privateKeyPem);
