/**
 * This class is used to decode ccnb binary elements (blob, type/value pairs).
 * 
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 */

/**
 * Ported to node.js by Wentao Shang
 */

var XML_EXT = 0x00; 
var XML_TAG = 0x01; 
var XML_DTAG = 0x02; 
var XML_ATTR = 0x03; 
var XML_DATTR = 0x04; 
var XML_BLOB = 0x05; 
var XML_UDATA = 0x06; 
var XML_CLOSE = 0x0;
var XML_SUBTYPE_PROCESSING_INSTRUCTIONS = 16; 

var XML_TT_BITS = 3;
var XML_TT_MASK = ((1 << XML_TT_BITS) - 1);
var XML_TT_VAL_BITS = XML_TT_BITS + 1;
var XML_TT_VAL_MASK = ((1 << (XML_TT_VAL_BITS)) - 1);
var XML_REG_VAL_BITS = 7;
var XML_REG_VAL_MASK = ((1 << XML_REG_VAL_BITS) - 1);
var XML_TT_NO_MORE = (1 << XML_REG_VAL_BITS); // 0x80
var BYTE_MASK = 0xFF;
var LONG_BYTES = 8;
var LONG_BITS = 64;
	
var bits_11 = 0x0000007FF;
var bits_18 = 0x00003FFFF;
var bits_32 = 0x0FFFFFFFF;

var CCNB_DECODE_MAX_LEN = 32768;  // Stop decoding if field length is longer than a threshold

var BinaryXMLDecoder = function BinaryXMLDecoder(istream) {	
    this.istream = istream;  // Buffer
    this.offset = 0;
};

exports.CcnbDecoder = BinaryXMLDecoder;


BinaryXMLDecoder.prototype.readStartElement = function (startTag) {
    tv = this.decodeTypeAndVal();
    		
    if (null == tv) {
	throw new NoNError('DecodeError', "expected start element: " + startTag + " got something not a tag.");
    }
    
    var decodedTag = null;
			
    if (tv.type() == XML_TAG) {
	// Tag value represents length-1 as tags can never be empty.
	decodedTag = this.decodeUString(tv.val());
    } else if (tv.type() == XML_DTAG) {
	decodedTag = tv.val();
    }
    
    if ((null ==  decodedTag) || decodedTag != startTag ) {
	throw new NoNError('DecodeError', "expecting start element " + startTag + " but got " + decodedTag + "(" + tv.val() + ")");
    }
};


BinaryXMLDecoder.prototype.peekStartElementAsString = function () {
    var decodedTag = null;
    var previousOffset = this.offset;
    try {
	// Have to distinguish genuine errors from wrong tags. Could either use
	// a special exception subtype, or redo the work here.
	//this.TypeAndVal 
	var tv = this.decodeTypeAndVal();

	if (null != tv) {
	    if (tv.type() == XML_TAG) {
		if (tv.val()+1 > CCNB_DECODE_MAX_LEN) {
		    throw new NoNError("DecodeError", "length " + (tv.val() + 1) + " longer than expected maximum length.");
		}
		decodedTag = this.decodeUString(tv.val());
	    } else if (tv.type() == XML_DTAG) {
		decodedTag = tagToString(tv.val());					
	    }
	} // else, not a type and val, probably an end element. rewind and return false.
    }
    finally {
	this.offset = previousOffset;
    }
    return decodedTag;
};

BinaryXMLDecoder.prototype.peekStartElement = function (startTag) {
    if (typeof startTag == 'string') {
	var decodedTag = this.peekStartElementAsString();
	
	if ((null !=  decodedTag) && decodedTag == startTag) {
	    return true;
	}
	return false;
    } else if (typeof startTag == 'number') {
	var decodedTag = this.peekStartElementAsLong();
	if ((null !=  decodedTag) && decodedTag == startTag) {
	    return true;
	}
	return false;
    } else {
	throw new NoNError('DecodeError', "should be string or number.");
    }
}


BinaryXMLDecoder.prototype.peekStartElementAsLong = function () {
    var decodedTag = null;
    var previousOffset = this.offset;
		
    try {
	// Have to distinguish genuine errors from wrong tags. Could either use
	// a special exception subtype, or redo the work here.
	//this.TypeAndVal
	var tv = this.decodeTypeAndVal();

	if (null != tv) {
	    if (tv.type() == XML_TAG) {
		if (tv.val()+1 > CCNB_DECODE_MAX_LEN) {
		    throw new NoNError('DecodeError', "length " + (tv.val() + 1) + " longer than expected maximum length!");
		}
		// Tag value represents length-1 as tags can never be empty.
		var strTag = this.decodeUString(tv.val());
		decodedTag = stringToTag(strTag);
	    } else if (tv.type() == XML_DTAG) {
		decodedTag = tv.val();		
	    }
	} // else, not a type and val, probably an end element. rewind and return false.
    }
    finally {
	this.offset = previousOffset;
    }
    return decodedTag;
};


BinaryXMLDecoder.prototype.readBinaryElement = function (startTag){
    var blob = null;
    this.readStartElement(startTag);
    blob = this.readBlob();
    return blob;
};


BinaryXMLDecoder.prototype.readEndElement = function () {
    if(LOG>4)console.log('this.offset is '+ this.offset);
    
    var next = this.istream[this.offset]; 
    		
    this.offset++;
    
    if(LOG>4)console.log('XML_CLOSE IS '+ XML_CLOSE);
    if(LOG>4)console.log('next is '+ next);
			
    if (next != XML_CLOSE) {
	console.log("Expected end element, got: " + next);
	throw new NoNError('DecodeError', "expected end element, got: " + next);
    }
};


BinaryXMLDecoder.prototype.readUString = function () {
    var ustring = this.decodeUString();	
    this.readEndElement();
    return ustring;
};


BinaryXMLDecoder.prototype.readBlob = function () {
    var blob = this.decodeBlob();	
    this.readEndElement();
    return blob; // Buffer
};



BinaryXMLDecoder.prototype.readDateTime = function (startTag)  {
    var byteTimestamp = this.readBinaryElement(startTag);

    byteTimestamp = byteTimestamp.toString('hex');
    
    byteTimestamp = parseInt(byteTimestamp, 16);

    var lontimestamp = (byteTimestamp/ 4096) * 1000;

    //if(lontimestamp<0) lontimestamp =  - lontimestamp;

    if(LOG>4) console.log('DECODED DATE WITH VALUE');
    if(LOG>4) console.log(lontimestamp);

    var timestamp = new CCNTime(lontimestamp);
    //timestamp.setDateBinary(byteTimestamp);
    
    if (null == timestamp) {
	throw new NoNError('DecodeError', "cannot parse timestamp: " + byteTimestamp.toString('hex'));
    }		
    return timestamp;
};

BinaryXMLDecoder.prototype.decodeTypeAndVal = function() {
    var type = -1;
    var val = 0;
    var more = true;

    do {	
	var next = this.istream[this.offset];
		
	if (next < 0) {
	    return null; 
	}

	if ((0 == next) && (0 == val)) {
	    return null;
	}
		
	more = (0 == (next & XML_TT_NO_MORE));
		
	if  (more) {
	    val = val << XML_REG_VAL_BITS;
	    val |= (next & XML_REG_VAL_MASK);
	} else {
	    type = next & XML_TT_MASK;
	    val = val << XML_TT_VAL_BITS;
	    val |= ((next >>> XML_TT_BITS) & XML_TT_VAL_MASK);
	}
		
	this.offset++;
		
    } while (more);
	
    if(LOG>4) console.log('TYPE is '+ type + ' VAL is '+ val);

    return new TypeAndVal(type, val);
};


BinaryXMLDecoder.peekTypeAndVal = function() {
    var tv = null;    
    var previousOffset = this.offset;
    
    try {
	tv = this.decodeTypeAndVal();
    } finally {
	this.offset = previousOffset;
    }
    
    return tv;
};


BinaryXMLDecoder.prototype.decodeBlob = function (blobLength) {
    if (null == blobLength) {
	var tv = this.decodeTypeAndVal();
	blobLength = tv.val();
    }
    
    var bytes = this.istream.slice(this.offset, this.offset + blobLength);
    this.offset += blobLength;
    
    return bytes;
};


BinaryXMLDecoder.prototype.decodeUString = function (byteLength) {
    if (null == byteLength) {
	var tempStreamPosition = this.offset;
	
	var tv = this.decodeTypeAndVal();
	
	if ((null == tv) || (XML_UDATA != tv.type())) { // if we just have closers left, will get back null
	    this.offset = tempStreamPosition;
	    return "";
	}
			
	byteLength = tv.val();
    }

    var stringBytes = this.decodeBlob(byteLength);
    return stringBytes.toString();
};


//OBject containg a pair of type and value
var TypeAndVal = function TypeAndVal(_type, _val) {
    this.t = _type; // byte
    this.v = _val;  // byte
};

TypeAndVal.prototype.type = function () {
    return this.t;
};

TypeAndVal.prototype.val = function () {
    return this.v;
};


BinaryXMLDecoder.prototype.readIntegerElement = function (startTag) {
    if(LOG>4) console.log('READING INTEGER '+ startTag);
    if(LOG>4) console.log('TYPE OF '+ typeof startTag);
    
    var strVal = this.readUTF8Element(startTag);
    
    return parseInt(strVal);
};


BinaryXMLDecoder.prototype.readUTF8Element = function (startTag) {
    this.readStartElement(startTag);
    var strElementText = this.readUString();
    return strElementText;
};


/* 
 * Set the offset into the input, used for the next read.
 */
BinaryXMLDecoder.prototype.seek = function (offset) {
    this.offset = offset;
};
