var ndn = require ('../');
var util = require ('util');

var n = new ndn.Name ('/a/b/c.txt');
var i = new ndn.Interest (n);

var sel = new ndn.Selectors ();
sel.minSuffix = 1;
sel.maxSuffix = 1;
sel.exclude = new ndn.Exclude ([ndn.Exclude.Any, '%00%20']);
sel.childSelector = 0;
sel.fresh = true;

i.selectors = sel;
i.interestLifetime = 1000;

console.log ('Original Interest:');
console.log (util.inspect (i, false, null));

var bin = i.encodeToBinary ();

console.log ('Encode:');
console.log (bin);

var i1 = ndn.Interest.parse (bin);

console.log ('Decode back:');
console.log (util.inspect (i1, false, null));
    
var name1 = new ndn.Name ('/a/b/c.txt/%00%01');
var name2 = new ndn.Name ('/a/b/c.txt/%00%2F');
console.log ('Interest matches Name:');
console.log (name1.to_uri () + ' ? ' + i1.matches_name (name1));
console.log (name2.to_uri () + ' ? ' + i1.matches_name (name2));