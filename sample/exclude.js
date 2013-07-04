var NoN = require('../build/ndn.js');

var n = new NoN.Name('/wentao.shang/test001');
var i = new NoN.Interest(n);
i.answerOriginKind = NoN.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

var seg = new Buffer(2);
seg[0] = 0;
seg[1] = 12;
var filter = new NoN.Exclude(['before', NoN.Exclude.ANY, new Buffer('after', 'ascii'), NoN.Exclude.ANY, seg]);
i.exclude = filter;

console.log('Interest in XML representation:');
console.log(i.to_xml());
