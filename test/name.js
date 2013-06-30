var lib = require("../build/ndn.js");

var name = new lib.Name("/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY");
console.log(name.components);

console.log(name.to_uri());