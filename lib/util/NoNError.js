/**
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 * This class represents JS exception objects
 */

var NoNError = function NoNError(name, msg) {
    this.name = name;
    this.message = msg;
};

NoNError.prototype = new Error();

NoNError.prototype.toString = function () {
    var name = this.name;
    var msg = this.message;
    if (name == null) name = "NoNError";
    if (msg == null) msg = "an error is thrown.";
    return name + ': ' + msg;
};
