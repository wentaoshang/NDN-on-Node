/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */
var BinaryXmlElementReader = require('./util/BinaryXMLElementReader.js').BinaryXmlElementReader;

var LOG = 0;

var TcpTransport = function TcpTransport() {    
    this.socket = null;
    this.sock_ready = false;
    this.elementReader = null;
};

exports.TcpTransport = TcpTransport;

TcpTransport.prototype.connect = function(ndn) {
    if (this.socket != null)
	delete this.socket;

    this.elementReader = new BinaryXmlElementReader(ndn);

    // Connect to local ccnd via TCP
    var net = require('net');
    this.socket = new net.Socket();
    
    var self = this;

    this.socket.on('data', function(data) {			
	    if (typeof data == 'object') {
		// Make a copy of data (maybe a Buffer or a String)
		var buf = new Buffer(data);
		// Find the end of the binary XML element and call ndn.onReceivedElement.
		self.elementReader.onReceivedData(buf);
	    }
	});
    
    this.socket.on('connect', function() {
	    if (LOG > 3) console.log('socket.onopen: TCP connection opened.');
	    
	    self.sock_ready = true;

	    // Fetch ccndid now
	    ndn.fetchCcndId();
	});
    
    this.socket.on('error', function() {
	    if (LOG > 3) console.log('socket.onerror: TCP socket error');
	});
    
    this.socket.on('close', function() {
	    if (LOG > 3) console.log('socket.onclose: TCP connection closed.');

	    self.socket = null;
	    
	    // Close NDN when TCP Socket is closed
	    ndn.closeByTransport();
	});

    this.socket.connect({host: 'localhost', port: 9695});
};

/**
 * Send data.
 */
TcpTransport.prototype.send = function(/*Buffer*/ data) {
    if (this.sock_ready) {
        this.socket.write(data);
    } else
	console.log('TCP connection is not established.');
};

/**
 * Close transport
 */
TcpTransport.prototype.close = function () {
    this.socket.end();
    if (LOG > 3) console.log('TCP connection closed.');
};