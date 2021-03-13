# Signed Vaccine Certificate Generator

JavaScipt-based web app to generate a Vaccine Certification in a alphanumeric QR Code that is signed by the Health Provider. 

Users can distribute their certificates to prove they have been vaccinated and are free of COVID-19. 

The complete specification documentation is [here](https://github.com/Path-Check/paper-cred)

<img src="./docs/QRCodeGenerator.png" data-canonical-src="./docs/QRCodeGenerator.png"/>

## Certificate Specification

The certificate is the signed record that prove a patient name has taken a vaccine. It follows the format of [paper-creds](https://github.com/Path-Check/paper-cred): 

```
cred:type:version:signature:publicKeyId:payload
```

Example:

```
CRED:BADGE:1:GBCAEIBOFEBIZUXYC2D6EYOBJURKOQ5KQ3F4YLAUBMO3MY52E6QSVNMIAQBCAOTWMM5VZTWW3USVQLNCNNNAGXJ4PW3JYKL6TWMKZXDJA5E2CPPC:PCF.VITORPAMPLONA.COM:20210303/MODERNA/COVID-19/012L20A/28/TCXRTFWS4NAADDA5N76GOUIYUP54BCY5DLYUVU2YIISKVKNTR7VA/C28161/RA/500
````

## Try it out!

This webapp has been deployed [here](https://vitorpamplona.com/vaccine-certificate-qrcode-generator/). 
