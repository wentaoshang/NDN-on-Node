/**
 * @author: Meki Cheraoui, Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents CCNTime Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */

var CCNTime = function CCNTime(input) {
    this.NANOS_MAX = 999877929;
	
    if (typeof input == 'number') {
	this.msec = input;
	this.binary = DataUtils.unsignedIntToBigEndian((input / 1000) * 4096);
    } else {
	throw new NONError('CCNTimeError', 'invalid input type ' + (typeof input));
    }
};


CCNTime.prototype.encodeToBinary = function() {
    return this.binary;
};


CCNTime.prototype.getJavascriptDate = function () {
    var d = new Date();
    d.setTime( this.msec );
    return d
};
