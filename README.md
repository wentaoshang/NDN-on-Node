Notice
======

The development of this repo has been permanently stopped. Please refer to https://github.com/named-data/ndn-js for the latest version of NDN.JS.

NDN.JS: A pure JavaScript NDN client library
============================================

Introduction
------------

NDN.JS starts as a browser-based JavaScript implementation of the NDN client API.
Later it is ported to Node.js as a separate library called NDN-on-Node.
The usage of the Node.js library is quite different from the original browser-based NDN.JS library but more similar to PyNDN in that 
it is used to implement standalone NDN applications outside Web browser environment.
And the source code also looks different because NDN-on-Node depends on several Node.js native classes to perform memory data manipulation and cryptographic computations.
However, it has always been desirable to have a single codebase for both libraries in order to reduce cost of maintainance.

This version of NDN.JS introduces several hacks on top of NDN-on-Node to provide wrappers for Node.js classes/functions in browser environment, 
such as require(), Buffer class, createHash, createSign, etc.
With these wrappers, the old NDN.JS and NDN-on-Node are merged into a unified codebase and share most of the core library files.

See the file INSTALL.md for build and install instructions.

NDN.JS is open source under a license described in the file COPYING.

Usage
-----

To use this library in browser, first build the library and then add ./build/ndn.js or ./build/ndn.min.js script into your Web page.
See ./sample/browser/ for examples.

To use this library in Node.js, add "require('ndn-on-node')" in your code.

For example:

    var NDN = require('ndn-on-node').NDN;
    var ndn = new NDN();
    ndn.connect();

NDN object comes with a default RSA key upon creation, which is hard-coded into the JS file. If you want to change the default signing key in NDN object, you need to call NDN.setDefaultKey(), which takes two parameters indicating the PEM-encoded public & private key file names. These files can be generated using the following OPENSSL commands:

    openssl genrsa -out non.pem 1024
    openssl rsa -in non.pem -pubout > non.pub

Note that in the browser enviroment it is impossible to change the default RSA key through PEM files. 
We are still trying to find a better solution for handling private keys in JavaScript.

More sample codes can be found in ./sample folder.
