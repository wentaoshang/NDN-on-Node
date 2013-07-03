/**
 * This class is used to encode ccnb binary elements (blob, type/value pairs).
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


var BinaryXMLEncoder = function BinaryXMLEncoder(){
    this.ostream = new DynamicBuffer(100);
    this.offset = 0;
};

exports.CcnbEncoder = BinaryXMLEncoder;

/*
 * Encode string in utf8.
 */
BinaryXMLEncoder.prototype.writeUString = function(/*String*/ utf8str) {
    this.encodeUString(utf8str, XML_UDATA);
};


BinaryXMLEncoder.prototype.writeBlob = function(/*Buffer*/ blob) {
    if (LOG > 4) console.log("writeBlob: ");
    if (LOG > 4) console.log(blob);
    this.encodeBlob(blob, blob.length);
};


BinaryXMLEncoder.prototype.writeStartElement = function (tag) {
    var dictionaryVal = tag;
    
    if (null == dictionaryVal) {
	this.encodeUString(tag, XML_TAG);
    } else {
	this.encodeTypeAndVal(XML_DTAG, dictionaryVal);
    }
};


BinaryXMLEncoder.prototype.writeEndElement = function() {
    if (LOG>4) console.log('Write end element at OFFSET ' + this.offset);
    this.ostream.ensureLength(this.offset + 1);
    this.ostream.array[this.offset] = XML_CLOSE;
    this.offset += 1;
};


BinaryXMLEncoder.prototype.writeElement = function(tag, data) {
    this.writeStartElement(tag);
    
    if (typeof data == 'number') {
	// Encode non-negative integer as decimal string
	if(LOG>4) console.log('Going to write a number ' + data);
	
	this.writeUString(data.toString());
    }
    else if (typeof data == 'string') {
	if(LOG>4) console.log('Going to write a string ' + data);
	
	this.writeUString(data);
    } else {
	if(LOG>4) console.log('Going to write a blob ' + data.toString('hex') );

	this.writeBlob(data);
    }
    
    this.writeEndElement();
};


var TypeAndVal = function TypeAndVal(_type, _val) {
    this.type = _type;
    this.val = _val;
};


BinaryXMLEncoder.prototype.encodeTypeAndVal = function (type, val) {
    if(LOG>4) console.log('Encoding type ' + type + ' and value '+ val);
    if(LOG>4) console.log('Offset is ' + this.offset);
	
    if ((type > XML_UDATA) || (type < 0) || (val < 0)) {
	throw new NoNError('EncodeError', "tag and value must be positive, and tag valid.");
    }
	
    // Encode backwards. Calculate how many bytes we need:
    var numEncodingBytes = this.numEncodingBytes(val);
    this.ostream.ensureLength(this.offset + numEncodingBytes);

    // Bottom 4 bits of val go in last byte with tag.
    this.ostream.array[this.offset + numEncodingBytes - 1] = 
    (BYTE_MASK &
     (((XML_TT_MASK & type) | 
       ((XML_TT_VAL_MASK & val) << XML_TT_BITS))) |
     XML_TT_NO_MORE); // set top bit for last byte
    val = val >>> XML_TT_VAL_BITS;
    
    // Rest of val goes into preceding bytes, 7 bits per byte, top bit
    // is "more" flag.
    var i = this.offset + numEncodingBytes - 2;
    while ((0 != val) && (i >= this.offset)) {
	this.ostream.array[i] = (BYTE_MASK & (val & XML_REG_VAL_MASK)); // leave top bit unset
	val = val >>> XML_REG_VAL_BITS;
	--i;
    }
    if (val != 0) {
	throw new NoNError('EncodeError', "this should not happen: miscalculated encoding");
    }
    this.offset += numEncodingBytes;
    
    return numEncodingBytes;
};


BinaryXMLEncoder.prototype.encodeUString = function (ustring, type) {
    if (null == ustring)
	throw new NoNError('EncodeError', 'cannot encode null string.');

    if (type == XML_TAG || type == XML_ATTR && ustring.length == 0)
	throw new NoNError('EncodeError', 'cannot encode empty string');
    
    if(LOG>4) console.log("The string to write is: " + ustring);

    var strBytes = new Buffer(ustring, 'ascii');
    
    this.encodeTypeAndVal(type, 
			  (((type == XML_TAG) || (type == XML_ATTR)) ?
			   (strBytes.length-1) :
			   strBytes.length));
    
    if(LOG>4) console.log("THE string buffer to write is:");
    if(LOG>4) console.log(strBytes);
    
    this.writeString(strBytes);
    this.offset += strBytes.length;
};


BinaryXMLEncoder.prototype.encodeBlob = function (blob, length) {
    if (null == blob)
	throw new NoNError('EncodeError', 'cannot encode null blob.');
    
    if(LOG>4) console.log('Length of blob is ' + length);

    this.encodeTypeAndVal(XML_BLOB, length);

    this.writeBlobArray(blob);
    this.offset += length;
};

var ENCODING_LIMIT_1_BYTE = ((1 << (XML_TT_VAL_BITS)) - 1);
var ENCODING_LIMIT_2_BYTES = ((1 << (XML_TT_VAL_BITS + XML_REG_VAL_BITS)) - 1);
var ENCODING_LIMIT_3_BYTES = ((1 << (XML_TT_VAL_BITS + 2 * XML_REG_VAL_BITS)) - 1);

BinaryXMLEncoder.prototype.numEncodingBytes = function (x) {
    if (x <= ENCODING_LIMIT_1_BYTE) return (1);
    if (x <= ENCODING_LIMIT_2_BYTES) return (2);
    if (x <= ENCODING_LIMIT_3_BYTES) return (3);
    
    var numbytes = 1;
    
    // Last byte gives you XML_TT_VAL_BITS
    // Remainder each give you XML_REG_VAL_BITS
    x = x >>> XML_TT_VAL_BITS;
    while (x != 0) {
        numbytes++;
	x = x >>> XML_REG_VAL_BITS;
    }
    return (numbytes);
};

BinaryXMLEncoder.prototype.writeDateTime = function (tag, time) {    
    if(LOG>4)console.log('Encoding CCNTime: ' + time.msec);
    if(LOG>4)console.log('Encoding CCNTime in binary value:' + time.encodeToBinary().toString('hex'));
    
    this.writeElement(tag, time.encodeToBinary());
};

// This does not update this.offset.
BinaryXMLEncoder.prototype.writeString = function (input) {	
    if(typeof input === 'string'){
    	if(LOG>4) console.log('Going to write a string: ' + input);
        
        this.ostream.ensureLength(this.offset + input.length);
	this.writeBlobArray(new Buffer(input, 'ascii'));
    }
    else{
	if(LOG>4) console.log('Going to write a string in binary form: ');
	if(LOG>4) console.log(input);
	
	this.writeBlobArray(input);
    }
};


BinaryXMLEncoder.prototype.writeBlobArray = function (/* Buffer */ blob) {	
    this.ostream.set(blob, this.offset);
};


BinaryXMLEncoder.prototype.getReducedOstream = function () {
    return this.ostream.subarray(0, this.offset);
};
