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
	
    this.socket = require('net').connect({host: this.ndn.host, port: this.ndn.port});
    
    var self = this;

    this.socket.on('data', function(data) {			
	    if (typeof result == 'object') {
		var bytearray = new Buffer(result);
	    	
		// Find the end of the binary XML element and call ndn.onReceivedElement.
		self.elementReader.onReceivedData(bytearray);
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
	    console.log('socket.onerror: TCP socket error');
	});
	
    this.socket.on('close', function() {
	    console.log('socket.onclose: TCP connection closed.');
	    self.socket = null;
	    
	    // Close NDN when TCP Socket is closed
	    self.ndn.readyStatus = NDN.CLOSED;
	    self.ndn.onclose();
	    //console.log("NDN.onclose event fired.");
	});
};

/*
 * Send Buffer data.
 */
TcpTransport.prototype.send = function(/*Buffer*/ data) {
    if (this.sock_ready) {
        this.socket.write(data);
    } else
	console.log('TCP connection is not established.');
}
