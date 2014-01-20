/** 
 * @author: Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./NdnType.js').NdnType;
var Block = require('./Block.js').Block;
var NameComponent = require('./NameComponent.js').NameComponent;

var LOG = 0;
 
/**
 * Create a new Name from _components.
 * If _components is a string, parse it as a URI.  Otherwise it is an array of components
 * where each is a string, byte array, ArrayBuffer or Uint8Array. 
 * Convert and store as an array of NameComponent.
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
    if (component == null)
	return this;

    var result;
    if(typeof component == 'string')
        result = NameComponent.from_string (component);
    else if (component instanceof Buffer)
        result = new NameComponent(component);
    else if (component instanceof Name) {
        var components;
        if (component == this)
            // special case, when we need to create a copy
            components = this.components.slice (0, this.components.length);
        else
            components = component.components;
        
        for (var i = 0; i < components.length; ++i)
            this.components.push (components[i].clone ());

        return this;
    } else 
	throw new Error("Cannot add Name element at index " + this.components.length + ": Invalid type");
    
    this.components.push (result);
    return this;
};

// Alias for Name.add()
Name.prototype.append = function (component) {
    return this.add (component);
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


/**
 * Parse name as a URI string and return an array of NameComponents.
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
        
        // Change the component to NameComponent now.
        array[i] = NameComponent.from_string (array[i]);
    }

    return array;
};


Name.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Name.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.Name)
	throw new Error ('Name.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Name

    this.components = [];

    var t, l, comp;

    while (block.head < end) {
	t = block.read_var_num ();  // read type
	if (t != NdnType.NameComponent)
	    throw new Error ('Name.from_tlv: wrong type for NameComponent');

	l = block.read_var_num ();  // read length

	comp = block.read_array (l);

	this.add (comp);
    }
		
    if (block.head != end)
	throw new Error ('Name.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('Name.from_tlv: finish');
};

Name.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Name.to_tlv: begin');

    if (this.components == null)
	throw new Error ('Name.to_tlv: cannot encode empty name.');

    // Encode backward
    var val_len = 0;
    for (var i = this.components.length - 1; i >= 0; i--) {
	val_len += this.components[i].to_tlv (block);
    }

    var total_len = val_len;
    total_len += block.push_var_num (val_len);  // encode length
    total_len += block.push_var_num (NdnType.Name);  // encode name

    if (LOG > 4)
	console.log ('Name.to_tlv: finish');

    return total_len;
};

Name.prototype.encodeToBinary = function () {
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};

/**
 * Static method to parse a Buffer containing ccnb-formated Name bytes.
 * Return a parsed Name object.
 */
Name.parse = function (buf) {
    var block = new Block (buf);
    var name = new Name ();
    name.from_tlv (block);
    return name;
};

Name.prototype.getElementLabel = function(){
    return NdnType.Name;
};


// Return the escaped name string according to "CCNx URI Scheme".
Name.prototype.to_uri = function () {
    if (this.components.length == 0)
        return "/";
    
    var result = "";
	
    for(var i = 0; i < this.components.length; ++i)
	result += "/"+ this.components[i].toEscapedString ();
    
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
Name.prototype.equals = function(name) {
    if (this.components.length != name.components.length)
        return false;
    
    // Start from the last component because they are more likely to differ.
    for (var i = this.components.length - 1; i >= 0; --i) {
        if (NameComponent.compare (this.components[i], name.components[i]) != 0)
            return false;
    }
    
    return true;
};


/**
 * Returns true if 'this' is a prefix of 'name'
 */
Name.prototype.matches = function (name) {
    var i_name = this.components;
    var o_name = name.components;

    // The intrest name is longer than the name we are checking it against.
    if (i_name.length > o_name.length)
	return false;

    // Check if at least one of given components doesn't match.
    for (var i = 0; i < i_name.length; ++i) {
        if (NameComponent.compare (i_name[i], o_name[i]) != 0)
            return false;
    }

    return true;
};

/**
 * Alias for Name.prototype.matches()
 * This function name is less confusing.
 */
Name.prototype.isPrefixOf = function (name) {
    return this.matches(name);
};
