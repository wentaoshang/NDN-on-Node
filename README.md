NDN on Node
===========

NDN on Node (NoN) is an NDN library running on Node.js. The usage is quite different from the original browser-based NDN.JS library but more similar to PyCCN in that it is used to implement standalone NDN applications. It features a pure JavaScript implementation with no dependency on CCNx C library (which is true for PyCCN and ndn.cxx C++ library).

Major changes from NDN.JS:

* Use TCP rather than WebSocket to connect to local ccnd
* Use Node.js Buffer object rather than JavaScript ArrayBuffer to hold NDN packets in memory
* Implement key management interfaces, such as load key from PEM files
* Use callback-based rather than closure-based NDN event model
* Significant code cleanup and refactoring

Usage
-----

To use this library, install NDN-on-Node in your project folder via 

   npm install ndn-on-node

and then 'require' the library in your code.

For example:

    var NDN = require('nnd-on-node').NDN;
    var ndn = new NDN();
    ndn.connect();

More sample codes can be found in ./sample folder.
