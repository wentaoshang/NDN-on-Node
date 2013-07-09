var non = require('../');

var n = new non.Name('/wentao.shang/test001');
var i = new non.Interest(n);
i.answerOriginKind = non.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

// XXX: this filter is meaningless, just for test purpose
var filter = new non.Exclude(['before', non.Exclude.ANY, new Buffer('after', 'ascii'), non.Exclude.ANY, '%00%10']);
i.exclude = filter;

console.log('Interest with random Exclude:');
console.log(i.to_xml());

// Test Exlucde.matches()
var filter1 = new non.Exclude(['%00%02', non.Exclude.ANY, '%00%20']);
console.log('Meaningful Exclude:');
console.log(filter1.to_xml());

var comp1 = non.Name.stringComponentToBuffer('%00%01');
var comp2 = non.Name.stringComponentToBuffer('%00%0F');
console.log('Matches:');
console.log(non.Name.toEscapedString(comp1) + ' ? ' + filter1.matches(comp1));
console.log(non.Name.toEscapedString(comp2) + ' ? ' + filter1.matches(comp2));
