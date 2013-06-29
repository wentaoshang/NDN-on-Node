/**
 * @author: Meki Cherkaoui, Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents the top-level object for communicating with an NDN host.
 */

/**
 * Ported to node.js by Wentao Shang
 */

var LOG = 4;

/**
 * settings is an associative array with the following defaults:
 * {
 *   host: 'localhost', // If null, use getHostAndPort when connecting.
 *   port: 9696,
 *   verify: true
 *   onopen: function() { if (LOG > 3) console.log("NDN connection established."); }
 *   onclose: function() { if (LOG > 3) console.log("NDN connection closed."); }
 * }
 * 
 */
var NDN = function NDN(settings) {
    settings = (settings || {});
    this.transport = new TcpTransport(this);
    this.ready_status = NDN.UNOPEN;
    this.verify = (settings.verify !== undefined ? settings.verify : true);

    // Event handler
    this.onopen = (settings.onopen || function() { if (LOG > 3) console.log("NDN connection established."); });
    this.onclose = (settings.onclose || function() { if (LOG > 3) console.log("NDN connection closed."); });
    this.ccndid = null;
};

exports.NDN = NDN;

NDN.UNOPEN = 0;  // created but not opened yet
NDN.OPENED = 1;  // connection to ccnd opened
NDN.CLOSED = 2;  // connection to ccnd closed

NDN.ccndIdFetcher = new Name('/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY');

// Wrapper to connect to local ccnd
NDN.prototype.connect = function () {
    this.transport.connect();
};

// Wrapper to send Buffer of data
NDN.prototype.send = function (/*Buffer*/ data) {
    if (this.ready_status == NDN.OPENED) {
        this.transport.send(data);
    } else
	console.log('NDN connection is not opened.');
};

NDN.prototype.close = function () {
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

var getEntryForRegisteredPrefix = function (/* Name */ name) {
    for (var i = 0; i < CSTable.length; i++) {
	if (CSTable[i].name.match(name) != null)
	    return CSTable[i];
    }
    return null;
}

/** 
 *  Encode name as an Interest. If template is not null, use its attributes.
 *  Send the interest to host:port, read the entire response and call
 *  closure.upcall(Closure.UPCALL_CONTENT (or Closure.UPCALL_CONTENT_UNVERIFIED),
 *                 new UpcallInfo(this, interest, 0, contentObject)).                 
 */

/**
 *  The use of closure here is not right. Should use 'OnData' and 'OnTimeOut' callbacks   ---SWT
 */
NDN.prototype.expressInterest = function(/*Name*/ name, /*Closure*/ closure, /*Interest*/ template) {
    if (this.readyStatus != NDN.OPENED) {
	console.log('Connection is not established.');
	return;
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

    if (closure != null) {
	var pitEntry = new PITEntry(interest, closure);
	PITTable.push(pitEntry);
	closure.pitEntry = pitEntry;

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
					
		    // Raise closure callback
		    closure.upcall(Closure.UPCALL_INTEREST_TIMED_OUT, new UpcallInfo(ndn, interest, 0, null));
		}, interest.interestLifetime);  // interestLifetime is in milliseconds.
	    //console.log(closure.timerID);
	}
    }

    this.transport.send(encodeToBinaryInterest(interest));
};

NDN.prototype.setInterestFilter = function(name, closure, flag) {
    if (this.readyStatus != NDN.OPENED) {
	console.log('Connection is not established.');
    }

    if (this.ccndid == null) {
	console.log('ccnd node ID unkonwn. Cannot register prefix.');
    }
    
    var fe = new ForwardingEntry('selfreg', name, null, null, 3, 2147483647);
    var bytes = encodeForwardingEntry(fe);
    
    var si = new SignedInfo();
    	
    var co = new ContentObject(new Name(), si, bytes, new Signature()); 
    co.sign();
    var coBinary = encodeToBinaryContentObject(co);
    
    var nodename = this.ccndid;
    var interestName = new Name(['ccnx', nodename, 'selfreg', coBinary]);

    var interest = new Interest(interestName);
    interest.scope = 1;
    if (LOG > 3) console.log('Send Interest registration packet.');
    
    var csEntry = new CSEntry(name, closure);
    NDN.CSTable.push(csEntry);
    
    this.transport.send(encodeToBinaryInterest(interest));
};

/*
 * This is called when an entire binary XML element is received, such as a ContentObject or Interest.
 * Look up in the PITTable and call the closure callback.
 */
NDN.prototype.onReceivedElement = function(element) {
    if (LOG>3) console.log('Complete element received. Length ' + element.length + '. Start decoding.');
    var decoder = new BinaryXMLDecoder(element);
    // Dispatch according to packet type
    if (decoder.peekStartElement(CCNProtocolDTags.Interest)) {  // Interest packet
	if (LOG > 3) console.log('Interest packet received.');
	
	var interest = new Interest();
	interest.from_ccnb(decoder);
	if (LOG > 3) console.log(interest);
	var name = interest.name;
	if (LOG > 3) console.log(name);
	
	var entry = getEntryForRegisteredPrefix(name);
	if (entry != null) {
	    //console.log(entry);
	    var info = new UpcallInfo(this, interest, 0, null);
	    var ret = entry.closure.upcall(Closure.UPCALL_INTEREST, info);
	    if (ret == Closure.RESULT_INTEREST_CONSUMED && info.contentObject != null) 
		this.transport.send(encodeToBinaryContentObject(info.contentObject));
	}				
    } else if (decoder.peekStartElement(CCNProtocolDTags.ContentObject)) {  // Content packet
	if (LOG > 3) console.log('ContentObject packet received.');
				
	var co = new ContentObject();
	co.from_ccnb(decoder);
				
	if (this.ccndid == null && NDN.ccndIdFetcher.match(co.name)) {
	    // We are in starting phase, record publisherPublicKeyDigest in ccndid
	    if(!co.signedInfo || !co.signedInfo.publisher 
	       || !co.signedInfo.publisher.publisherPublicKeyDigest) {
		console.log("Cannot contact router, close NDN now.");
						
		// Close NDN if we fail to connect to a ccn router
		this.readyStatus = NDN.CLOSED;
		this.onclose();
	    } else {
		if (LOG>3) console.log('Connected to local ccnd.');
		this.ccndid = co.signedInfo.publisher.publisherPublicKeyDigest;
		if (LOG>3) console.log('Local ccnd ID is ' + this.ccndid.toString('hex'));
						
		// Call NDN.onopen after success
		this.readyStatus = NDN.OPENED;
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

		var currentClosure = pitEntry.closure;
		
		// Cancel interest timer
		clearTimeout(pitEntry.timerID);
		//console.log("Clear interest timer");
		//console.log(currentClosure.timerID);

		if (this.verify == false) {
		    // Pass content up without verifying the signature
		    currentClosure.upcall(Closure.UPCALL_CONTENT_UNVERIFIED, new UpcallInfo(this, null, 0, co));
		    return;
		}

		// Key verification

		// Recursive key fetching & verification closure
		var KeyFetchClosure = function KeyFetchClosure(content, closure, key, sig) {
		    this.contentObject = content;  // unverified content object
		    this.closure = closure;  // closure corresponding to the contentObject
		    this.keyName = key;  // name of current key to be fetched
		    this.sig = sig;  // signature buffer to be verified

		    Closure.call(this);
		};

                var thisNdn = this;
		KeyFetchClosure.prototype.upcall = function(kind, upcallInfo) {
		    if (kind == Closure.UPCALL_INTEREST_TIMED_OUT) {
			console.log("In KeyFetchClosure.upcall: interest time out.");
			console.log(this.keyName.contentName.getName());
		    } else if (kind == Closure.UPCALL_CONTENT) {
			//console.log("In KeyFetchClosure.upcall: signature verification passed");
			var keyPem = "-----BEGIN CERTIFICATE-----\n" + this.contentObject.signedInfo.locator.publicKey.toString('base64') + "\n-----END CERTIFICATE-----";
			var verifier = require('crypto').createVerify('RSA-SHA256');
			verifier.update(this.contentObject.rawSignatureData);
			var verified = verifier.verify(keyPem, this.sig);
		        
			var flag = (verified == true) ? Closure.UPCALL_CONTENT : Closure.UPCALL_CONTENT_BAD;
			//console.log("raise encapsulated closure");
			this.closure.upcall(flag, new UpcallInfo(thisNdn, null, 0, this.contentObject));
		    } else if (kind == Closure.UPCALL_CONTENT_BAD) {
			console.log("In KeyFetchClosure.upcall: signature verification failed");
		    }
		};

		if (co.signedInfo && co.signedInfo.locator && co.signature) {
		    if (LOG > 3) console.log("Key verification...");
		    var sig = co.signature.signature; // Buffer

		    if (co.signature.Witness != null) {
			// Bypass verification if Witness is present
			// Pass content up without verifying the signature
			currentClosure.upcall(Closure.UPCALL_CONTENT_UNVERIFIED, new UpcallInfo(this, null, 0, co));
			return;
		    }

		    var keylocator = co.signedInfo.locator;
		    if (keylocator.type == KeyLocatorType.KEYNAME) {
			if (LOG > 3) console.log("KeyLocator contains KEYNAME");
			//var keyname = keylocator.keyName.contentName.getName();
			//console.log(nameStr);
			//console.log(keyname);

			if (keylocator.keyName.contentName.match(co.name)) {
			    if (LOG > 3) console.log("Content is key itself");
									
			    var keyPem = "-----BEGIN CERTIFICATE-----\n" + co.signedInfo.locator.publicKey.toString('base64') + "\n-----END CERTIFICATE-----";
			    var verifier = require('crypto').createVerify('RSA-SHA256');
			    verifier.update(co.rawSignatureData);
			    var verified = verifier.verify(keyPem, sig);
		        
			    var flag = (verified == true) ? Closure.UPCALL_CONTENT : Closure.UPCALL_CONTENT_BAD;
			    
			    currentClosure.upcall(flag, new UpcallInfo(this, null, 0, co));
			} else {
			    // Fetch key now
			    if (LOG > 3) console.log("Fetch key according to keylocator");
			    var nextClosure = new KeyFetchClosure(co, currentClosure, keylocator.keyName, sigHex, wit);
			    this.expressInterest(keylocator.keyName.contentName.getPrefix(4), nextClosure);
			}
		    } else if (keylocator.type == KeyLocatorType.KEY) {
			if (LOG > 3) console.log("Keylocator contains KEY");
			
			var keyPem = "-----BEGIN CERTIFICATE-----\n" + co.signedInfo.locator.publicKey.toString('base64') + "\n-----END CERTIFICATE-----";
			var verifier = require('crypto').createVerify('RSA-SHA256');
			verifier.update(co.rawSignatureData);
			var verified = verifier.verify(keyPem, sig);
		        
			var flag = (verified == true) ? Closure.UPCALL_CONTENT : Closure.UPCALL_CONTENT_BAD;
			// Raise callback
			currentClosure.upcall(Closure.UPCALL_CONTENT, new UpcallInfo(this, null, 0, co));
		    } else {
			var cert = keylocator.certificate;
			console.log("KeyLocator contains CERT");
			console.log(cert);
			
			// TODO: verify certificate
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
	    if (LOG>3) console.log('Incomplete packet received. Length ' + rawData.length + '. Wait for more input.');
            return;
        }
    }
}