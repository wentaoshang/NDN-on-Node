var NDN = require('../build/ndn.js').NDN;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;
var Closure = require('../build/ndn.js').Closure;
var Key = require('../build/ndn.js').Key;

var key = new Key();
key.fromPemFile('./test.pem');

var MyClosure = function MyClosure() {
    // Inherit from Closure.
    Closure.call(this);
};

MyClosure.prototype.upcall = function(kind, upcallInfo) {
    console.log('MyClosure.upcall() called.');
    if (kind == Closure.UPCALL_FINAL) {
	// Do nothing.
    } else if (kind == Closure.UPCALL_INTEREST) {
	var interest = upcallInfo.interest;

	var si = new SignedInfo();
	si.setFields(key);

	var co = new ContentObject(interest.name, si, content, new Signature());
	co.sign(key);

	upcallInfo.contentObject = co;
	return Closure.RESULT_INTEREST_CONSUMED;
    }
    return Closure.RESULT_OK;
};

var ndn = new NDN();
ndn.default_key = key;

ndn.onopen = function () {
    var n = new Name('/ndn/ucla.edu/cs/wentao/test1');
    ndn.registerPrefix(n, new MyClosure());
    console.log('Prefix registered.');
};

ndn.connect();

console.log('Started...');