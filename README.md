NDN on Node
===========

NDN.JS running on Node.js. This library is implemented in pure JavaScript.

Usage
-----

To use this library, put ./build/ndn.js in your project folder and 'require' that file in your code.

For example:

    var NDN = require('./ndn.js').NDN;
    var ndn = new NDN();
    ndn.connect();

More sample codes can be found in ./test folder.

Build
-----

To build the 'ndn.js' lib file, simply run the script 'make-js.sh' in ./build folder.
