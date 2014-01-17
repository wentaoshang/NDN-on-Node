/** 
 * @author: Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./util/NdnType.js').NdnType;
var Block = require('./util/Block.js').Block;
var DataUtils = require('./util/DataUtils.js').DataUtils;
var NameComponent = require('./NameComponent.js').NameComponent;

var LOG = 0;

/*
 * Handle the Exclude element.
 * _values is an array where each element is either Uint8Array component or Exclude.ANY.
 */
var Exclude = function Exclude (_values)
{ 
    this.values = (_values || []);
    
    // Check the type of the input
    for (var i = 0; i < this.values.length; i++) {
	var component = this.values[i];
	
	// Exclude.ANY is special
	if (component == Exclude.Any)
	    continue;
	else if (typeof component == 'string')
	    // Convert string to Buffer
	    this.values[i] = NameComponent.from_string (component);
	else if (!(component instanceof Buffer))
	    // Otherwise it should be a Buffer
	    throw new Error ('Exclude: unknown type of input component.');
	else
	    // Create NameComponent from Buffer
	    this.values[i] = new NameComponent (component);
    }
};

exports.Exclude = Exclude;

Exclude.Any = "*";

Exclude.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Exclude.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.Exclude)
	throw new Error ('Exclude.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Name

    while (block.head < end) {
	var t = block.read_var_num ();  // read type
	var l = block.read_var_num ();  // read length
        if (t == NdnType.NameComponent)
            this.values.push (new NameComponent (block.read_array (l)));
        else if (t == NdnType.Any) {
	    if (l != 0)
		throw new Error ('Exclude.from_tlv: wrong length for Exclude.ANY');

            this.values.push (Exclude.Any);
        }
        else
            throw new Error ('Exclude.from_tlv: unknown type for Exclude value');
    }
    
    if (block.head != end)
	throw new Error ('Exclude.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('Exclude.from_tlv: finish');
};

Exclude.parse = function (buf)
{
    var block = new Block (buf);
    var exc = new Exclude ();
    exc.from_tlv (block);
    return exc;
};

Exclude.prototype.to_tlv = function (block)
{
    if (this.values == null || this.values.length == 0)
	return;

    // Encode backward    
    // TODO: Do we want to order the components (except for ANY)?
    var val_len = 0;
    for (var i = this.values.length - 1; i >= 0; i--) {
        if (this.values[i] == Exclude.Any) {
	    val_len += block.push_var_num (0);  // encode length
	    val_len += block.push_var_num (NdnType.Any);  // encode type
        }
        else
            val_len += this.values[i].to_tlv (block);
    }

    var total_len = val_len;
    total_len += block.push_var_num (val_len);
    total_len += block.push_var_num (NdnType.Exclude);

    if (LOG > 4)
	console.log ('Exclude.to_tlv: finish');

    return total_len;
};

Exclude.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};

/*
 * Return a string with elements separated by "," and Exclude.ANY shown as "*". 
 */
Exclude.prototype.to_uri = function () {
    if (this.values == null || this.values.length == 0)
	return "";

    var result = "";
    for (var i = 0; i < this.values.length; ++i) {
        if (i > 0)
            result += ",";
        
        if (this.values[i] == Exclude.Any)
            result += "*";
        else
            result += this.values[i].toEscapedString ();
    }
    return result;
};

/*
 * Return true if the component matches any of the exclude criteria.
 */
Exclude.prototype.matches = function (/*NameComponent*/ component) {
    for (var i = 0; i < this.values.length; ++i) {
        if (this.values[i] == Exclude.Any) {
            var lowerBound = null;
            if (i > 0)
                lowerBound = this.values[i - 1];
            
            // Find the upper bound, possibly skipping over multiple ANY in a row.
            var iUpperBound;
            var upperBound = null;
            for (iUpperBound = i + 1; iUpperBound < this.values.length; ++iUpperBound) {
                if (this.values[iUpperBound] != Exclude.Any) {
                    upperBound = this.values[iUpperBound];
                    break;
                }
            }
            
            // If lowerBound != null, we already checked component equals lowerBound on the last pass.
            // If upperBound != null, we will check component equals upperBound on the next pass.
            if (upperBound != null) {
                if (lowerBound != null) {
                    if (NameComponent.compare(component, lowerBound) > 0 &&
                        NameComponent.compare(component, upperBound) < 0)
                        return true;
                }
                else {
                    if (NameComponent.compare(component, upperBound) < 0)
                        return true;
                }
                
                // Make i equal iUpperBound on the next pass.
                i = iUpperBound - 1;
            }
            else {
                if (lowerBound != null) {
                    if (NameComponent.compare(component, lowerBound) > 0)
                        return true;
                }
                else
                    // this.values has only ANY.
                    return true;
            }
        }
        else {
            if (DataUtils.arraysEqual(component.buffer, this.values[i].buffer))
                return true;
        }
    }
    
    return false;
};

