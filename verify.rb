# frozen_string_literal: true

# gem install base32

require 'openssl'
require 'base32'
require 'pp'
require 'resolv'

def pad(base32str)
  base32str +
    case base32str.length % 8
    when 2 then '======'
    when 4 then '===='
    when 5 then '==='
    when 7 then '='
    else ''
    end
end

def rm_pad(base32text)
  base32text.gsub '=', ''
end

def download(pub_key_link)
  Resolv::DNS.open do |dns|
    resource = dns.getresource(pub_key_link, Resolv::DNS::Resource::IN::TXT)
    key = resource.data.split('\n').join("\n")
    unless key.include? '-----BEGIN PUBLIC KEY-----'
      key = "-----BEGIN PUBLIC KEY-----\n#{key}\n-----END PUBLIC KEY-----\n"
    end
    return key
  end
  nil
end

def parse_and_verify_qr(qr)
  (schema, qrtype, version, signature_b32, pub_key_link, payload) = qr.split(/:/)

  puts "Parsed QR\t #{schema} #{qrtype} #{version} #{signature_b32} #{pub_key_link} #{payload}"

  sha_payload = Digest::SHA256.digest(payload)
  signature = Base32.decode(pad(signature_b32))

  puts "Payload Bytes\t #{sha_payload.bytes}"
  puts "Signature DER\t #{signature.bytes}"

  vk = OpenSSL::PKey::EC.new(download(pub_key_link))
  verified = vk.dsa_verify_asn1(sha_payload, signature)

  puts "\nVerify Payload\t #{verified}"

  verified
end

def sign_and_format_qr(sk, schema, qrtype, version, pub_key_link, payload)
  sha_payload = Digest::SHA256.digest(payload)
  sig = sk.dsa_sign_asn1(sha_payload)

  formatted_sig = rm_pad(Base32.encode(sig))

  [schema, qrtype, version, formatted_sig, pub_key_link, payload].join ':'
end

uri = 'CRED:STATUS:2:GBCAEIAHV2J6PWDSYVLI67RN55WVHIMUTKLFF5GZ4NPHPZ7ZSIJE4MP5M4BCAU6QVDHUP4RQCPXW6XJDAM54VMZ7XURUN34WFT2RWL5ETTZDNHUF:KEYS.PATHCHECK.ORG:1/BUQHHANUB4Z5KHBZTYCWMNI4RQ6CP5WFVVQCUXYHCQVY5WLDDFPA/'

puts ''
puts 'Loading hardcoded QR'
puts ''

parse_and_verify_qr(uri)

puts ''
puts 'Resigning same payload'
puts ''

(schema, qrtype, version, _, pub_key_link, payload) = uri.split(/:/)
sk = OpenSSL::PKey::EC.new(File.read('keys/ecdsa_private_key'))
new_qr = sign_and_format_qr(sk, schema, qrtype, version, pub_key_link, payload)

puts "New QR Signed\t #{new_qr}"
puts ''

parse_and_verify_qr(new_qr)
