#!/bin/bash

if [ -e "ndn.js" ]
then
    rm ndn.js
fi

cat ../../Closure.js \
  ../../TcpTransport.js \
  ../../util/CCNProtocolDTags.js \
  ../../util/CCNTime.js \
  ../../Name.js \
  ../../ContentObject.js \
  ../../Interest.js \
  ../../Key.js \
  ../../PublisherID.js \
  ../../PublisherPublicKeyDigest.js \
  ../../FaceInstance.js \
  ../../ForwardingEntry.js \
  ../../encoding/DynamicUint8Array.js \
  ../../encoding/BinaryXMLEncoder.js \
  ../../encoding/BinaryXMLDecoder.js \
  ../../encoding/BinaryXMLStructureDecoder.js \
  ../../encoding/EncodingUtils.js \
  ../../security/KeyManager.js \
  ../../NDN.js \
  > ndn.js
