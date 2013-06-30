/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents Forwarding Entries
 */

/**
 * Ported to node.js by Wentao Shang
 */

var ForwardingEntry = function ForwardingEntry(_action, _prefixName, _ccndId, _faceID, _flags, _lifetime) {
    //String
    this.action = _action;
    //Name
    this.prefixName = _prefixName;
    //PublisherPublicKeyDigest 
    this.ccndID = _ccndId;
    //Integer
    this.faceID = _faceID;
    //Integer
    this.flags = _flags;
    //Integer
    this.lifetime = _lifetime;  // in seconds
};

ForwardingEntry.prototype.from_ccnb = function (/*XMLDecoder*/ decoder) {
    if (LOG > 4) console.log('Start decoding ForwardingEntry...');
    decoder.readStartElement(this.getElementLabel());
    if (decoder.peekStartElement(CCNProtocolDTags.Action)) {
	this.action = decoder.readUTF8Element(CCNProtocolDTags.Action); 
    }
    if (decoder.peekStartElement(CCNProtocolDTags.Name)) {
	this.prefixName = new Name();
	this.prefixName.from_ccnb(decoder) ;
    }
    if (decoder.peekStartElement(CCNProtocolDTags.PublisherPublicKeyDigest)) {
	this.CcndId = new PublisherPublicKeyDigest();
	this.CcndId.from_ccnb(decoder);
    }
    if (decoder.peekStartElement(CCNProtocolDTags.FaceID)) {
	this.faceID = decoder.readIntegerElement(CCNProtocolDTags.FaceID); 
    }
    if (decoder.peekStartElement(CCNProtocolDTags.ForwardingFlags)) {
	this.flags = decoder.readIntegerElement(CCNProtocolDTags.ForwardingFlags); 
    }
    if (decoder.peekStartElement(CCNProtocolDTags.FreshnessSeconds)) {
	this.lifetime = decoder.readIntegerElement(CCNProtocolDTags.FreshnessSeconds); 
    }
    decoder.readEndElement();
    if (LOG > 4) console.log('Finish decoding ForwardingEntry.');
};

/**
 * Used by NetworkObject to encode the object to a network stream.
 */
ForwardingEntry.prototype.to_ccnb =function(/*XMLEncoder*/ encoder) {
    if (LOG > 4) console.log('--------Encoding ForwardingEntry...');
    encoder.writeStartElement(this.getElementLabel());
    if (null != this.action && this.action.length != 0)
	encoder.writeElement(CCNProtocolDTags.Action, this.action);	
    if (null != this.prefixName) {
	this.prefixName.to_ccnb(encoder);
    }
    if (null != this.CcndId) {
	this.CcndId.to_ccnb(encoder);
    }
    if (null != this.faceID) {
	encoder.writeElement(CCNProtocolDTags.FaceID, this.faceID);
    }
    if (null != this.flags) {
	encoder.writeElement(CCNProtocolDTags.ForwardingFlags, this.flags);
    }
    if (null != this.lifetime) {
	encoder.writeElement(CCNProtocolDTags.FreshnessSeconds, this.lifetime);
    }
    encoder.writeEndElement();
    if (LOG > 4) console.log('--------Finish encoding ForwardingEntry.');
};

ForwardingEntry.prototype.encodeToBinary = function () {
    var enc = new BinaryXMLEncoder();
    this.to_ccnb(enc);
    return enc.getReducedOstream();
};

ForwardingEntry.prototype.getElementLabel = function() { return CCNProtocolDTags.ForwardingEntry; };
