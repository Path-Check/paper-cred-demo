#!/bin/bash 

echo Payload: $1
echo $1 > /tmp/payload-sign.txt

# signs in binary
openssl dgst -sign ecdsa_private_key -out /tmp/signature-sign.bin /tmp/payload-sign.txt

# binary to hex
xxd -p /tmp/signature-sign.bin /tmp/signature-sign.hex

echo Signature Hex
cat /tmp/signature-sign.hex

# hex to binary
xxd -r -p /tmp/signature-sign.hex /tmp/signature-sign2.bin

# verifies
openssl dgst -verify ecdsa_pub_key -signature /tmp/signature-sign.bin /tmp/payload-sign.txt
openssl dgst -verify ecdsa_pub_key -signature /tmp/signature-sign2.bin /tmp/payload-sign.txt

echo 
echo
xxd -p /tmp/signature-sign.bin
echo 
echo
xxd -p /tmp/signature-sign2.bin
echo 
echo

echo Signature File ............ $(wc -c < /tmp/signature-sign.bin) bytes
echo Signature File Hex and Back $(wc -c < /tmp/signature-sign2.bin) bytes