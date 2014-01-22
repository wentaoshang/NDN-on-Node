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
    this.host = settings.host || 'localhost';
    this.port = settings.port || 9696;
    this.ready_status = Face.UNOPEN;

    // Event handler
    this.onopen = settings.onopen || (function () { console.log("NDN connection established."); });
    this.onclose = settings.onclose || (function () { console.log("NDN connection closed."); });

    this.ndndid = null;
    this.on_message = on_ndndid;  // set message handler to the one that processes ndndid data packet
    this.transport_open = fetch_ndndid;

    // Fetch ndndid now
    this.transport.connect (this);
};

exports.Face = Face;

Face.UNOPEN = 0;  // created but not opened yet
Face.OPENED = 1;  // connection to ccnd opened
Face.CLOSED = 2;  // connection to ccnd closed

var ndndid_name = new Name ('/%C1.M.S.localhost/%C1.M.SRV/ndnd/KEY');

// Private callback fired when ndndid is received
var ndndid_ready = function (face)
{
    face.ready_status = Face.OPENED;
    // Change message handler to the one that processes normal communications
    face.on_message = on_packet;
    // Call user callback
    face.onopen ();
};

// Private callback to fetch ndndid
var fetch_ndndid = function ()
{
    var i = new Interest (ndndid_name);
    i.interestLifetime = 4000; // milliseconds
    this.transport.send (i.encodeToBinary ());
};

var on_ndndid = function (msg)
{
    var block = new Block (msg);
    var type = block.peek_var_num ();  // get type of message

    if (type != NdnType.Data)
	throw new Error ('Face.on_ndndid: expecting Data packet');

    var data = new Data ();
    data.from_tlv (block);

    if (!ndndid_name.isPrefixOf (data.name))
	throw new Error ('Face.on_ndndid: wrong name for ndndid');

    this.ndndid = data.name.components[4].buffer.slice (6);
    
    if (LOG > 0)
	console.log ('Face.on_ndndid: ndndid is ' + this.ndndid.toString('hex'));

    ndndid_ready (this);
};

// Private callback fired by the transport when connection is closed by remote host
Face.prototype.transport_close = function ()
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
Face.prototype.setInterestFilter = function (prefix, onInterest)
{
    if (this.ready_status != Face.OPENED) {
	throw new Error ('Face.setInterestFilter: Face is not connected');
    }

    if (this.ndndid == null) {
	throw new Error ('Face.setInterestFilter: ndnd node ID unkonwn');
    }

    var fe = new ForwardingEntry ();
    fe.action = new Buffer('selfreg');
    fe.name = prefix;
    fe.flags = 3;
    var feBytes = fe.encodeToBinary ();

    var d = new Data ();
    d.name = new Name ();
    d.content = feBytes;
    var dataBinary = d.encodeToBinary ();

    var interestName = new Name (['ndnx', this.ndndid, 'selfreg', dataBinary]);
    var interest = new Interest (interestName);
    interest.scope = 1;
    
    var closure = new InterestClosure (onInterest);
    var rpEntry = new RPEntry (prefix, closure);
    RPTable.push (rpEntry);

    // Send interest without creating PIT entry
    // This will ignore the response from ndnd
    this.transport.send (interest.encodeToBinary ());
};

/**
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 */
var on_packet = function (msg)
{
    if (LOG > 4)
	console.log ('Face.on_message: complete message received with length=' + msg.length + '.');
    
    var block = new Block (msg);
    var type = block.peek_var_num ();  // get type of message

    // Dispatch according to packet type
    if (type == NdnType.Interest) {  // Interest packet
	var interest = new Interest ();
	interest.from_tlv (block);
	
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
    }
};

var DataClosure = function DataClosure(onData, onTimeout) {
    this.onData = onData;
    this.onTimeout = onTimeout;
};

var InterestClosure = function InterestClosure(onInterest) {
    this.onInterest = onInterest;
};
