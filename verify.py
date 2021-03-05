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

def parseAndVerifyQR(vk, qr): 
  [schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload] = parseQR(qr)

  print ("Parsed QR\t", schema, qrtype, version, signatureBase32NoPad, pubKeyLink, payload)

  payloadBytes = payload.encode("utf-8")
  signatureDER = base64.b32decode(pad(signatureBase32NoPad))

  print("Payload Bytes\t", *payloadBytes)
  print("Signature DER\t", *signatureDER)

  verified = vk.verify(signatureDER, payloadBytes, hashfunc=sha256, sigdecode=sigdecode_der)

  print("")
  print("Verify Payload\t", verified)

  return verified

def signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload):
  payloadBytes = payload.encode("utf-8")

  sig = sk.sign(payloadBytes, hashfunc=sha256, sigencode=sigencode_der)

  formattedSig = rmPad(base64.b32encode(sig).decode("ascii"))
  
  return ':'.join([schema, qrtype, version, formattedSig, pubKeyLink, payload])

# Loading private key
with open("ecdsa_private_key") as f:
  sk = SigningKey.from_pem(f.read())

# Loading default QR
qr = 'CRED:STATUS:1:GBCQEIIARIIJXBTYU57EHXKOTZUNAODR62UFSZXMNVZLAAW23NRY5KRG7RBQEICH2OTWJUG755VRHBMJILUQDSKPFXVFJKTGRQ25OI5DGDYZHSVS5U:PCF.VITORPAMPLONA.COM:1/JD82/C5HLIDIEWJT3WWHROEDIE6INAFHXKNAP5PNLGOBPAUTUE46YOJJQ'
[schema, qrtype, version, a, pubKeyLink, payload] = parseQR(qr)

pubkey_pem = dns.resolver.resolve(pubKeyLink, 'TXT')[0].strings[0].decode("utf-8").replace("\\n","\n")
vk = VerifyingKey.from_pem(pubkey_pem)

print("")
print("Loading hardcoded QR")
print("")

parseAndVerifyQR(vk, qr)

print("")
print("Resigning same payload")
print("")

newQR = signAndFormatQR(sk, schema, qrtype, version, pubKeyLink, payload)

print("New QR Signed\t", newQR)
print("")

parseAndVerifyQR(vk, newQR)




