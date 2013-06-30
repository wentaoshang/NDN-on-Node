/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents PublisherPublicKeyDigest Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */


var PublisherPublicKeyDigest = function PublisherPublicKeyDigest(/* Buffer */ pkd) {
    this.PUBLISHER_ID_LEN = 256/8;    
    this.publisherPublicKeyDigest = pkd;
    if (LOG>3 && pkd != null) console.log('PublisherPublicKeyDigest set to ' + pkd.toString('hex'));
};

PublisherPublicKeyDigest.prototype.from_ccnb = function (decoder) {
    this.publisherPublicKeyDigest = decoder.readBinaryElement(this.getElementLabel());
    
    if(LOG>4) console.log('Publisher public key digest is ' + this.publisherPublicKeyDigest.toString('hex'));

    if (null == this.publisherPublicKeyDigest) {
	throw new Error("Cannot parse publisher key digest.");
    }

    if (this.publisherPublicKeyDigest.length != this.PUBLISHER_ID_LEN) {
	console.log('LENGTH OF PUBLISHER ID IS WRONG! Expected ' + this.PUBLISHER_ID_LEN + ", got " + this.publisherPublicKeyDigest.length);
    }
};

PublisherPublicKeyDigest.prototype.to_ccnb = function (encoder) {
    if (LOG>4) console.log('Encoding PublisherPublicKeyDigest...');
    //TODO Check that the ByteArray for the key is present
    if (!this.validate()) {
	throw new Error("Cannot encode : field values missing.");
    }
    if(LOG>4) console.log('PUBLISHER KEY DIGEST IS ' + this.publisherPublicKeyDigest.toString('hex'));
    encoder.writeElement(this.getElementLabel(), this.publisherPublicKeyDigest);
    if(LOG>4) console.log('Finish encoding PublisherPublicKeyDigest.');
};

PublisherPublicKeyDigest.prototype.getElementLabel = function () { return CCNProtocolDTags.PublisherPublicKeyDigest; };

PublisherPublicKeyDigest.prototype.validate = function () {
    return (null != this.publisherPublicKeyDigest);
};
