/** 
 * @author: Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var Block = require('./util/Block.js').Block;
var DataUtils = require('./util/DataUtils.js').DataUtils;

var LOG = 0;

var Interest = function Interest ()
{		
    this.name = null;
    this.selectors = null;
    this.nonce = null;
    this.scope = null;
    this.interestLifetime = null; // in ms
};

exports.Interest = Interest;

Interest.CHILD_SELECTOR_LEFT = 0;
Interest.CHILD_SELECTOR_RIGHT = 1;

Interest.ANSWER_NO_CONTENT_STORE = 0;
Interest.ANSWER_CONTENT_STORE = 1;
Interest.ANSWER_GENERATED = 2;
Interest.ANSWER_STALE = 4;		// Stale answer OK
Interest.MARK_STALE = 16;		// Must have scope 0.  Michael calls this a "hack"

Interest.DEFAULT_ANSWER_ORIGIN_KIND = Interest.ANSWER_CONTENT_STORE | Interest.ANSWER_GENERATED;


Interest.prototype.from_ccnb = function (/*XMLDecoder*/ decoder) {
    if (LOG>4) console.log('--------Start decoding Interest...');
    decoder.readStartElement(CCNProtocolDTags.Interest);

    this.name = new Name();
    this.name.from_ccnb(decoder);

    if (decoder.peekStartElement(CCNProtocolDTags.MinSuffixComponents))
	this.minSuffixComponents = decoder.readIntegerElement(CCNProtocolDTags.MinSuffixComponents);

    if (decoder.peekStartElement(CCNProtocolDTags.MaxSuffixComponents)) 
	this.maxSuffixComponents = decoder.readIntegerElement(CCNProtocolDTags.MaxSuffixComponents);
			
    if (decoder.peekStartElement(CCNProtocolDTags.PublisherPublicKeyDigest)) {
	this.publisherPublicKeyDigest = new PublisherPublicKeyDigest();
	this.publisherPublicKeyDigest.from_ccnb(decoder);
    }

    if (decoder.peekStartElement(CCNProtocolDTags.Exclude)) {
	this.exclude = new Exclude();
	this.exclude.from_ccnb(decoder);
    }
		
    if (decoder.peekStartElement(CCNProtocolDTags.ChildSelector))
	this.childSelector = decoder.readIntegerElement(CCNProtocolDTags.ChildSelector);
		
    if (decoder.peekStartElement(CCNProtocolDTags.AnswerOriginKind))
	this.answerOriginKind = decoder.readIntegerElement(CCNProtocolDTags.AnswerOriginKind);
		
    if (decoder.peekStartElement(CCNProtocolDTags.Scope))
	this.scope = decoder.readIntegerElement(CCNProtocolDTags.Scope);

    if (decoder.peekStartElement(CCNProtocolDTags.InterestLifetime))
	this.interestLifetime = 1000.0 * DataUtils.bigEndianToUnsignedInt
	    (decoder.readBinaryElement(CCNProtocolDTags.InterestLifetime)) / 4096;
		
    if (decoder.peekStartElement(CCNProtocolDTags.Nonce))
	this.nonce = decoder.readBinaryElement(CCNProtocolDTags.Nonce);
		
    decoder.readEndElement();

    if (LOG>4) console.log('--------Finish decoding Interest.');
};

Interest.prototype.to_ccnb = function (/*XMLEncoder*/ encoder) {
    if (LOG>4) console.log('--------Encoding Interest....');
    
    encoder.writeStartElement(CCNProtocolDTags.Interest);
    
    if (null != this.name)
	this.name.to_ccnb(encoder);
    
    if (null != this.minSuffixComponents) 
	encoder.writeElement(CCNProtocolDTags.MinSuffixComponents, this.minSuffixComponents);	
    
    if (null != this.maxSuffixComponents) 
	encoder.writeElement(CCNProtocolDTags.MaxSuffixComponents, this.maxSuffixComponents);
    
    if (null != this.publisherPublicKeyDigest)
	this.publisherPublicKeyDigest.to_ccnb(encoder);
    
    if (null != this.exclude)
	this.exclude.to_ccnb(encoder);
    
    if (null != this.childSelector) 
	encoder.writeElement(CCNProtocolDTags.ChildSelector, this.childSelector);
    
    if (this.DEFAULT_ANSWER_ORIGIN_KIND != this.answerOriginKind && this.answerOriginKind!=null) 
	encoder.writeElement(CCNProtocolDTags.AnswerOriginKind, this.answerOriginKind);
    
    if (null != this.scope) 
	encoder.writeElement(CCNProtocolDTags.Scope, this.scope);
    
    if (null != this.interestLifetime) 
	encoder.writeElement(CCNProtocolDTags.InterestLifetime, 
			     DataUtils.unsignedIntToBigEndian((this.interestLifetime / 1000.0) * 4096));
    
    if (null != this.nonce)
	encoder.writeElement(CCNProtocolDTags.Nonce, this.nonce);
    
    encoder.writeEndElement();
    
    if (LOG>4) console.log('--------Finish encoding Interest.');
};

/*
 * Return encoded Buffer containing the ccnd-formated interest packet
 */
Interest.prototype.encodeToBinary = function () {
    var enc = new BinaryXMLEncoder();
    this.to_ccnb(enc);
    return enc.getReducedOstream();
};


/*
 * Return true if this.name.match(name) and the name conforms to the interest selectors.
 */
Interest.prototype.matches_name = function (/*Name*/ name) {
    if (!this.name.isPrefixOf(name))
        return false;
    
    if (this.minSuffixComponents != null &&
        // Add 1 for the implicit digest.
        !(name.components.length + 1 - this.name.components.length >= this.minSuffixComponents))
        return false;
    if (this.maxSuffixComponents != null &&
        // Add 1 for the implicit digest.
        !(name.components.length + 1 - this.name.components.length <= this.maxSuffixComponents))
        return false;
    if (this.exclude != null && name.components.length > this.name.components.length &&
        this.exclude.matches(name.components[this.name.components.length]))
        return false;
    
    return true;
};

/*
 * Return a new Interest with the same fields as this Interest.  
 * Note: This does NOT make a deep clone of the name, exclue or other objects.
 */
Interest.prototype.clone = function () {
    return new Interest(
	this.name, this.faceInstance, this.minSuffixComponents, this.maxSuffixComponents, 
	this.publisherPublicKeyDigest, this.exclude, this.childSelector, this.answerOriginKind, 
	this.scope, this.interestLifetime, this.nonce);
};
