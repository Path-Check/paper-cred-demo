# Signed Vaccine Certificate Generator

JavaScipt-based web app to generate a Vaccine Certification in a QR Code that is signed by the Health Provider, making it impossible to forge. 

Users can distribute their certificates to prove they have been vaccinated and are free of COVID-19. 

<img src="./docs/QRCodeGenerator.png" data-canonical-src="./docs/QRCodeGenerator.png"/>

## Behavior

1. A vaccine provider inserts Vaccination data, the vacinee ID and signs with a Private Key. 
2. The QR code can be copied, printed or loaded into an app for wide distribution. 
3. The [here](https://github.com/vitorpamplona/vaccine-certificate-tracking-app) reads the QR Code, validates the signature and imports multiple certificates for the user and other vacinees and is ideal for Business that want to verify the certificates of customers to guarantee a COVID-free environment. 

## Immunization Certificate

The certificate is the signed record that prove a patient name has taken a vaccine. It follows the format: 

```
healthpass:typeOfHash\signature@pubKeyURL?<record as queryString>
```

Example:

```
healthpass:SHA256\XhwgTyPE+Q6EaeEY+I10PbMI3i7yP6y73/tyYcjjtLciTW
adqjVoQ9xBrQxzVBCsu53dmA6f/kH9QFLHiRpa+SGe3+fjMLQrT5r19rEYYewA0P
WFMNRUg3uYsxvaYTaK7ZuMKypR1BDE1jFUkYlbcf15/yM2CBf1Msx5+tc5qv0=
@vitorpamplona.com/vaccine-certificate-qrcode-generator/pub_key?
date=2020-11-27T15:19:55.682Z&vaccinee=Vitor%20Fernando%20Pamplona
&vaccinator=CVS%20Minute%20Clinics&manuf=Pfizer&name=COVID19&lot=1221
&route=Intramuscular&site=Right%20arm&dose=1.0
````

## Try it out!

This webapp has been deployed [here](https://vitorpamplona.com/vaccine-certificate-qrcode-generator/). 