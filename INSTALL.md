NDN.JS in browser
=================

Build a combined library for browser environment
------------------------------------------------

An efficient way to include the library is to used the combined and compressed library ndn.min.js that can be made using the waf tool.

To build the compressed library using Google Closure compressing tool:

    ./waf configure
    ./waf

The combined ndn.js and compressed ndn.min.js files will be ready in ./build/ folder.

The compressed version is what we recommend including in applications.

WebSocket Proxy
---------------

If you wish to run your own WebSockets proxy instead of using the NDN testbed, you must
build and install Node.js (often on the machine also running the ccnd you wish to proxy
for, but that doesn't have to be the case). See wsproxy/README.md

NDN.JS for Node.js
==================

NDN-on-Node does not require building. Simply run 

    npm install ndn-on-node

under your project folder.

Note that 'ndn-on-node' requires node.js version >= 0.10.15 
