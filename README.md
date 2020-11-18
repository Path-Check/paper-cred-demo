# Signed Vaccine Certificate Generator

JavaScipt-based web app to generate a Vaccine Certification in a QR Code that is signed by the Health Provider, making it impossible to forge. 

Users can distribute their certificates to prove they have been vaccinated and are free of COVID-19. 

<img src="./docs/QRCodeGenerator.png" data-canonical-src="./docs/QRCodeGenerator.png"/>

## Behavior

1. A vaccine provider inserts Vaccination data, the vacinee ID and signs with a Private Key. 
2. The QR code can be copied, printed or loaded into an app for wide distribution. 
3. The [here](https://github.com/vitorpamplona/vaccine-certificate-tracking-app) reads the QR Code, validates the signature and imports multiple certificates for the user and other vacinees and is ideal for Business that want to verify the certificates of customers to guarantee a COVID-free environment. 

## Try it out!

This webapp has been deployed [here](https://vitorpamplona.com/vaccine-certificate-qrcode-generator/). 