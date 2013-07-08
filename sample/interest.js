var NoN = require('../index.js');

var n = new NoN.Name('/wentao.shang/test001');
var i = new NoN.Interest(n);
i.answerOriginKind = NoN.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

console.log('Interest in XML representation:');
console.log(i.to_xml());
