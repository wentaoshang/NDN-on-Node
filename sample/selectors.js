var ndn = require('../');
var util = require('util');

var sel = new ndn.Selectors ();

sel.minSuffix = 1;
sel.maxSuffix = 1;
sel.exclude = new ndn.Exclude ([ndn.Exclude.Any, '%00%20']);
sel.childSelector = 0;
sel.fresh = true;

console.log ('Original Selectors:');
console.log (util.inspect (sel, false, null));

var bin = sel.encodeToBinary ();

console.log ('Encode:');
console.log (bin);

var s1 = ndn.Selectors.parse (bin);

console.log ('Decode back:');
console.log (util.inspect (s1, false, null));