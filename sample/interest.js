var non = require('../');

var n = new non.Name('/wentao.shang/test001');
var i = new non.Interest(n);
i.answerOriginKind = non.Interest.ANSWER_NO_CONTENT_STORE;
i.interestLifetime = 1234;

console.log('Interest in XML representation:');
console.log(i.to_xml());

var n1 = new non.Name('/a/b/c.txt');
var i1 = new non.Interest(n1);
i1.interestLifetime = 1000;
i1.childSelector = 1;
i1.exclude = new non.Exclude(['%00%02', non.Exclude.ANY, '%00%20']);
console.log(i1.to_xml());
    
var name1 = new non.Name('/a/b/c.txt/%00%01');
var name2 = new non.Name('/a/b/c.txt/%00%0F');
console.log('Interest matches Name:');
console.log(name1.to_uri() + ' ? ' + i1.matches_name(name1));
console.log(name2.to_uri() + ' ? ' + i1.matches_name(name2));