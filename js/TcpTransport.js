/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var TcpTransport = function TcpTransport(ndn) {    
    this.socket = null;
    this.sock_ready = false;
    this.ndn = ndn;
    this.elementReader = new BinaryXmlElementReader(ndn);
};

TcpTransport.prototype.connect = function() {
    if (this.socket != null)
	delete this.socket;
    
    // Connect to local ccnd via TCP
    var net = require('net');
    this.socket = new net.Socket();
    
    var self = this;

    this.socket.on('data', function(data) {			
	    if (typeof data == 'object') {
		console.log("data");
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
	    var interest = new Interest(NDN.ccndIdFetcher);
	    interest.interestLifetime = 4000; // milliseconds
	    self.send(encodeToBinaryInterest(interest));
	});
    
    this.socket.on('error', function() {
	    if (LOG > 3) console.log('socket.onerror: TCP socket error');
	});
    
    this.socket.on('close', function() {
	    if (LOG > 3) console.log('socket.onclose: TCP connection closed.');

	    self.socket = null;
	    
	    // Close NDN when TCP Socket is closed
	    self.ndn.ready_status = NDN.CLOSED;
	    self.ndn.onclose();
	});

    this.socket.connect({host: 'localhost', port: 9695});
};

/**
 * Send Buffer data.
 */
TcpTransport.prototype.send = function(/*Buffer*/ data) {
    if (this.sock_ready) {
	console.log(data.toString('hex'));
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