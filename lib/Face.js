/**
 * @author: Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var Interest = require('./Interest.js').Interest;
var Data = require('./Data.js').Data;
var ForwardingEntry = require('./ForwardingEntry.js').ForwardingEntry;
var Key = require('./Key.js').Key;
var UnixSocketTransport = require('./UnixSocketTransport.js').UnixSocketTransport;
var Block = require('./Block.js').Block;
var NdnType = require('./NdnType.js').NdnType;

var LOG = 0;

var Face = function Face (settings)
{
    settings = (settings || {});
    this.transport = new UnixSocketTransport ();
    this.host = (settings.host || 'localhost');
    this.port = (settings.port || 9696);
    this.ready_status = Face.UNOPEN;

    // Event handler
    this.onopen = function () { console.log("NDN connection established."); };
    this.onclose = function () { console.log("NDN connection closed."); };

    this.ndndid = null;

    // Fetch ndndid now
    this.transport.connect (this);
};

exports.Face = Face;

Face.UNOPEN = 0;  // created but not opened yet
Face.OPENED = 1;  // connection to ccnd opened
Face.CLOSED = 2;  // connection to ccnd closed

var ndndid_name = new Name ('/%C1.M.S.localhost/%C1.M.SRV/ndnd/KEY');

// Private callback fired by TcpTransport when TCP connection is established
Face.prototype.transport_open = function ()
{
    this.ready_status = Face.OPENED;
    // Call user callback
    this.onopen ();
};

Face.prototype.fetch_ndndid = function ()
{
    var i = new Interest (ndndid_name);
    i.interestLifetime = 4000; // milliseconds
    this.transport.send (i.encodeToBinary ());
};

// Private callback fired by TcpTransport when TCP connection is closed by remote host
Face.prototype.closeByTransport = function ()
{
    this.ready_status = Face.CLOSED;
    this.onclose();
};

// Send packet through NDN wrapper
Face.prototype.send = function (packet)
{
    if (this.ready_status != Face.OPENED)
	throw new Error('Cannot send because NDN connection is not opened.');
    
    if (packet instanceof Buffer)
	this.transport.send(packet);
    else if (packet instanceof Interest || packet instanceof Data)
	this.transport.send(packet.encodeToBinary());
    else
	throw new Error('Cannot send object of type ' + packet.constructor.name);
};

// Close NDN wrapper
Face.prototype.close = function ()
{
    if (this.ready_status != Face.OPENED)
	throw new Error('Cannot close because NDN connection is not opened.');

    this.ready_status = Face.CLOSED;
    this.transport.close();
};

// For fetching data
var PITTable = new Array();

var PITEntry = function PITEntry(interest) {
    this.interest = interest;  // Interest
    this.closure = [];    // Closure array
    this.timerID = -1;  // Timer ID
};

// Return the longest entry from PITTable that matches name.
var getEntryForExpressedInterest = function (/*Name*/ name) {
    var result = null;
    
    for (var i = 0; i < PITTable.length; i++) {
	if (PITTable[i].interest.matches_name(name)) {
            if (result == null || 
                PITTable[i].interest.name.components.length > result.interest.name.components.length)
                result = PITTable[i];
        }
    }
    
    return result;
};

var findIdenticalInterest = function (inst)
{
    for (var i = 0; i < PITTable.length; i++) {
	if (PITTable[i].interest.name.equals(inst.name)) {
	    //XXX: different selectors are ignored for now
	    return PITTable[i];
        }
    }

    return null;
};

// For publishing data
var RPTable = [];

var RPEntry = function RPEntry (name, closure)
{
    this.name = name;        // Name
    this.closure = closure;  // Closure
};

var getEntryForRegisteredPrefix = function (name)
{
    for (var i = 0; i < RPTable.length; i++) {
	if (RPTable[i].name.isPrefixOf(name))
	    return RPTable[i];
    }
    return null;
};


/**
 * Signature of 'onData': function (interest, contentObject) {}
 * Signature of 'onTimeOut': function (interest) {}
 */
Face.prototype.expressInterest = function (inst, onData, onTimeOut)
{
    if (this.ready_status != Face.OPENED) {
	throw new Error('NDN connection is not established.');
    }

    var closure = new DataClosure(onData, onTimeOut);
    
    // Check existing entry first
    var entry = findIdenticalInterest(inst);
    if (entry != null && entry.closure != null) {
	entry.closure.push(closure);
	return;
    }

    var pitEntry = new PITEntry(inst);
    pitEntry.closure.push(closure);
    PITTable.push(pitEntry);

    if (inst.interestLifetime == null)
	// Use default timeout value
	inst.interestLifetime = 4000;
	
    if (closure.onTimeout != null) {
	pitEntry.timerID = setTimeout(function() {
		if (LOG > 3) console.log("Interest time out.");
					
		// Remove PIT entry from PITTable.
		var index = PITTable.indexOf(pitEntry);
		if (index >= 0)
		    PITTable.splice(index, 1);
					
		// Raise timeout callback
		var arr_cb = pitEntry.closure;
		for (var i = 0; i < arr_cb.length; i++) {
		    if (arr_cb[i].onTimeout != null)
			arr_cb[i].onTimeout(pitEntry.interest);
		}
	    }, inst.interestLifetime);  // interestLifetime is in milliseconds.
	//console.log(closure.timerID);
    }

    this.transport.send (inst.encodeToBinary ());
};

/**
 * Signature of 'onInterest': function (interest) {}
 */
Face.prototype.registerPrefix = function (prefix, onInterest) {
    if (this.ready_status != Face.OPENED) {
	throw new Error('NDN connection is not established.');
    }

    if (this.ccndid == null) {
	throw new Error('ccnd node ID unkonwn. Cannot register prefix.');
    }

    if (this.default_key == null) {
	throw new Error('Cannot register prefix without default key');
    }
    
    var fe = new ForwardingEntry('selfreg', prefix, null, null, 3, 2147483647);
    var feBytes = fe.encodeToBinary();

    var co = new ContentObject(new Name(), feBytes);
    co.sign(this.default_key);  // Use default key to sign registration packet
    var coBinary = co.encodeToBinary();

    var interestName = new Name(['ccnx', this.ccndid, 'selfreg', coBinary]);
    var interest = new Interest(interestName);
    interest.scope = 1;
    
    var closure = new InterestClosure(onInterest);
    var csEntry = new RPEntry(prefix, closure);
    RPTable.push(csEntry);

    var data = interest.encodeToBinary();
    this.transport.send(data);

    if (LOG > 3) console.log('Prefix registration packet sent.');
};

/**
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 */
Face.prototype.on_message = function (msg)
{
    if (LOG > 4)
	console.log ('Face.on_message: complete message received with length=' + msg.length + '.');
    
    var block = new Block (msg);
    var type = block.peek_var_num ();  // get type of message

    // Dispatch according to packet type
    if (type == NdnType.Interest) {  // Interest packet
	var interest = new Interest ();
	interest.from_tlv (msg);
	
	if (LOG > 4)
	    console.log ('Face.on_message: Interest name is ' + interest.name.to_uri ());
	
	var entry = getEntryForRegisteredPrefix(interest.name);
	if (entry != null && entry.closure != null && entry.closure.onInterest != null) {
	    entry.closure.onInterest(interest);
	}				
    } else if (type == NdnType.Data) {  // Content packet
	var data = new Data ();
	data.from_tlv (block);

	if (LOG > 4)
	    console.log('Face.on_message: Data name is ' + data.name.to_uri ());

	// if (this.ndndid == null && ndndid_name.isPrefixOf (data.name)) {
	//     // We are in starting phase, record publisherPublicKeyDigest as ndndid
	//     if(!co.signedInfo || !co.signedInfo.publisher 
	//        || !co.signedInfo.publisher.publisherPublicKeyDigest) {
	// 	console.log("Cannot contact router, close NDN now.");
		
	// 	// Close NDN if we fail to connect to a ccn router
	// 	this.ready_status = NDN.CLOSED;
	// 	this.transport.close();
	//     } else {
	// 	if (LOG>3) console.log('Connected to local ccnd.');
	// 	this.ccndid = co.signedInfo.publisher.publisherPublicKeyDigest;
	// 	if (LOG>3) console.log('Local ccnd ID is ' + this.ccndid.toString('hex'));
		
	// 	// Call NDN.onopen after success
	// 	this.ready_status = NDN.OPENED;
	// 	this.onopen();
	//     }
	// } else {
	    var pitEntry = getEntryForExpressedInterest (data.name);
	    if (pitEntry != null) {
		// Remove PIT entry from PITTable
		var index = PITTable.indexOf(pitEntry);
		if (index >= 0)
		    PITTable.splice(index, 1);

		var arr_cb = pitEntry.closure;
		
		// Cancel interest timer
		clearTimeout(pitEntry.timerID);

		// No signature verification
		for (var i = 0; i < arr_cb.length; i++) {
		    var cl = arr_cb[i];
		    if (cl.onData != null)
			cl.onData(pitEntry.interest, data);
		}
	    }
	// }
    }
};

var DataClosure = function DataClosure(onData, onTimeout) {
    this.onData = onData;
    this.onTimeout = onTimeout;
};

var InterestClosure = function InterestClosure(onInterest) {
    this.onInterest = onInterest;
};
