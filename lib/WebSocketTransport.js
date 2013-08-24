/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var WebSocketTransport = function WebSocketTransport() {    
    this.ws = null;
    this.elementReader = null;
};

WebSocketTransport.prototype.connect = function(ndn) {
    if (this.ws != null)
	delete this.ws;
    
    this.ws = new WebSocket('ws://' + ndn.host + ':' + ndn.port);
    if (LOG > 3) console.log('WebSocket object created.');
    
    this.ws.binaryType = "arraybuffer";
    
    this.elementReader = new BinaryXmlElementReader(ndn);
    
    var self = this;
    this.ws.onmessage = function (/*MessageEvent*/ msg) {
	var result = msg.data;
				
	if(result == null || result == undefined || result == "" ) {
	    console.log('Invalid WebSocket message.');
	} else if (result instanceof ArrayBuffer) {
	    var bytearray = new Buffer(new Uint8Array(result));
	    
	    if (LOG>3) console.log('Binary response is ' + bytearray.toString('hex'));
	    
            // Find the end of the binary XML element and call ndn.onReceivedElement.
            self.elementReader.onReceivedData(bytearray);
	}
    };
    
    this.ws.onopen = function (ev) {
	if (LOG > 3) console.log('WebSocket connection opened.');
	if (LOG > 3) console.log('ReadyState: ' + this.readyState);

	// Fetch ccndid now
	ndn.fetchCcndId();
    };
	
    this.ws.onerror = function (ev) {
	console.log('WebSocket error.');
    };
	
    this.ws.onclose = function (ev) {
	console.log('WebSocket connection closed: code ' + ev.code);
	self.ws = null;
		
	// Close NDN when WebSocket is closed
	ndn.closeByTransport();
    };
};

/**
 * Send the Uint8Array data.
 */
WebSocketTransport.prototype.send = function(data) {
    if (this.ws != null) {
        // If we directly use data.buffer to feed ws.send(), 
        // WebSocket may end up sending a packet with 10000 bytes of data.
        // That is, WebSocket will flush the entire buffer
        // regardless of the offset of the Uint8Array. So we have to create
        // a new Uint8Array buffer with just the right size and copy the 
        // content from binaryInterest to the new buffer.
        //    ---Wentao
        var bytearray = new Uint8Array(data.length);
        bytearray.set(data);
        this.ws.send(bytearray.buffer);
    }
    else
	console.log('WebSocket connection is not established.');
};

/**
 * Close transport
 */
WebSocketTransport.prototype.close = function () {
    this.ws.close();
    if (LOG > 3) console.log('WebSocket connection closed.');
};
