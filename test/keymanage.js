var Key = require('../build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./non.pub', './non.pem');

console.log('Public key DER:\n' + key.publicToDER().toString('hex'));
console.log('Public key PEM:\n' + key.publicToPEM());
console.log('Public key ID:\n' + key.getKeyID().toString('hex'));
console.log('Private key DER:\n' + key.privateToDER().toString('hex'));
console.log('Private key PEM:\n' + key.privateToPEM());
