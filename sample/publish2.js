var NDN = require('../').NDN;
var Name = require('../').Name;
var Interest = require('../').Interest;
var ContentObject = require('../').ContentObject;

var onInterest = function (interest) {
    console.log('Interest received in callback.');

    var co = new ContentObject(interest.name, 'NDN on Node\n');
    co.sign(mykey, {'keyName':mykeyname});

    try {
	ndn.send(co);
    } catch (e) {
	console.log(e.toString());
    }
};

var ndn = new NDN();
var mykey = ndn.getDefaultKey();
var mykeyname = new Name('/wentao.shang/regtest001/key/').appendKeyID(mykey).appendVersion().appendSegment(0);

ndn.onopen = function () {
    var n = new Name('/wentao.shang/regtest001');
    ndn.registerPrefix(n, onInterest);
    console.log('Prefix registered.');
};

ndn.connect();

console.log('Started...');
