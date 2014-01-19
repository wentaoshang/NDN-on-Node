var Key = require('../').Key;

var key = new Key('/ndn/js/default/key');
key.fromPemFile('./non.pub', './non.pem');

console.log('Public key DER:\n' + key.publicToDER().toString('hex'));
console.log('Public key PEM:\n' + key.publicToPEM());
console.log('Public key ID:\n' + key.getKeyID().toString('hex'));
console.log('Private key DER:\n' + key.privateToDER().toString('hex'));
console.log('Private key PEM:\n' + key.privateToPEM());
