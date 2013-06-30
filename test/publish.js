var NDN = require('../build/ndn.js').NDN;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;
var Signature = require('../build/ndn.js').Signature;
var SignedInfo = require('../build/ndn.js').SignedInfo;
var Key = require('../build/ndn.js').Key;

//var key = new Key();
//key.fromPemFile('./non.pub', './non.pem');

var onInterest = function (interest) {
    console.log('Interest received in callback.');

    var si = new SignedInfo();
//    si.setFields(key);
    si.setFields(mykey);

    var co = new ContentObject(interest.name, si, 'NDN on Node\n', new Signature());
    co.sign(mykey);

    ndn.send(co.encodeToBinary());
};

var ndn = new NDN();
ndn.setDefaultKey('./non.pub', './non.pem');

var mykey = ndn.getDefaultKey();

ndn.onopen = function () {
    var n = new Name('/wentao.shang/regtest001');
    ndn.registerPrefix(n, onInterest);
    console.log('Prefix registered.');
};

ndn.connect();

console.log('Started...');