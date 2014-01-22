var ndn = require('../');
var util = require ('util');

var on_data = function (inst, data)
{
    console.log ("Data received in callback.");
    console.log ('Name: ' + data.name.to_uri ());
    //console.log ('Data: ');
    //console.log (util.inspect (data, false, null));
    console.log ('Content: ' + data.content.toString ())
    face.close ();  // This will cause the script to exit
};

var on_timeout = function (interest)
{
    console.log ("Interest time out.");
    console.log ('Interest name: ' + interest.name.to_uri ());
    face.close ();
};

var face = new ndn.Face ({
    onopen : function () {
	var n = new ndn.Name ('/local/ndn/js/test');
	var inst = new ndn.Interest (n);
	inst.interestLifetime = 4000;
	face.expressInterest (inst, on_data, on_timeout);
	console.log ('Interest sent.');
    }
});

console.log ('Script begin.');
