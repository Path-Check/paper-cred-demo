#!/bin/zsh

parseAndVerifyQR () {
  local schema=$(echo $1 | cut -f1 -d:)
  local qrtype=$(echo $1 | cut -f2 -d:)
  local version=$(echo $1 | cut -f3 -d:)
  local signatureBase32NoPad=$(echo $1 | cut -f4 -d:)
  local pubKeyLink=$(echo $1 | cut -f5 -d:)
  local payload=$(echo $1 | cut -f6 -d:)

  echo -e Parsed QR '\t' $schema $qrtype $version $signatureBase32NoPad $pubKeyLink $payload

  # Add Padding Elements to the Base32 signature
  local signatureSize=${#signatureBase32NoPad}
  case $(($signatureSize%8)) in 
    2) signatureBase32=$(echo -n $signatureBase32NoPad"======") ;;
    4) signatureBase32=$(echo -n $signatureBase32NoPad"====") ;;
    5) signatureBase32=$(echo -n $signatureBase32NoPad"===") ;;
    7) signatureBase32=$(echo -n $signatureBase32NoPad"=") ;;
    *) signatureBase32=$(echo -n $signatureBase32NoPad) ;;
  esac

  # No need to convert to UTF-8
  echo -e "Payload Bytes\t" $payload

  # Using files because Scripts tend to not work well with Binary content. 
  echo $signatureBase32 | base32 -d --wrap=0 > /tmp/signature-verify.bin

  # Debug Info
  local printableSignatureDER=$(od -An -v -t u1 /tmp/signature-verify.bin)
  echo -e "Signature DER\n"$printableSignatureDER

  # Downloading PUBKey from DNS record
  local pubkey=$(dig -t txt $pubKeyLink +short)
  local pubKeyNewLine=${pubkey//\\n/\n}
  local pubKeyNoQuotes=${pubKeyNewLine//\"/}
  
  if [[ ! $pubKeyNoQuotes == "-----BEGIN PUBLIC KEY-----"* ]]; then
    pubKeyNoQuotes=$(echo -n "-----BEGIN PUBLIC KEY-----\n"$pubKeyNoQuotes"\n-----END PUBLIC KEY-----\n")
  fi

  echo $pubKeyNoQuotes > /tmp/pubkey.pem

  # Verifying
  local verified=$(echo -n $payload | openssl dgst -verify /tmp/pubkey.pem -signature /tmp/signature-verify.bin)

  echo -e "\nVerify Payload\t" $verified
}

signAndFormatQR () {
  local signatureBase32=$(echo -n $5 | openssl dgst -sign keys/ecdsa_private_key | base32 --wrap=0 | sed s/=//g)

  newQR=$(echo "$1:$2:$3:$signatureBase32:$4:$5")
}

qr='CRED:STATUS:2:GBCAEIAHV2J6PWDSYVLI67RN55WVHIMUTKLFF5GZ4NPHPZ7ZSIJE4MP5M4BCAU6QVDHUP4RQCPXW6XJDAM54VMZ7XURUN34WFT2RWL5ETTZDNHUF:KEYS.PATHCHECK.ORG:1/BUQHHANUB4Z5KHBZTYCWMNI4RQ6CP5WFVVQCUXYHCQVY5WLDDFPA/'

echo
echo "Loading hardcoded QR"
echo 

parseAndVerifyQR $qr

echo
echo "Resigning same payload"
echo

schema=$(echo $qr | cut -f1 -d:)
qrtype=$(echo $qr | cut -f2 -d:)
version=$(echo $qr | cut -f3 -d:)
pubKeyLink=$(echo $qr | cut -f5 -d:)
payload=$(echo $qr | cut -f6 -d:)

signAndFormatQR $schema $qrtype $version $pubKeyLink $payload

echo -e "New QR Signed\t" $newQR
echo ""

parseAndVerifyQR $newQR
