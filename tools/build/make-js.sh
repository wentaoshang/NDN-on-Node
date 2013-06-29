#!/bin/bash

if [ -e "ndn.js" ]
then
    rm ndn.js
fi

cat ../../Closure.js \
  ../../TcpTransport.js \
  ../../util/CCNProtocolDTags.js \
  ../../util/CCNTime.js \
  ../../util/DataUtils.js \
  ../../Name.js \
  ../../ContentObject.js \
  ../../Interest.js \
  ../../Key.js \
  ../../PublisherID.js \
  ../../PublisherPublicKeyDigest.js \
  ../../ForwardingEntry.js \
  ../../encoding/DynamicUint8Array.js \
  ../../encoding/BinaryXMLEncoder.js \
  ../../encoding/BinaryXMLDecoder.js \
  ../../encoding/BinaryXMLStructureDecoder.js \
  ../../NDN.js \
  > ndn.js
