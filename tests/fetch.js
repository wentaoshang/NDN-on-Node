var NDN = require('../build/ndn.js').NDN;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;
var Closure = require('../build/ndn.js').Closure;

var MyClosure = function MyClosure() {
    // Inherit from Closure.
    Closure.call(this);
};

MyClosure.prototype.upcall = function(kind, upcallInfo) {
    console.log("Closure.upcall() executed.");
    if (kind == Closure.UPCALL_FINAL) {
	// Do nothing.
    } else if (kind == Closure.UPCALL_CONTENT || kind == Closure.UPCALL_CONTENT_UNVERIFIED) {
	console.log("ContentObject received.");
	var co = upcallInfo.contentObject;
	console.log('Name: ' + co.name.to_uri());
	console.log('Content: ' + co.content.toString());
    } else if (kind == Closure.UPCALL_CONTENT_BAD) {
	console.log("Verification failed.");
    } else if (kind == Closure.UPCALL_INTEREST_TIMED_OUT) {
	console.log("Interest time out.");
    }

    console.log('Quit script now.');
    ndn.close();  // This will cause the script to quit
    return Closure.RESULT_OK;
};

var ndn = new NDN({verify:false});
//var ndn = new NDN();

ndn.onopen = function () {
    var n = new Name('/wentao.shang/regtest001');
    var template = new Interest();
    template.interestLifetime = 4000;
    ndn.expressInterest(n, new MyClosure(), template);
    console.log('Interest expressed.');
};

ndn.connect();

console.log('Started...');