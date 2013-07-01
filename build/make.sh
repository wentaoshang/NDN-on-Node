#!/bin/bash

if [ -e "ndn.js" ]
then
    rm ndn.js
fi

if [ -e "non.pem" ]
then
    rm non.pem
fi

if [ -e "non.pub" ]
then
    rm non.pub
fi

echo 'Building "ndn.js" lib file...'

cat ../lib/util/CCNProtocolDTags.js \
  ../lib/util/CCNTime.js \
  ../lib/util/DataUtils.js \
  ../lib/util/NoNError.js \
  ../lib/util/DynamicBuffer.js \
  ../lib/util/BinaryXMLEncoder.js \
  ../lib/util/BinaryXMLDecoder.js \
  ../lib/util/BinaryXMLStructureDecoder.js \
  ../lib/Name.js \
  ../lib/ContentObject.js \
  ../lib/Interest.js \
  ../lib/Key.js \
  ../lib/PublisherID.js \
  ../lib/PublisherPublicKeyDigest.js \
  ../lib/ForwardingEntry.js \
  ../lib/Closure.js \
  ../lib/TcpTransport.js \
  ../lib/NDN.js \
  > ndn.js

echo '...done'

# Generate default RSA key pair
#openssl genrsa -out non.pem 1024
#openssl rsa -in non.pem -pubout > non.pub
