NDN on Node
===========

NDN on Node (NoN) is an NDN library running on Node.js. The usage is quite different from the original browser-based NDN.JS library but more similar to PyCCN in that it is used to implement standalone NDN applications. It features a pure JavaScript implementation with no dependency on CCNx C library (which is true for PyCCN and ndn.cxx C++ library).

Major changes from NDN.JS:

* Use TCP rather than WebSocket to connect to local ccnd
* Use Node.js Buffer object rather than JavaScript ArrayBuffer to hold NDN packets in memory
* Implement key management interfaces, such as load key from PEM files
* Use callback-based rather than closure-based NDN event model
* Significant code cleanup and refactoring

Install
-------

NDN-on-Node is available on npm. Simply run 'npm install ndn-on-node' under your project folder to install the library.

Usage
-----

To use this library, add "require('ndn-on-node')" in your code.

For example:

    var NDN = require('ndn-on-node').NDN;
    var ndn = new NDN();
    ndn.connect();

If you don't publish data, you don't need to set default key for the NDN object. Otherwise, you need to call NDN.setDefaultKey(), which takes two parameters indicating the PEM-encoded public & private key file names. These files can be generated using the following OPENSSL commands:

    openssl genrsa -out non.pem 1024
    openssl rsa -in non.pem -pubout > non.pub

More sample codes can be found in ./sample folder.
