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

echo 'Building ndn.js lib file...'

cat ../util/CCNProtocolDTags.js \
  ../util/CCNTime.js \
  ../util/DataUtils.js \
  ../util/NoNError.js \
  ../util/DynamicBuffer.js \
  ../util/BinaryXMLEncoder.js \
  ../util/BinaryXMLDecoder.js \
  ../util/BinaryXMLStructureDecoder.js \
  ../Name.js \
  ../ContentObject.js \
  ../Interest.js \
  ../Key.js \
  ../PublisherID.js \
  ../PublisherPublicKeyDigest.js \
  ../ForwardingEntry.js \
  ../Closure.js \
  ../TcpTransport.js \
  ../NDN.js \
  > ndn.js

echo '...done'

# Generate default RSA key pair
#openssl genrsa -out non.pem 1024
#openssl rsa -in non.pem -pubout > non.pub
