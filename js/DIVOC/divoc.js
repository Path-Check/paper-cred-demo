var DIVOC = {
    PRIVATE_KEY_PEM: '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAnXQalrgztecTpc+INjRQ8s73FSE1kU5QSlwBdICCVJBUKiuQUt7s+Z5epgCvLVAOCbP1mm5lV7bfgV/iYWDio7lzX4MlJwDedWLiufr3Ajq+79CQiqPaIbZTo0i13zijKtX7wgxQ78wT/HkJRLkFpmGeK3za21tEfttytkhmJYlwaDTEc+Kx3RJqVhVh/dfwJGeuV4Xc/e2NH++ht0ENGuTk44KpQ+pwQVqtW7lmbDZQJoOJ7HYmmoKGJ0qt2hrj15uwcD1WEYfY5N7N0ArTzPgctExtZFDmituLGzuAZfv2AZZ9/7Y+igshzfB0reIFdUKw3cdVTzfv5FNrIqN5pwIDAQABAoIBAHPILMUoLt5UTd5f/YnebqgeCRNAmGOBcwk7HtbMqQoGF93qqvZFd30XOAJZ/ncTpz77Vl95ToxxrWk1WQLCe+ZpOK3Dgk5sFSm8zXx1T64UBNPUSnWoh37C1D39+b9rppCZScgnxlyPdSLy3h3q8Hyoy+auqUEkm/ms5W2lT3fJscyN1IAyHrhsOBWjl3Ilq5GxBo5tbYv/Fb1pQiP/p2SIHA1+2ASXNYQP100F5Vn0V6SFtBXTCQnwcvbP083NvlGxs9+xRs3MCUcxCkKepWuzYwOZDmu/2yCz1/EsP6wlsYEHmCZLdIb0tQt0caqzB/RoxfBpNRIlhOtqHvBzUgECgYEAzIRn5Y7lqO3N+V29wXXtVZjYWvBh7xUfOxAwVYv0rKI0y9kHJHhIrU+wOVOKGISxBKmzqBQRPvXtXW8E0/14Zz82g60rRwtNjvW0UoZAY3KPouwruUIjAe2UnKZcQ//MBTrvds8QGpL6nxvPsBqU0y2K+ySAOxBtNtGEjzv8nxUCgYEAxRbMWukIbgVOuQjangkfJEfA1UaRFQqQ8jUmT9aiq2nREnd4mYP8kNKzJa9L7zj6Un6yLH5DbGspZ2gGODeRw3uVFN8XSzRdLvllNEyiG/waiysUtXfG2DPOR6xD8tXXDMm/tl9gTa8cbkvqYy10XT9MpfOAsusEZVmc0/DBBMsCgYAYdAxoKjnThPuHwWma5BrIjUnxNaTADWp6iWj+EYnjylE9vmlYNvmZn1mWwSJV5Ce2QwQ0KJIXURhcf5W4MypeTfSase3mxLc1TLOO2naAbYY3GL3xnLLK3DlUsZ9+kes3BOD097UZOFG3DIA8sjDxPxTLCoY6ibBFSa/r4GRIMQKBgQCranDCgPu79RHLDVBXM0fKnj2xQXbd/hqjDmcL+Xnx7E7S6OYTXyBENX1qwVQh9ESDi34cBJVPrsSME4WVT3+PreS0CnSQDDMfr/m9ywkTnejYMdgJHOvtDuHSpJlUk3g+vxnm3H0+E5d+trhdGiOjFnLrwyWkd5OTMqWcEEFQkQKBgFfXObDz/7KqeSaAxI8RzXWbI3Fa492b4qQUhbKYVpGn98CCVEFJr11vuB/8AXYCa92OtbwgMw6Ah5JOGzRScJKdipoxo7oc2LJ9sSjjw3RB/aWl35ChvnCJhmfSL8Usbj0nWVTrPwRLjMC2bIxkLtnm9qYXPumW1EjEbusjVMpN\n-----END RSA PRIVATE KEY-----\n',
    PUBLIC_KEY_PEM: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnXQalrgztecTpc+INjRQ8s73FSE1kU5QSlwBdICCVJBUKiuQUt7s+Z5epgCvLVAOCbP1mm5lV7bfgV/iYWDio7lzX4MlJwDedWLiufr3Ajq+79CQiqPaIbZTo0i13zijKtX7wgxQ78wT/HkJRLkFpmGeK3za21tEfttytkhmJYlwaDTEc+Kx3RJqVhVh/dfwJGeuV4Xc/e2NH++ht0ENGuTk44KpQ+pwQVqtW7lmbDZQJoOJ7HYmmoKGJ0qt2hrj15uwcD1WEYfY5N7N0ArTzPgctExtZFDmituLGzuAZfv2AZZ9/7Y+igshzfB0reIFdUKw3cdVTzfv5FNrIqN5pwIDAQAB\n-----END PUBLIC KEY-----\n',

    customLoader: function(url) {
        const c = {
            "did:india": this.PUBLIC_KEY_PEM,
            "https://example.com/i/india": this.PUBLIC_KEY_PEM,
            "https://w3id.org/security/v1": seccontext.contexts.get("https://w3id.org/security/v1"),
            'https://www.w3.org/2018/credentials#': credentialsv1,
            "https://www.w3.org/2018/credentials/v1": credentialsv1,
            "https://cowin.gov.in/credentials/vaccination/v1": vaccinationContext,
        };
        let context = c[url];
        if (context === undefined) {
            context = seccontext.contexts[url];
        }
        if (context !== undefined) {
            return {
                contextUrl: null,
                documentUrl: url,
                document: context
            };
        }
        if (url.startsWith("{")) {
            return JSON.parse(url);
        }
        console.log("Fallback url lookup for document :" + url)
        return documentLoader()(url);
    },

    verify: async function(signed) {
        try {
            const signedJSON = signed; //JSON.parse(signed);
            const publicKey = {
                '@context': jsigs.SECURITY_CONTEXT_URL,
                id: 'did:india',
                type: 'RsaVerificationKey2018',
                controller: 'https://cowin.gov.in/',
                publicKeyPem: this.PUBLIC_KEY_PEM
            };
            const controller = {
                '@context': jsigs.SECURITY_CONTEXT_URL,
                id: 'https://cowin.gov.in/',
                publicKey: [publicKey],
                // this authorizes this key to be used for making assertions
                assertionMethod: [publicKey.id]
            };
            const key = new RSAKeyPair({...publicKey});
            const {AssertionProofPurpose} = jsigs.purposes;
            
            const result = await jsigs.verify(signedJSON, {
                suite: new rsa.RsaSignature2018({key}),
                purpose: new AssertionProofPurpose({controller}),
                documentLoader: this.customLoader,
                compactProof: false
            });
            if (result.verified) {
                console.log('Signature verified.');
            } 
            console.log('Finish', result);
            return result.verified;
        } catch (e) {
            console.log('Invalid data', e);
        }
    },

    sign: async function (certificate) {
        const publicKey = {
            '@context': jsigs.SECURITY_CONTEXT_URL,
            id: 'did:india',
            type: 'RsaVerificationKey2018',
            controller: 'https://cowin.gov.in/',
            publicKeyPem: this.PUBLIC_KEY_PEM
        };
        const controller = {
            '@context': jsigs.SECURITY_CONTEXT_URL,
            id: 'https://cowin.gov.in/',
            publicKey: [publicKey],
            // this authorizes this key to be used for making assertions
            assertionMethod: [publicKey.id]
        };

        const key = new RSAKeyPair({...publicKey, privateKeyPem: this.PRIVATE_KEY_PEM});
        const {AssertionProofPurpose} = jsigs.purposes;
        console.log("signed");   
        const signed = await jsigs.sign(certificate, {
            documentLoader: this.customLoader,
            suite: new rsa.RsaSignature2018({key}),
            purpose: new AssertionProofPurpose({
                controller: controller
            }),
            compactProof: false
        });
        
        return signed;
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = DIVOC