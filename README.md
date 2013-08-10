NDN on Node
===========

NDN on Node (NoN) is an NDN library running on Node.js. The usage is quite different from the 
original browser-based NDN.JS library but more similar to PyNDN in that it is used to implement 
standalone NDN applications. It features a pure JavaScript implementation with no dependency on the 
NDNx C library (as PyNDN has).

Major changes from NDN.JS:

* Use TCP rather than WebSocket to connect to local ccnd
* Use Node.js Buffer object rather than JavaScript ArrayBuffer to hold NDN packets in memory
* Implement key management interfaces, such as load key from PEM files
* Use callback-based rather than closure-based NDN event model
* Significant code cleanup and refactoring

See the file INSTALL for build and install instructions.

NDN on Node is open source under a license described in the file COPYING.  

Usage
-----

To use this library, add "require('ndn-on-node')" in your code.

For example:

    var NDN = require('ndn-on-node').NDN;
    var ndn = new NDN();
    ndn.connect();

NDN object comes with a default RSA key upon creation, which is hard-coded into the JS file. If you want to change the default signing key in NDN object, you need to call NDN.setDefaultKey(), which takes two parameters indicating the PEM-encoded public & private key file names. These files can be generated using the following OPENSSL commands:

    openssl genrsa -out non.pem 1024
    openssl rsa -in non.pem -pubout > non.pub

More sample codes can be found in ./sample folder.
