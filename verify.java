import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.Hashtable;

import javax.naming.directory.Attribute;
import javax.naming.directory.InitialDirContext;

import org.apache.commons.codec.binary.Base32;

public class verify {
  public static String pad(String base32Str) {
    switch (base32Str.length() % 8) {
        case 2: return base32Str + "======"; 
        case 4: return base32Str + "===="; 
        case 5: return base32Str + "==="; 
        case 7: return base32Str + "="; 
    }
    return base32Str;
  }

  public static String rmPad(String base32Str) {
    return base32Str.replaceAll("=", "");
  }

  public static String buildPEMFromDNS(String encodedKey) {
    String key = encodedKey.replaceAll("\"","").replaceAll("\\\\n", "n").replaceAll("\\\\n", "\n");
    if (!key.contains("-----BEGIN PUBLIC KEY-----")) {
      key = "-----BEGIN PUBLIC KEY-----" + "\n" + key + "\n" + "-----END PUBLIC KEY-----\n";
    }
    return key;
  }

  public static String downloadPubKeyFromTXTRecord(String pubKeyLink) throws Exception {
    Hashtable<String, String> env = new Hashtable<String, String>();
    env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
    Attribute txt = new InitialDirContext(env).getAttributes(pubKeyLink, new String[] { "TXT" }).get("TXT");
    return buildPEMFromDNS(txt.get(0).toString());
  }

  public static PrivateKey getPrivateKey() throws Exception {
    String privKeyPEM = new String(Files.readAllBytes(Paths.get("keys/ecdsa_private_key8.pem")));
    privKeyPEM = privKeyPEM.replaceAll("\\n", "")
                           .replace("-----BEGIN PRIVATE KEY-----", "")
                           .replace("-----END PRIVATE KEY-----", "");

    PKCS8EncodedKeySpec keySpecPKCS8 = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privKeyPEM));
    return KeyFactory.getInstance("EC").generatePrivate(keySpecPKCS8);
  }

  public static PublicKey getPublicKey(String pubKeyLink) throws Exception {
    String pubKeyPEM = downloadPubKeyFromTXTRecord(pubKeyLink);
    pubKeyPEM = pubKeyPEM.replaceAll("\\n", "")
                         .replace("-----BEGIN PUBLIC KEY-----", "")
                         .replace("-----END PUBLIC KEY-----", "");

    X509EncodedKeySpec x509 = new X509EncodedKeySpec(Base64.getDecoder().decode(pubKeyPEM));
    return KeyFactory.getInstance("EC").generatePublic(x509);
  }

  public static String[] parseQR(String qr) {
    return qr.split(":");
  }

  public static boolean parseAndVerifyQR(String qr) throws Exception {
    String[] qrArray = parseQR(qr);
    System.out.println("Parsed QR\t" + Arrays.toString(qrArray));

    String base32Signature = qrArray[3];
    String pubKeyLink = qrArray[4];
    String payload = qrArray[5];

    byte[] payloadBytes = payload.getBytes();
    byte[] signatureDER = new Base32().decode(pad(base32Signature).getBytes());
    
    Signature s = Signature.getInstance("SHA256withECDSA");
    s.initVerify(getPublicKey(pubKeyLink));
    s.update(payloadBytes);

    System.out.println("Payload Bytes\t" + Arrays.toString(payloadBytes));
    System.out.println("Signature DER\t" + Arrays.toString(signatureDER));

    boolean verified = s.verify(signatureDER);

    System.out.println("");
    System.out.println("Verify Payload\t" + verified);

    return verified;
  }

  public static String signAndFormatQR(String schema, String qrtype, String version, String pubKeyLink, String payload) throws Exception {
    byte[] payloadBytes = payload.getBytes();

    Signature s = Signature.getInstance("SHA256withECDSA");
    s.initSign(getPrivateKey());
    s.update(payloadBytes);

    byte[] signatureDER = s.sign();
    String formattedSig = rmPad(new String(new Base32().encode(signatureDER)));

    return schema + ":" + qrtype + ":" + version + ":" + formattedSig + ":" +  pubKeyLink + ":" + payload; 
  }

  public static void main( String args[]) throws Exception {
    String qr = "CRED:STATUS:2:GBCAEIAHV2J6PWDSYVLI67RN55WVHIMUTKLFF5GZ4NPHPZ7ZSIJE4MP5M4BCAU6QVDHUP4RQCPXW6XJDAM54VMZ7XURUN34WFT2RWL5ETTZDNHUF:KEYS.PATHCHECK.ORG:1/BUQHHANUB4Z5KHBZTYCWMNI4RQ6CP5WFVVQCUXYHCQVY5WLDDFPA/";
    
    System.out.println("");
    System.out.println("Loading hardcoded QR");
    System.out.println("");

    parseAndVerifyQR(qr);

    System.out.println("");
    System.out.println("Resigning same payload");
    System.out.println("");

    String[] qrArray = parseQR(qr);

    String newQR = signAndFormatQR(qrArray[0], qrArray[1], qrArray[2], qrArray[4], qrArray[5]);

    System.out.println("New QR Signed\t" + newQR);
    System.out.println("");

    parseAndVerifyQR(newQR);
  }
}