/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = {
    Interest      : 1,
    Data          : 2,
    Name          : 3,
    NameComponent : 4,
    Selectors     : 5,
    Nonce         : 6,
    Scope         : 7,
    InterestLifetime          : 8,
    MinSuffixComponents       : 9,
    MaxSuffixComponents       : 10,
    PublisherPublicKeyLocator : 11,
    Exclude       : 12,
    ChildSelector : 13,
    MustBeFresh   : 14,
    Any           : 15,
    MetaInfo      : 16,
    Content       : 17,
    SignatureInfo : 18,
    SignatureValue            : 19,
    ContentType   : 20,
    FreshnessPeriod           : 21,
    SignatureType : 22,
    KeyLocator    : 23,
    KeyLocatorDigest          : 24

    // More coming later...
};

exports.NdnType = NdnType;
