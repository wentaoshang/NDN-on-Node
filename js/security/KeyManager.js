/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 */

var KeyManager = function KeyManager(){

//Certificate

this.certificate = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDhfTCn2CirG4QLF1QtyvYgev0iHghrKmDRbLf1REi6nz8IvNCZ2yHdFip3nmGqie7lVNOkfeIwvHrFkNUkBnw4mLum9dxDYLhF7aSMvZzxJqcjRF8OGVLXMlp1+vVWFE+amK9xhrAnhoW44sCL6ocXG03uWFwYKClbU5XrShd3nwIDAQAB'

//Public Key (decoded)

this.publicKey = '30819F300D06092A864886F70D010101050003818D0030818902818100E17D30A7D828AB1B840B17542DCAF6207AFD221E086B2A60D16CB7F54448BA9F3F08BCD099DB21DD162A779E61AA89EEE554D3A47DE230BC7AC590D524067C3898BBA6F5DC4360B845EDA48CBD9CF126A723445F0E1952D7325A75FAF556144F9A98AF7186B0278685B8E2C08BEA87171B4DEE585C1828295B5395EB4A17779F0203010001';

//Private Key

this.privateKey = 'MIICXQIBAAKBgQDhfTCn2CirG4QLF1QtyvYgev0iHghrKmDRbLf1REi6nz8IvNCZ2yHdFip3nmGqie7lVNOkfeIwvHrFkNUkBnw4mLum9dxDYLhF7aSMvZzxJqcjRF8OGVLXMlp1+vVWFE+amK9xhrAnhoW44sCL6ocXG03uWFwYKClbU5XrShd3nwIDAQABAoGAGkv6T6jC3WmhFZYL6CdCWvlc6gysmKrhjarrLTxgavtFY6R5g2ft5BXAsCCVbUkWxkIFSKqxpVNl0gKZCNGEzPDN6mHJOQI/h0rlxNIHAuGfoAbCzALnqmyZivhJAPGijAyKuU9tczsst5+Kpn+bn7ehzHQuj7iwJonS5WbojqECQQD851K8TpW2GrRizNgG4dx6orZxAaon/Jnl8lS7soXhllQty7qG+oDfzznmdMsiznCqEABzHUUKOVGE9RWPN3aRAkEA5D/w9N55d0ibnChFJlc8cUAoaqH+w+U3oQP2Lb6AZHJpLptN4y4b/uf5d4wYU5/i/gC7SSBH3wFhh9bjRLUDLwJAVOx8vN0Kqt7myfKNbCo19jxjVSlA8TKCn1Oznl/BU1I+rC4oUaEW25DjmX6IpAR8kq7S59ThVSCQPjxqY/A08QJBAIRaF2zGPITQk3r/VumemCvLWiRK/yG0noc9dtibqHOWbCtcXtOm/xDWjq+lis2i3ssOvYrvrv0/HcDY+Dv1An0CQQCLJtMsfSg4kvG/FRY5UMhtMuwo8ovYcMXt4Xv/LWaMhndD67b2UGawQCRqr5ghRTABWdDD/HuuMBjrkPsX0861';

};


KeyManager.prototype.verify = function verify(message,signature){
	
	var input = message;

	var  _PEM_X509CERT_STRING_ = this.certificate;
	
	var x509 = new X509();
	
	x509.readCertPEM(_PEM_X509CERT_STRING_);
	
	var result = x509.subjectPublicKeyRSA.verifyString(input, signature);
	
	return result;
};

KeyManager.prototype.sign= function sign(message){
	
	var input = message;
		
	var  _PEM_PRIVATE_KEY_STRING_ = this.privateKey;
	
	var rsa = new RSAKey();
	
	rsa.readPrivateKeyFromPEMString(_PEM_PRIVATE_KEY_STRING_);
	
	var hSig = rsa.signString(input, "sha256");
	
	return hSig;

};


var globalKeyManager = new KeyManager();


