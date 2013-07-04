var NoN = require('../build/ndn.js');

var n = new NoN.Name('/wentao.shang/test001');
var i = new NoN.Interest(n);
i.answerOriginKind = NoN.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

// XXX: this filter is meaningless, just for test purpose
var filter = new NoN.Exclude(['before', NoN.Exclude.ANY, new Buffer('after', 'ascii'), NoN.Exclude.ANY, '%00%10']);
i.exclude = filter;

console.log('Interest with random Exclude:');
console.log(i.to_xml());

// Test Exlucde.matches()
var filter1 = new NoN.Exclude(['%00%02', NoN.Exclude.ANY, '%00%20']);
console.log('Meaningful Exclude:');
console.log(filter1.to_xml());

var comp1 = NoN.Name.stringComponentToBuffer('%00%01');
var comp2 = NoN.Name.stringComponentToBuffer('%00%0F');
console.log('Matches:');
console.log(NoN.Name.toEscapedString(comp1) + ' ? ' + filter1.matches(comp1));
console.log(NoN.Name.toEscapedString(comp2) + ' ? ' + filter1.matches(comp2));
