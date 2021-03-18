var PCF = {
    localPubKeyDB: {},
    localPayloadsDB: [],

    // PEM Definitions
    ECPublicKey: asn1.define("PublicKey", function() {
        this.seq().obj(
            this.key("algorithm").seq().obj(
                this.key("id").objid(),
                this.key("curve").objid()
            ),
            this.key("pub").bitstr()
        );
    }),

    ECPrivateKey: asn1.define("ECPrivateKey", function() {
        this.seq().obj(
            this.key('version').int().def(1),
            this.key('privateKey').octstr(),
            this.key('parameters').explicit(0).objid().optional(),
            this.key('publicKey').explicit(1).bitstr().optional()
        );
    }),

    algos: {'1.2.840.10045.2.1':'Elliptic curve public key cryptography'},
    curves: {'1.3.132.0.10': 'secp256k1'},

    buildPayload: function(valueArray) {
        const fields = valueArray.map(function(elem) {
            return encodeURIComponent(elem.toUpperCase());
        })
        return fields.join('/');
    },

    parsePayload(payload) {
        const encodedFields = payload.split("/");
        const decodedFields = encodedFields.map(function(field) {
            return decodeURIComponent(field);
        })
        return decodedFields;
    },

    buildHashPayload: function (elemArray) {
        const RS = String.fromCharCode(30);
        let fields = elemArray.map(function(elem) {
            return elem.toUpperCase();
        })
        return fields.join(RS);
    },

    getPayloadHash: function(fields) {
      const hashedPassKey = this.buildHashPayload(fields);
      const digest = CryptoJS.SHA256(hashedPassKey).toString();
      const hashPassKeyBase32 = this.rmPad(base32.encode(digest));
      return hashPassKeyBase32;
    },  

    pad: function (base32Str) {
        switch (base32Str.length % 8) {
            case 2: return base32Str + "======"; 
            case 4: return base32Str + "===="; 
            case 5: return base32Str + "==="; 
            case 7: return base32Str + "="; 
        }
        return base32Str;
    },

    rmPad: function(base32Str) {
        return base32Str.replaceAll("=", "");
    },        

    verify: function(pubkey, payload, signatureBase32NoPad, feedback_elem_id) {
        // Decoding the public key to get curve algorithm + key itself
        const pubk = this.ECPublicKey.decode(pubkey, 'pem', {label: 'PUBLIC KEY'});

        // Get Encryption Algorithm: EC
        const algoCode = pubk.algorithm.id.join('.');
        // Get Curve Algorithm: secp256k1
        const curveCode = pubk.algorithm.curve.join('.');
        
        // Prepare EC with assigned curve
        const ec = new elliptic.ec(this.curves[curveCode]);
        
        // Load public key from PEM as DER
        const key = ec.keyFromPublic(pubk.pub.data, 'der');

        // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
        const payloadSHA256 = CryptoJS.SHA256(payload).toString();

        // Gets the Base32 enconded, add padding and convert to DER.
        const signatureDER = base32.decode.asBytes(this.pad(signatureBase32NoPad));

        // Verifies Signature. 
        return key.verify(payloadSHA256, signatureDER);
    },

    sign: function(type, version, priKeyPEM, pubKeyLink, payloadValueArray) {
        // Load Primary Key
        const ec_pk = this.ECPrivateKey.decode(priKeyPEM, 'pem', {label: 'EC PRIVATE KEY'});
        
        // Get Curve Algorithm.
        const curveCode = ec_pk.parameters.join('.');
        
        // Prepare EC with assigned curve: secp256k1
        const ec = new elliptic.ec(this.curves[curveCode]);

        // Load Private Key from PEM file converted to DER.
        const key = ec.keyFromPrivate(ec_pk.privateKey, 'der');

        // Assemble Payload
        const payload = this.buildPayload(payloadValueArray);

        // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
        const payloadSHA256 = CryptoJS.SHA256(payload).toString();
        
        // Signs, gets a DER
        const signatureDER = key.sign(payloadSHA256).toDER();

        // Converts DER to Base32 and remove padding. 
        const signature = this.rmPad(base32.encode(signatureDER));

        return this.formatURI(type, version, signature, pubKeyLink, payload);
    },

    parseURI: function(uri) {
        return [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = uri.split(':');
    },

    formatURI: function(type, version, signature, pubKeyLink, payload) {
      return ["CRED", type.toUpperCase(), version.toUpperCase(), signature, pubKeyLink.toUpperCase(), payload].join(":");
    },

    getPayloadTypes: function() {
        if (this.localPayloadsDB.length > 0) return this.localPayloadsDB;

        let client = new XMLHttpRequest();
        try {
            client.open('GET', "https://api.github.com/repos/Path-Check/paper-cred/git/trees/main", false);
            client.setRequestHeader("Accept", "application/vnd.github.v3+json");
            client.send();

            const filesRoot = JSON.parse(client.response).tree
            const payloadsDir = filesRoot.find(element => element.path === 'payloads');

            client.open('GET', "https://api.github.com/repos/Path-Check/paper-cred/git/trees/"+payloadsDir.sha, false);
            client.setRequestHeader("Accept", "application/vnd.github.v3+json");
            client.send();

            this.localPayloadsDB = JSON.parse(client.response).tree.map(x => x.path.replaceAll(".md","").replaceAll(".",":"));
            return this.localPayloadsDB;
        } catch(err) {
            console.error(err);
        }
    },

    getTXT: function(url) {
        let client = new XMLHttpRequest();
        client.open('GET', url, false);
        client.setRequestHeader("Accept", "application/vnd.github.v3+json");
        client.send();
        return client.response;
    },

    getJSON: function(url) {
        return JSON.parse(this.getTXT(url));
    },

    getGitHubDatabase: function(id, database) {
        const githubTree = "https://api.github.com/repos/Path-Check/paper-cred/git/trees";
        const githubBlob = "https://api.github.com/repos/Path-Check/paper-cred/git/blobs";

        try {
            const rootDir = this.getJSON(githubTree + "/" + "main").tree
            const databasesDir = rootDir.find(element => element.path === 'keys');

            if (databasesDir === undefined) {
                console.debug("Keys Directory not Found on GitHub");
                return;
            }

            const databases = this.getJSON(githubTree+"/"+databasesDir.sha).tree
            const databaseDir = databases.find(element => element.path === database);

            if (databaseDir === undefined) {
                console.debug("Database not found on GitHub " + database);
                return;
            } 
            
            const idsFiles = this.getJSON(githubTree+"/"+databaseDir.sha).tree
            const idFile = idsFiles.find(element => element.path === id+'.pem');

            if (idFile === undefined) {
                console.debug("Id not found on GitHub " + id);
                return;
            }

            const publicKeyPem = atob(this.getJSON(githubBlob+"/"+idFile.sha).content)

            return publicKeyPem;
        } catch(err) {
            console.error(err);
        }
    },

    getKeyId: function (pubkeyURL) {
        // Download pubkey to verify
        let client = new XMLHttpRequest();

        if (this.localPubKeyDB[pubkeyURL]) {
            return this.localPubKeyDB[pubkeyURL];
        }
            
        try {
            // Try to download from the DNS TXT record. 
            client.open('GET', "https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT', false);
            client.send();

            const jsonResponse = JSON.parse(client.response);
            if (jsonResponse.Answer) {
                const pubKeyTxtLookup = JSON.parse(client.response).Answer[0].data
                const noQuotes = pubKeyTxtLookup.substring(1, pubKeyTxtLookup.length - 1).replaceAll("\\n","\n");
                    
                if (noQuotes) {   
                    this.localPubKeyDB[pubkeyURL] = noQuotes;
                    return this.localPubKeyDB[pubkeyURL];
                }
            }
        } catch(err) {
            console.error(err);
        }    

        try {
            // Try to download as a file. 
            client.open('GET', "https://" + pubkeyURL, false);
            client.send();

            if (client.response.includes("-----BEGIN PUBLIC KEY-----")) { 
                this.localPubKeyDB[pubkeyURL] = client.response;
                return this.localPubKeyDB[pubkeyURL];
            }
        } catch(err) {
            console.error(err);
        }

        try {   
            let publicKey = this.getGitHubDatabase(pubkeyURL.split('.')[0], pubkeyURL.split('.')[1]);
            if (publicKey != undefined && publicKey.includes("-----BEGIN PUBLIC KEY-----")) { 
                this.localPubKeyDB[pubkeyURL] = publicKey;
                return this.localPubKeyDB[pubkeyURL];
            } else {
                console.error("GitHub Not Found: "+ publicKey);
            }
        } catch(err) {
            console.error(err);
        }

        return null;
    }    
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = PCF 