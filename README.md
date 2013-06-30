NDN on Node
===========

NDN on Node (NoN) is an NDN library running on Node.js. It is implemented in pure JavaScript. The usage is quite different from the original browser-based NDN.JS library but more similar to PyCCN in that it is used to implement standalone NDN applications.

Major changes from NDN.JS:

* Use TCP rather than WebSocket to connect to local ccnd
* Use Node.js Buffer object rather than JavaScript ArrayBuffer to hold NDN packets in memory
* Implement key management interfaces, such as load key from PEM files
* Use callback-based rather than closure-based NDN event model

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

To build the 'ndn.js' lib file, simply run the script 'make.sh' in ./build folder.
