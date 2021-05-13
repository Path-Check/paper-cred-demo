# pip3 install ecdsa
# pip3 install dnspython
import hashlib
import base64
import dns.resolver

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
  return qr.split(':')

def download(pubKeyLink):
  key = dns.resolver.resolve(pubKeyLink, 'TXT')[0].strings[0].decode("utf-8").replace("\\n","\n")
  if ("-----BEGIN PUBLIC KEY-----" not in key):
    key = "-----BEGIN PUBLIC KEY-----" + "\n" + key + "\n" + "-----END PUBLIC KEY-----\n"
  return key

def parseAndVerifyQR(qr): 
  [schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload] = parseQR(qr)

  print ("Parsed QR\t", schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload)

  payloadBytes = payload.encode("utf-8")
  signatureDER = base64.b32decode(pad(signatureBase32NoPad))

  print("Payload Bytes\t", *payloadBytes)
  print("Signature DER\t", *signatureDER)

  vk = VerifyingKey.from_pem(download(pubKeyLink))
  verified = vk.verify(signatureDER, payloadBytes, hashfunc=sha256, sigdecode=sigdecode_der)

  print("\nVerify Payload\t", verified)

  return verified

def signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload):
  payloadBytes = payload.encode("utf-8")

  sig = sk.sign(payloadBytes, hashfunc=sha256, sigencode=sigencode_der)

  formattedSig = rmPad(base64.b32encode(sig).decode("ascii"))
  
  return ':'.join([schema, qrtype, version, formattedSig, pubKeyLink, payload])

qr = 'CRED:STATUS:2:GBCAEIAHV2J6PWDSYVLI67RN55WVHIMUTKLFF5GZ4NPHPZ7ZSIJE4MP5M4BCAU6QVDHUP4RQCPXW6XJDAM54VMZ7XURUN34WFT2RWL5ETTZDNHUF:KEYS.PATHCHECK.ORG:1/BUQHHANUB4Z5KHBZTYCWMNI4RQ6CP5WFVVQCUXYHCQVY5WLDDFPA/'

print("")
print("Loading hardcoded QR")
print("")

parseAndVerifyQR(qr)

print("")
print("Resigning same payload")
print("")

# Loading private key
with open("keys/ecdsa_private_key") as f:
  sk = SigningKey.from_pem(f.read())

[schema, qrtype, version, _, pubKeyLink, payload] = parseQR(qr)

newQR = signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload)

print("New QR Signed\t", newQR)
print("")

parseAndVerifyQR(newQR)


