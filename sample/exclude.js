var non = require('../');

// This filter is meaningless, just for test purpose
var filter = new non.Exclude (['before', non.Exclude.Any, new Buffer ('after', 'ascii'), non.Exclude.Any, '%00%10']);
console.log (filter);

console.log ('Encode exclude filter:');
var bin = filter.encodeToBinary ();
console.log (bin);

var f = non.Exclude.parse (bin);
console.log ('Decode back:');
console.log (f.to_uri ());

// Test Exlucde.matches()
var filter1 = new non.Exclude (['%00%02', non.Exclude.Any, '%00%20']);
console.log ('Meaningful Exclude:');
console.log (filter1);

var comp1 = non.NameComponent.from_string ('%00%01');
var comp2 = non.NameComponent.from_string ('%00%0F');
console.log ('Matches:');
console.log (comp1.toEscapedString () + ' ? ' + filter1.matches (comp1));
console.log (comp2.toEscapedString () + ' ? ' + filter1.matches (comp2));
