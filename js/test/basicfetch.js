var NDN = require('../tools/build/ndn.js').NDN;
var Name = require('../tools/build/ndn.js').Name;
var Interest = require('../tools/build/ndn.js').Interest;

var Closure = require('../tools/build/ndn.js').Closure;

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
    } else if (kind == Closure.UPCALL_INTEREST_TIMED_OUT) {
	console.log("Interest time out.");
    }
    return Closure.RESULT_OK;
};

var ndn = new NDN({verify:false});

ndn.onopen = function () {
    var n = new Name('/ndn/ucla.edu/apps/cps/melnitz/TV1/PanelJ/%FD%05%1C%CA%98%80%D9/index');
    var template = new Interest();
    template.interestLifetime = 4000;
    ndn.expressInterest(n, new MyClosure(), template);
    console.log('Interest sent.');
};

ndn.connect();

console.log('Started...');