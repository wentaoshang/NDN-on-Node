/**
 * @author: Meki Cheraoui, Jeff Thompson
 * See COPYING for copyright and distribution information.
 * This class represents a Name as an array of components where each is a byte array.
 */

/**
 * Ported to node.js by Wentao Shang
 */
var NoNError = require('./util/NoNError.js').NoNError;
var BinaryXMLEncoder = require('./util/BinaryXMLEncoder.js').BinaryXMLEncoder;
var CCNProtocolDTags = require('./util/CCNProtocolDTags.js').CCNProtocolDTags;
var DataUtils = require('./util/DataUtils.js').DataUtils;

var LOG = 0;
 
/**
 * Create a new Name from _components.
 * If _components is a string, parse it as a URI.  Otherwise it is an array of components
 * where each is a string, byte array, ArrayBuffer or Uint8Array. 
 * Convert and store as an array of Uint8Array.
 * If a component is a string, encode as utf8.
 */
var Name = function Name(_components) {
    if (_components == null)
	this.components = [];
    else if (typeof _components == 'string') {
	this.components = Name.createComponentArray(_components);
    } else if (typeof _components == 'object') {
	this.components = [];
        if (_components instanceof Name)
            this.add(_components);
        else {
            for (var i = 0; i < _components.length; i++)
                this.add(_components[i]);
        }
    }
};

exports.Name = Name;

/**
 * Get the number of components in the Name object
 */
Name.prototype.size = function () {
    return this.components.length;
};

/**
 * Add a component at the end of the Name.
 * 'component' is a string, Array, Buffer or Name.
 * Convert to Buffer and add to this Name.
 * If a component is a string, encode as utf8.
 * Return 'this' Name object to allow chaining calls to add.
 */
Name.prototype.add = function (component) {
    var result;
    if(typeof component == 'string')
        result = Name.stringComponentToBuffer(component);
    else if(typeof component == 'object' && component instanceof Buffer)
        result = component;
    else if (typeof component == 'object' && component instanceof Name) {
        var components;
        if (component == this)
            // special case, when we need to create a copy
            components = this.components.slice(0, this.components.length);
        else
            components = component.components;
        
        for (var i = 0; i < components.length; ++i)
            this.components.push(new Buffer(components[i]));

        return this;
    } else 
	throw new NoNError('NameError', "cannot add Name element at index " + this.components.length + ": Invalid type");
    
    this.components.push(result);
    return this;
};

// Alias for Name.add()
Name.prototype.append = function (component) {
    return this.add(component);
};

Name.prototype.appendVersion = function () {
    var d = new Date();
    var time = d.getTime().toString(16);

    if (time.length % 2 == 1)
	time = '0' + time;

    time = 'fd' + time;
    var binTime = new Buffer(time, 'hex');
    return this.add(binTime);
};

Name.prototype.appendSegment = function (seg) {
    if (seg == null || seg == 0)
	return this.add(new Buffer('00', 'hex'));

    var segStr = seg.toString(16);

    if (segStr.length % 2 == 1)
	segStr = '0' + segStr;

    segStr = '00' + segStr;
    return this.add(new Buffer(segStr, 'hex'));
};

Name.prototype.appendKeyID = function (/*Key*/ key) {
    var cmd = 'c12e4d2e4b00';  // '%C1.M.K%00'
    var digest = key.publicKeyDigest.toString('hex');
    var keyID = cmd + digest;
    return this.add(new Buffer(keyID, 'hex'));
};


// Convert URI string to Buffer. Handles special characters such as '%00'
// new Buffer(component, 'ascii') will encode '%00' as 0x20 (space)
// new Buffer(component, 'utf8') will encode '%C1' as a two-byte unicode character
// Both won't help in this case
Name.stringComponentToBuffer = function (component) {
    var buf = new Buffer(component.length);  // at least this length
    var pos = 0;  // # of bytes encoded into the Buffer
    var i = 0;
    while (i < component.length) {
	if (component[i] == '%') {
	    var hex = component.substr(i+1, 2);
	    buf[pos] = parseInt(hex, 16);
	    i += 2;
	} else
	    buf[pos] = component.charCodeAt(i);

	i++;
	pos++;
    }
    return buf.slice(0, pos);
};

/**
 * Parse name as a URI string and return an array of Buffer components.
 */
Name.createComponentArray = function (name) {
    name = name.trim();
    if (name.length <= 0)
        return [];

    var iColon = name.indexOf(':');
    if (iColon >= 0) {
        // Make sure the colon came before a '/'.
        var iFirstSlash = name.indexOf('/');
        if (iFirstSlash < 0 || iColon < iFirstSlash)
            // Omit the leading protocol such as ndn:
            name = name.substr(iColon + 1, name.length - iColon - 1).trim();
    }
    
    if (name[0] == '/') {
        if (name.length >= 2 && name[1] == '/') {
            // Strip the authority following "//".
            var iAfterAuthority = name.indexOf('/', 2);
            if (iAfterAuthority < 0)
                // Unusual case: there was only an authority.
                return [];
            else
                name = name.substr(iAfterAuthority + 1, name.length - iAfterAuthority - 1).trim();
        }
        else
            name = name.substr(1, name.length - 1).trim();
    }

    var array = name.split('/');
    
    for (var i = 0; i < array.length; ++i) {
        var component = array[i].trim();
        
        if (component.match(/[^.]/) == null) {
            // Special case for component of only periods.  
            if (component.length <= 2) {
                // Zero, one or two periods is illegal.  Ignore this componenent to be
                //   consistent with the C implmentation.
                // This also gets rid of a trailing '/'.
                array.splice(i, 1);
                --i;  
                continue;
            }
            else
                // Remove 3 periods.
                array[i] = component.substr(3, component.length - 3);
        }
        else
            array[i] = component;
        
        // Change the component to Buffer now.
        array[i] = Name.stringComponentToBuffer(array[i]);
    }

    return array;
};


Name.prototype.from_ccnb = function(/*XMLDecoder*/ decoder) {
    if (LOG>4) console.log('--------Start decoding Name...');

    decoder.readStartElement(this.getElementLabel());
		
    this.components = new Array();

    while (decoder.peekStartElement(CCNProtocolDTags.Component)) {
	this.add(decoder.readBinaryElement(CCNProtocolDTags.Component));
    }
		
    decoder.readEndElement();

    if (LOG>4) console.log('--------Finish decoding Name.');
};

Name.prototype.to_ccnb = function(/*XMLEncoder*/ encoder) {
    if (LOG>4) console.log('--------Encoding Name...');

    if (this.components == null)
	throw new NoNError('NameError', "cannot encode empty content name");

    encoder.writeStartElement(this.getElementLabel());
    var count = this.components.length;
    for (var i = 0; i < count; i++) {
	encoder.writeElement(CCNProtocolDTags.Component, this.components[i]);
    }
    encoder.writeEndElement();

    if (LOG>4) console.log('--------Finish encoding Name.');
};

Name.prototype.encodeToBinary = function () {
    var enc = new BinaryXMLEncoder();
    this.to_ccnb(enc);
    return enc.getReducedOstream();
};

Name.prototype.getElementLabel = function(){
    return CCNProtocolDTags.Name;
};


/**
 * Return component as an escaped string according to "CCNx URI Scheme".
 * We can't use encodeURIComponent because that doesn't encode all the characters we want to.
 */
Name.toEscapedString = function(component) {
    var result = "";
    var gotNonDot = false;
    for (var i = 0; i < component.length; ++i) {
        if (component[i] != 0x2e) {
            gotNonDot = true;
            break;
        }
    }
    if (!gotNonDot) {
        // Special case for component of zero or more periods.  Add 3 periods.
        result = "...";
        for (var i = 0; i < component.length; ++i)
            result += ".";
    }
    else {
        for (var i = 0; i < component.length; ++i) {
            var value = component[i];
            // Check for 0-9, A-Z, a-z, (+), (-), (.), (_)
            if (value >= 0x30 && value <= 0x39 || value >= 0x41 && value <= 0x5a ||
                value >= 0x61 && value <= 0x7a || value == 0x2b || value == 0x2d || 
                value == 0x2e || value == 0x5f)
                result += String.fromCharCode(value);
            else
                result += "%" + (value < 16 ? "0" : "") + value.toString(16).toUpperCase();
        }
    }
    return result;
};

// Return the escaped name string according to "CCNx URI Scheme".
Name.prototype.to_uri = function () {
    if (this.components.length == 0)
        return "/";
    
    var result = "";
	
    for(var i = 0; i < this.components.length; ++i)
	result += "/"+ Name.toEscapedString(this.components[i]);
    
    return result;
};


Name.is_text_encodable = function (/*Buffer*/ blob) {
    if (blob.length == 0) return false;

    for (var i = 0; i < blob.length; i++) {
	var c = blob[i];
	if (c < 0x20 || c > 0x7E) return false;
	if (c == 0x3C || c == 0x3E || c == 0x26) return false;
    }
    return true;
};

/**
 * Return a string of XML representation of the Name object
 * encoding can be 'hex' or 'base64'. if null, will use 'hex' by default
 */
Name.prototype.to_xml = function (encoding) {
    var xml = '<Name>';

    if (encoding == null)
	encoding = 'hex';

    for(var i = 0; i < this.components.length; i++) {
	var blob = this.components[i];
	if (Name.is_text_encodable(blob))
	    xml += '<Component ccnbencoding="text">' + blob.toString() + '</Component>';
	else 
	    xml += '<Component ccnbencoding="' + encoding + 'Binary">' + blob.toString(encoding).toUpperCase() + '</Component>';
    }
    xml += '</Name>';
    return xml;
};

/**
 * Return a new Name with the first nComponents components of this Name.
 */
Name.prototype.getPrefix = function (nComponents) {
    return new Name(this.components.slice(0, nComponents));
};

/**
 * Return a new Name with the suffix starting at the p-th component of this Name.
 */
Name.prototype.getSuffix = function (p) {
    return new Name(this.components.slice(p));
};

/**
 * Return a new Buffer of the component at i.
 */
Name.prototype.getComponent = function (i) {
    var result = new Buffer(this.components[i].length);
    this.components[i].copy(result);
    return result;
};


/**
 * Return true if this Name has the same components as name.
 */
Name.prototype.equalsName = function(name) {
    if (this.components.length != name.components.length)
        return false;
    
    // Start from the last component because they are more likely to differ.
    for (var i = this.components.length - 1; i >= 0; --i) {
        if (!DataUtils.arraysEqual(this.components[i], name.components[i]))
            return false;
    }
    
    return true;
};


/**
 * Returns true if 'this' is a prefix of 'name'
 */
Name.prototype.match = function (name) {
    var i_name = this.components;
    var o_name = name.components;

    // The intrest name is longer than the name we are checking it against.
    if (i_name.length > o_name.length)
	return false;

    // Check if at least one of given components doesn't match.
    for (var i = 0; i < i_name.length; ++i) {
        if (!DataUtils.arraysEqual(i_name[i], o_name[i]))
            return false;
    }

    return true;
};

/**
 * Alias for Name.prototype.match()
 * This function name is less confusing.
 */
Name.prototype.isPrefixOf = function (name) {
    var i_name = this.components;
    var o_name = name.components;

    // The intrest name is longer than the name we are checking it against.
    if (i_name.length > o_name.length)
	return false;

    // Check if at least one of given components doesn't match.
    for (var i = 0; i < i_name.length; ++i) {
        if (!DataUtils.arraysEqual(i_name[i], o_name[i]))
            return false;
    }

    return true;
};


/**
 * Compare two name components according to CCNx canonical ordering rule
 * If comp1 < comp2, return -1
 * If comp1 = comp2, return 0
 * If comp1 > comp2, return 1
 * components can be either string or Buffer objects
 */
Name.compareComponents = function (comp1, comp2) {
    if (typeof comp1 == 'string')
	comp1 = Name.stringComponentToBuffer(comp1);

    if (typeof comp2 == 'string')
	comp2 = Name.stringComponentToBuffer(comp2);

    if (!(comp1 instanceof Buffer) || !(comp2 instanceof Buffer))
	throw new NoNError('NameError', 'cannot compare components of unsupported type.');

    if (comp1.length < comp2.length)
        return -1;
    if (comp1.length > comp2.length)
        return 1;
    
    for (var i = 0; i < comp1.length; ++i) {
        if (comp1[i] < comp2[i])
            return -1;
        if (comp1[i] > comp2[i])
            return 1;
    }

    return 0;
};
