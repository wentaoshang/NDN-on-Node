var NDN = require('../build/ndn.js').NDN;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;

var onData = function (interest, co, status) {
    if (status == NDN.CONTENT || status == NDN.CONTENT_UNVERIFIED) {
	console.log("ContentObject received in callback.");
	console.log('Name: ' + co.name.to_uri());
	console.log('Content: ' + co.content.toString());
	console.log('ContentObject in XML representation:');
	console.log(co.to_xml());
    } else if (status == NDN.CONTENT_BAD) {
	console.log("Verification failed.");
    }
    
    console.log('Quit script now.');
    ndn.close();  // This will cause the script to quit
};

var onTimeout = function (interest) {
    console.log("Interest time out.");
    console.log('Interest name: ' + interest.name.to_uri());
};

var ndn = new NDN();

ndn.onopen = function () {
    var n = new Name('/wentao.shang/regtest001');
    var template = new Interest();
    template.answerOriginKind = Interest.ANSWER_NO_CONTENT_STORE;  // bypass cache in ccnd
    template.interestLifetime = 4000;
    ndn.expressInterest(n, template, onData, onTimeout);
    console.log('Interest expressed.');
};

ndn.connect();

console.log('Started...');