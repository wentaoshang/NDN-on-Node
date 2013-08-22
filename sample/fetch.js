var NDN = require('../').NDN;
var Name = require('../').Name;
var Interest = require('../').Interest;

var onData = function (inst, co) {
    console.log("ContentObject received in callback.");
    console.log('Name: ' + co.name.to_uri());
    console.log('Content: ' + co.content.toString());
    console.log('ContentObject in XML representation:');
    console.log(co.to_xml());
    
    console.log('Quit script now.');
    ndn.close();  // This will cause the script to quit
};

var onTimeout = function (interest) {
    console.log("Interest time out.");
    console.log('Interest name: ' + interest.name.to_uri());
    console.log('Quit script now.');
    ndn.close();
};

var ndn = new NDN();

ndn.onopen = function () {
    var n = new Name('/ndn/on/node/test');
    var template = new Interest();
    template.answerOriginKind = Interest.ANSWER_NO_CONTENT_STORE;  // bypass cache in ccnd
    template.interestLifetime = 4000;
    ndn.expressInterest(n, template, onData, onTimeout);
    console.log('Interest expressed.');
};

ndn.connect();

console.log('Started...');