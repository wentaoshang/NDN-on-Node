#!/bin/bash

if [ -e "ndn.js" ]
then
    rm ndn.js
fi

cat ../TcpTransport.js \
  ../util/CCNProtocolDTags.js \
  ../util/CCNTime.js \
  ../util/DataUtils.js \
  ../Name.js \
  ../ContentObject.js \
  ../Interest.js \
  ../Key.js \
  ../PublisherID.js \
  ../PublisherPublicKeyDigest.js \
  ../ForwardingEntry.js \
  ../encoding/DynamicBuffer.js \
  ../encoding/BinaryXMLEncoder.js \
  ../encoding/BinaryXMLDecoder.js \
  ../encoding/BinaryXMLStructureDecoder.js \
  ../Closure.js \
  ../NDN.js \
  > ndn.js
