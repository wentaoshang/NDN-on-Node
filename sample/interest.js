var non = require('../');

var n = new non.Name('/wentao.shang/test001');
var i = new non.Interest(n);
i.answerOriginKind = non.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

console.log('Interest in XML representation:');
console.log(i.to_xml());
