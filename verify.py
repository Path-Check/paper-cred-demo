# pip3 install ecdsa
import hashlib
import base64

from hashlib import sha256

from ecdsa import SigningKey, VerifyingKey
from ecdsa.util import sigencode_der, sigdecode_der

def pad(base32NoPad): 
  base32 = base32NoPad
  if (len(base32NoPad) % 8 == 2): return  base32NoPad + "======"
  if (len(base32NoPad) % 8 == 4): return  base32NoPad + "===="
  if (len(base32NoPad) % 8 == 5): return  base32NoPad + "==="
  if (len(base32NoPad) % 8 == 7): return  base32NoPad + "="
  return base32  

def rmPad(base32text):
  return base32text.replace('=','')

def parseQR(qr): 
  [schema, qrtype, version, data] = qr.split(':')
  [signature_pubkey, payload] = data.split('?')
  index = signature_pubkey.index('.')

  signatureBase32NoPad = signature_pubkey[0:index]
  pubKeyLink = signature_pubkey[index + 1:]
  return [schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload]

def printBytes(label, bytes): 
  print(label, "\t", end=' ')
  for byte in bytes:
    print(byte, end=' ')
  print('')

def parseAndVerifyQR(vk, qr): 
  [schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload] = parseQR(qr)

  print ("Parsed QR\t", schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload)

  payloadBytes = payload.encode("utf-8")
  signatureDER = base64.b32decode(pad(signatureBase32NoPad))

  printBytes("Payload Bytes", payloadBytes)
  printBytes("Signature DER", signatureDER)

  verified = vk.verify(signatureDER, payloadBytes, hashfunc=sha256, sigdecode=sigdecode_der)

  print("Verify Payload\t", verified)

  return verified

def signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload):
  payloadBytes = payload.encode("utf-8")

  sig = sk.sign(payloadBytes, hashfunc=sha256, sigencode=sigencode_der)
  
  formattedSig = rmPad(base64.b32encode(sig).decode("ascii"))
  
  return ':'.join([schema, qrtype, version, formattedSig+'.'+pubKeyLink + "?" + payload]); 


# Loading public key
with open("ecdsa_pub_key") as f:
  vk = VerifyingKey.from_pem(f.read())

# Loading private key
with open("ecdsa_private_key") as f:
  sk = SigningKey.from_pem(f.read())

# Loading default QR
qr = 'CRED:PASSKEY:1:GBCAEIAK5CBMBME62GXVW6L5PLQOCVGHVGGNSY5BHDUH6E3XM4EKH7BF4UBCASD57KBVRJMQIOB6FSDGNMIUPGUP6QV3O6HIGTBINVYJAD2ENH62.PCF.VITORPAMPLONA.COM?JANE%20DOE/19010101/9IQHMB8N6R/16173332345'
[schema, qrtype, version, a, pubKeyLink, payload] = parseQR(qr)

print("")
print("Loading hardcoded QR")
print("")

parseAndVerifyQR(vk, qr)

print("")
print("Resigning same payload")
print("")

newQR = signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload)

parseAndVerifyQR(vk, newQR)

print("")
print("New QR Signed\t", newQR)
print("")



