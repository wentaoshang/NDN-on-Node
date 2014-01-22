/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Block = require('./Block.js').Block;

var LOG = 0;

var UnixSocketTransport = function UnixSocketTransport ()
{    
    this.socket = null;
    this.sock_ready = false;
    this.buffers = [];  // invariant: this.buffers[0] is the beginning of a packet
    this.bytes_rcvd = 0;
};

exports.UnixSocketTransport = UnixSocketTransport;

UnixSocketTransport.prototype.connect = function (face)
{
    if (this.socket != null)
	delete this.socket;

    var net = require ('net');
    this.socket = new net.Socket ();
    
    var self = this;

    this.socket.on ('data', function (data) {			
	    if (typeof data == 'object') {
		// Make a copy of data (maybe a Buffer or a String)
		var buf = new Buffer (data);

		self.buffers.push (buf);
		self.bytes_rcvd += buf.length;

		// Check packet length
		var block = new Block (self.buffers[0]);
		block.read_var_num ();  // ignore type field
		var val_len = block.read_var_num ();  // read length field
		var pkt_len = block.head + val_len;

		if (pkt_len > self.bytes_rcvd)
		    // Still need more data
		    return;

		// Got enough data
		var packet = Buffer.concat (self.buffers, pkt_len);

		self.buffers = [];
		self.bytes_rcvd = 0;

		// Keep the remaining data and put it in the beginning of the array
		var tail_len = self.bytes_rcvd - pkt_len;
		if (tail_len > 0) {
		    var tail_buf = buf.slice (buf.length - tail_len);
		    self.buffers.push (tail_buf);
		    self.bytes_rcvd += tail_len;
		}

		// Notify face
		face.on_message (packet);
	    }
	});
    
    this.socket.on ('connect', function () {
	    if (LOG > 3)
		console.log ('socket.onconnect: connection opened.');
	    
	    self.sock_ready = true;

	    // Fetch ccndid now
	    face.transport_open ();
	});
    
    this.socket.on('error', function() {
	    if (LOG > 3) console.log('socket.onerror: socket error');
	});
    
    this.socket.on('close', function() {
	    if (LOG > 3) console.log('socket.onclose: connection closed.');

	    self.socket = null;
	    
	    // Close NDN when socket is closed
	    face.transport_close ();
	});

    this.socket.connect ({path: '/tmp/.ndnd.sock'});
};

/**
 * Send data.
 */
UnixSocketTransport.prototype.send = function (/*Buffer*/ data)
{
    if (this.sock_ready)
        this.socket.write (data);
    else
	throw new Error ('UnixSocketTransport.send: connection not established');
};

/**
 * Close transport
 */
UnixSocketTransport.prototype.close = function ()
{
    this.socket.end ();
    if (LOG > 3)
	console.log ('UnixSocketTransport.close: connection closed.');
};
