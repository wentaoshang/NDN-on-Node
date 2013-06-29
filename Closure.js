/**
 * @author: Jeff Thompson
 * See COPYING for copyright and distribution information.
 * Provide the callback closure for the async communication methods in the NDN class.
 */

/*
 * Create a subclass of Closure and pass an object to async calls.
 */
var Closure = function Closure() {};

exports.Closure = Closure;

// Upcall result
Closure.RESULT_ERR               = -1; // upcall detected an error
Closure.RESULT_OK                =  0; // normal upcall return
Closure.RESULT_REEXPRESS         =  1; // reexpress the same interest again
Closure.RESULT_INTEREST_CONSUMED =  2; // upcall claims to consume interest
Closure.RESULT_VERIFY            =  3; // force an unverified result to be verified
Closure.RESULT_FETCHKEY          =  4; // get the key in the key locator and re-call the interest
                                       //   with the key available in the local storage

// Upcall kind
Closure.UPCALL_FINAL              = 0; // handler is about to be deregistered
Closure.UPCALL_INTEREST           = 1; // incoming interest
Closure.UPCALL_CONSUMED_INTEREST  = 2; // incoming interest, someone has answered
Closure.UPCALL_CONTENT            = 3; // incoming verified content
Closure.UPCALL_INTEREST_TIMED_OUT = 4; // interest timed out
Closure.UPCALL_CONTENT_UNVERIFIED = 5; // content that has not been verified
Closure.UPCALL_CONTENT_BAD        = 6; // verification failed

/*
 * Override this in your subclass.
 * If you're getting strange errors in upcall()
 * check your code whether you're returning a value.
 */
Closure.prototype.upcall = function(kind, upcallInfo) {
    return Closure.RESULT_OK;
};

var UpcallInfo = function UpcallInfo(ndn, interest, matchedComps, contentObject) {
    this.ndn = ndn;  // NDN object (not used)
    this.interest = interest;  // Interest object
    this.matchedComps = matchedComps;  // int
    this.contentObject = contentObject;  // Content object
};

exports.UpcallInfo = UpcallInfo;

UpcallInfo.prototype.toString = function() {
    var ret = "ndn = " + this.ndn;
    ret += "\nInterest = " + this.interest;
    ret += "\nmatchedComps = " + this.matchedComps;
    ret += "\nContentObject: " + this.contentObject;
    return ret;
}
