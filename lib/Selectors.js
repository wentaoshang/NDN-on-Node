/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./util/NdnType.js').NdnType;
var Block = require('./util/Block.js').Block;
var DataUtils = require('./util/DataUtils.js').DataUtils;

var Selectors = function Selectors ()
{
    this.minSuffix = null;  // nonNegativeInteger
    this.maxSuffix = null;  // nonNegativeInteger
    this.publisherKey = null;  // Name
    this.exclude = null;  // Exclude
    this.childSelector = null;  // nonNegativeInteger
    this.fresh = null;  // zero length
};

exports.Selectors = Selectors;

