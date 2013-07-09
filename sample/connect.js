var NDN = require('../').NDN;

var ndn = new NDN();

ndn.onopen = function () {
    console.log('NDN connection established.');
    ndn.close();
};

ndn.connect();