/**
 * This file contains utilities to help encode and decode NDN objects.
 * author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 */

function encodeToBinaryInterest(interest) {
    var enc = new BinaryXMLEncoder();
    interest.to_ccnb(enc);
    return enc.getReducedOstream();
}

function encodeToBinaryContentObject(co) {
    var enc = new BinaryXMLEncoder();
    co.to_ccnb(enc);
    return enc.getReducedOstream();
}

function encodeForwardingEntry(co) {
    var enc = new BinaryXMLEncoder();
    co.to_ccnb(enc);
    return enc.getReducedOstream();	
}
