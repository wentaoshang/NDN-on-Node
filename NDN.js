/**
 * @author: Meki Cherkaoui, Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents the top-level object for communicating with an NDN host.
 */

/**
 * Ported to node.js by Wentao Shang
 */

var LOG = 0;

/**
 * NDN wrapper
 */
var NDN = function NDN() {
    this.transport = new TcpTransport();
    this.ready_status = NDN.UNOPEN;

    // Event handler
    this.onopen = function () { if (LOG > 3) console.log("NDN connection established."); };
    this.onclose = function () { if (LOG > 3) console.log("NDN connection closed."); };

    this.ccndid = null;
    this.default_key = null;
};

NDN.prototype.setDefaultKey = function (pubfile, prifile) {
    this.default_key = new Key();
    this.default_key.fromPemFile(pubfile, prifile);
};

NDN.prototype.getDefaultKey = function () {
    return this.default_key;
};

exports.NDN = NDN;

NDN.UNOPEN = 0;  // created but not opened yet
NDN.OPENED = 1;  // connection to ccnd opened
NDN.CLOSED = 2;  // connection to ccnd closed

NDN.ccndIdFetcher = new Name('/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY');

// Wrapper to connect to local ccnd
NDN.prototype.connect = function () {
    if (this.ready_status == NDN.OPENED)
	throw new NoNError('NDNError', 'cannot connect because connection is already opened.');

    this.transport.connect(this);
};

// Wrapper to send Buffer of data
NDN.prototype.send = function (/*Buffer*/ data) {
    if (this.ready_status != NDN.OPENED)
	throw new NoNError('NDNError', 'cannot send because connection is not opened.');
    
    this.transport.send(data);
};

NDN.prototype.close = function () {
    if (this.ready_status != NDN.OPENED)
	throw new NoNError('NDNError', 'cannot close because connection is not opened.');

    this.ready_status = NDN.CLOSED;
    this.transport.close();
};

// For fetching data
var PITTable = new Array();

var PITEntry = function PITEntry(interest, closure) {
    this.interest = interest;  // Interest
    this.closure = closure;    // Closure
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

// For publishing data
var CSTable = new Array();

var CSEntry = function CSEntry(name, closure) {
    this.name = name;        // Name
    this.closure = closure;  // Closure
};

var getEntryForRegisteredPrefix = function (name) {
    for (var i = 0; i < CSTable.length; i++) {
	if (CSTable[i].name.match(name) != null)
	    return CSTable[i];
    }
    return null;
};


// Verification status
NDN.CONTENT = 0; // content verified
NDN.CONTENT_UNVERIFIED = 1; // content that has not been verified
NDN.CONTENT_BAD = 2; // verification failed

/**
 * Prototype of 'onData': function (interest, contentObject, verification_status) {}
 * Prototype of 'onTimeOut': function (interest) {}
 */
NDN.prototype.expressInterest = function (name, template, onData, onTimeOut) {
    if (this.ready_status != NDN.OPENED) {
	throw new NoNError('NDNError', 'connection is not established.');
    }

    var interest = new Interest(name);
    if (template != null) {
	interest.minSuffixComponents = template.minSuffixComponents;
	interest.maxSuffixComponents = template.maxSuffixComponents;
	interest.publisherPublicKeyDigest = template.publisherPublicKeyDigest;
	interest.exclude = template.exclude;
	interest.childSelector = template.childSelector;
	interest.answerOriginKind = template.answerOriginKind;
	interest.scope = template.scope;
	interest.interestLifetime = template.interestLifetime;
    }
    else
        interest.interestLifetime = 4000;   // default interest timeout value in milliseconds.

    var closure = new DataClosure(onData, onTimeOut);
    var pitEntry = new PITEntry(interest, closure);
    PITTable.push(pitEntry);

    if (interest.interestLifetime == null)
	// Use default timeout value
	interest.interestLifetime = 4000;
	
    if (interest.interestLifetime > 0) {
	pitEntry.timerID = setTimeout(function() {
		if (LOG > 3) console.log("Interest time out.");
					
		// Remove PIT entry from PITTable.
		var index = PITTable.indexOf(pitEntry);
		//console.log(PITTable);
		if (index >= 0)
		    PITTable.splice(index, 1);
		//console.log(PITTable);
		//console.log(pitEntry.interest.name.to_uri());
					
		// Raise timeout callback
		closure.onTimeout(pitEntry.interest);
	    }, interest.interestLifetime);  // interestLifetime is in milliseconds.
	//console.log(closure.timerID);
    }

    this.transport.send(interest.encodeToBinary());
};

/**
 * Prototype of 'onInterest': function (interest) {}
 */
NDN.prototype.registerPrefix = function(prefix, onInterest) {
    if (this.ready_status != NDN.OPENED) {
	throw new NoNError('NDNError', 'connection is not established.');
    }

    if (this.ccndid == null) {
	throw new NoNError('NDNError', 'ccnd node ID unkonwn. Cannot register prefix.');
    }

    if (this.default_key == null) {
	throw new NoNError('NDNError', 'cannot register prefix without default key');
    }
    
    var fe = new ForwardingEntry('selfreg', prefix, null, null, 3, 2147483647);
    var bytes = fe.encodeToBinary();

    var si = new SignedInfo();
    si.setFields(this.default_key);

    var co = new ContentObject(new Name(), si, bytes, new Signature()); 
    co.sign(this.default_key);
    var coBinary = co.encodeToBinary();

    var interestName = new Name(['ccnx', this.ccndid, 'selfreg', coBinary]);
    var interest = new Interest(interestName);
    interest.scope = 1;
    
    var closure = new InterestClosure(onInterest);
    var csEntry = new CSEntry(prefix, closure);
    CSTable.push(csEntry);

    var data = interest.encodeToBinary();
    this.transport.send(data);

    if (LOG > 3) console.log('Prefix registration packet sent.');
};

/*
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 * Look up in the PITTable and call the closure callback.
 */
NDN.prototype.onReceivedElement = function(element) {
    if (LOG > 4) console.log('Complete element received. Length ' + element.length + '. Start decoding.');
    
    var decoder = new BinaryXMLDecoder(element);
    // Dispatch according to packet type
    if (decoder.peekStartElement(CCNProtocolDTags.Interest)) {  // Interest packet
	if (LOG > 3) console.log('Interest received.');
	
	var interest = new Interest();
	interest.from_ccnb(decoder);
	if (LOG > 3) console.log(interest);
	var name = interest.name;
	if (LOG > 3) console.log(name);
	
	var entry = getEntryForRegisteredPrefix(name);
	if (entry != null) {
	    //console.log(entry);
	    entry.closure.onInterest(interest);
	}				
    } else if (decoder.peekStartElement(CCNProtocolDTags.ContentObject)) {  // Content packet
	if (LOG > 3) console.log('ContentObject received.');
	
	var co = new ContentObject();
	co.from_ccnb(decoder);
	
	if (this.ccndid == null && NDN.ccndIdFetcher.match(co.name)) {
	    // We are in starting phase, record publisherPublicKeyDigest in ccndid
	    if(!co.signedInfo || !co.signedInfo.publisher 
	       || !co.signedInfo.publisher.publisherPublicKeyDigest) {
		console.log("Cannot contact router, close NDN now.");
		
		// Close NDN if we fail to connect to a ccn router
		this.ready_status = NDN.CLOSED;
		this.transport.close();
	    } else {
		if (LOG>3) console.log('Connected to local ccnd.');
		this.ccndid = co.signedInfo.publisher.publisherPublicKeyDigest;
		if (LOG>3) console.log('Local ccnd ID is ' + this.ccndid.toString('hex'));
		
		// Call NDN.onopen after success
		this.ready_status = NDN.OPENED;
		this.onopen();
	    }
	} else {
	    var pitEntry = getEntryForExpressedInterest(co.name);
	    if (pitEntry != null) {
		//console.log(pitEntry);
		// Remove PIT entry from PITTable
		var index = PITTable.indexOf(pitEntry);
		if (index >= 0)
		    PITTable.splice(index, 1);

		var cl = pitEntry.closure;
		
		// Cancel interest timer
		clearTimeout(pitEntry.timerID);

		// Key verification
		// We only verify the signature when the KeyLocator contains KEY bits

		if (co.signedInfo && co.signedInfo.locator && co.signature) {
		    var sig = co.signature.signature; // Buffer

		    if (co.signature.Witness != null) {
			// Bypass verification if Witness is present
			cl.onData(pitEntry.interest, co, NDN.CONTENT_UNVERIFIED);
			return;
		    }

		    var keylocator = co.signedInfo.locator;
		    if (keylocator.type == KeyLocatorType.KEY) {
			if (LOG > 3) console.log("Keylocator contains KEY:\n" + keylocator.publicKey.toString('hex'));
			
			var keyStr = keylocator.publicKey.toString('base64');
			var keyPem = "-----BEGIN PUBLIC KEY-----\n";
			for (var i = 0; i < keyStr.length; i += 64)
			    keyPem += (keyStr.substr(i, 64) + "\n");
			keyPem += "-----END PUBLIC KEY-----";
			if (LOG > 3) console.log("Convert public key to PEM format:\n" + keyPem);

			var verifier = require('crypto').createVerify('RSA-SHA256');
			verifier.update(co.signedData);
			var verified = verifier.verify(keyPem, sig);

			var flag = (verified == true) ? NDN.CONTENT : NDN.CONTENT_BAD;
			// Raise callback
			cl.onData(pitEntry.interest, co, flag);
		    } else {
			if (LOG > 3) console.log("KeyLocator does not contain KEY. Leave for user to verify data.");
			cl.onData(pitEntry.interest, co, NDN.CONTENT_UNVERIFIED);
		    }
		}
	    }
	}
    }
};

/*
 * A BinaryXmlElementReader lets you call onReceivedData multiple times which uses a
 *   BinaryXMLStructureDecoder to detect the end of a binary XML element and calls
 *   elementListener.onReceivedElement(element) with the element. 
 * This handles the case where a single call to onReceivedData may contain multiple elements.
 */
var BinaryXmlElementReader = function BinaryXmlElementReader(elementListener) {
    this.elementListener = elementListener;
    this.dataParts = [];
    this.structureDecoder = new BinaryXMLStructureDecoder();
};


BinaryXmlElementReader.prototype.onReceivedData = function(/* Buffer */ rawData) {
    // Process multiple objects in the data.
    while(true) {
        // Scan the input to check if a whole ccnb object has been read.
        this.structureDecoder.seek(0);
        if (this.structureDecoder.findElementEnd(rawData)) {
            // Got the remainder of an object.  Report to the caller.
            this.dataParts.push(rawData.slice(0, this.structureDecoder.offset));
            this.elementListener.onReceivedElement(DataUtils.concatArrays(this.dataParts));
        
            // Need to read a new object.
            rawData = rawData.slice(this.structureDecoder.offset, rawData.length);
            this.dataParts = [];
            this.structureDecoder = new BinaryXMLStructureDecoder();
            if (rawData.length == 0)
                // No more data in the packet.
                return;
            
            // else loop back to decode.
        }
        else {
            // Save for a later call to concatArrays so that we only copy data once.
            this.dataParts.push(rawData);
	    if (LOG>4) console.log('Incomplete packet received. Length ' + rawData.length + '. Wait for more input.');
            return;
        }
    }
};