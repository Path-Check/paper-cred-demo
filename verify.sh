#!/bin/bash 

echo Payload: $1
echo Signature: $2

echo $1 > /tmp/payload-verify.txt
echo $2 > /tmp/signature-verify.hex

xxd -r -p /tmp/signature-verify.hex /tmp/signature-verify.bin

openssl dgst -verify ecdsa_pub_key -signature /tmp/signature-verify.bin /tmp/payload-verify.txt