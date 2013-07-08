/**
 * @author: Meki Cheraoui, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents PublisherID object
 */

/**
 * Ported to node.js by Wentao Shang
 */
var CCNProtocolDTags = require('./util/CCNProtocolDTags.js').CCNProtocolDTags;
var CCNProtocolDTagsStrings = require('./util/CCNProtocolDTags.js').CCNProtocolDTagsStrings;
var NoNError = require('./util/NoNError.js').NoNError;

var isPublisherIDTag = function (tagVal) {
    if ((tagVal == CCNProtocolDTags.PublisherPublicKeyDigest) ||
	(tagVal == CCNProtocolDTags.PublisherCertificateDigest) ||
	(tagVal == CCNProtocolDTags.PublisherIssuerKeyDigest) ||
	(tagVal == CCNProtocolDTags.PublisherIssuerCertificateDigest)) {
	return true;
    }
    return false;
};

/**
 * id is the SHA-256 hash of the publisher public key Buffer
 * type can be either of CCNProtocolDtags.PublisherPublicKeyDigest | PublisherCertificateDigest | PublisherIssuerKeyDigest | PublisherIssuerCertificateDigest
 * while the latter three are usually not used
 */
var PublisherID = function PublisherID(id, type) {
    this.id = id;  // Buffer
    this.type = type;
};

exports.PublisherID = PublisherID;

PublisherID.prototype.from_ccnb = function (decoder) {
    // We have a choice here of one of 4 binary element types.
    var nextTag = decoder.peekStartElementAsLong();
		
    if (null == nextTag) {
	throw new NoNError('PublisherIDError', "cannot parse publisher ID.");
    } 
		
    if (!isPublisherIDTag(nextTag)) {
	throw new NoNError('PublisherIDError', "invalid PublisherID tag " + nextTag);
    }
    this.id = decoder.readBinaryElement(nextTag);
    if (null == this.publisherID) {
	throw new NoNError('PublisherIDError', "cannot read PublisherID of type " + nextTag + ".");
    }

    this.type = nextTag;
};

PublisherID.prototype.to_ccnb = function (encoder) {
    if (!this.validate()) {
	throw new NoNError('PublisherIDError', "cannot encode PublisherID because field value is  missing.");
    }
    
    encoder.writeElement(this.getElementLabel(), this.id);
};


PublisherID.prototype.to_xml = function (encoding) {
    if (encoding == null)
	encoding = 'hex';

    var xml = '<' + CCNProtocolDTagsStrings[this.type] + ' ccnbencoding="' + encoding + 'Binary">' 
    + this.id.toString(encoding).toUpperCase() + '</' + CCNProtocolDTagsStrings[this.type] + '>';
    return xml;
};

// Check if the next component is a PublisherID
PublisherID.peek = function (decoder) {
    var nextTag = decoder.peekStartElementAsLong();
		
    if (null == nextTag) {
	return false;
    }
    return (isPublisherIDTag(nextTag));
};

PublisherID.prototype.getElementLabel = function () { 
    return this.type;
};

PublisherID.prototype.validate = function () {
    return ((null != this.id && (null != this.type)));
};
