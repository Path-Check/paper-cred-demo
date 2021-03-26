var PCF = {
    githubTree: "https://api.github.com/repos/Path-Check/paper-cred/git/trees",

    localPubKeyDB: {},
    localPayloadsDB: [],
    localPayloadsSpecFiles: {},

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

        try {
            const filesRoot = this.getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/main").tree
            const payloadsDir = filesRoot.find(element => element.path === 'payloads');

            const filesPayloads = this.getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/"+payloadsDir.sha).tree;

            this.localPayloadsSpecFiles = filesPayloads.filter(x => x.path.includes(".fields") )
            this.localPayloadsDB = this.localPayloadsSpecFiles.map(x => x.path.replaceAll(".fields","") );

            return this.localPayloadsDB;
        } catch(err) {
            console.error(err);
        }
    },

    payloadTypeExist: function(type, version) {
      return this.getPayloadTypes().includes(type.toLowerCase()+"."+version);
    },

    getPayloadHeader: function(type, version) {
        if (this.localPayloadsDB.length == 0) this.getPayloadTypes();
        if (!this.payloadTypeExist(type, version)) return undefined;

        const headerFile = this.localPayloadsSpecFiles.find(element => element.path === type.toLowerCase()+"."+version+'.fields');

        try {
            return atob(this.getJSON(headerFile.url).content).split("/");
        } catch(err) {
            console.error(err);
            return undefined;
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
        try {
            const rootDir = this.getJSON(this.githubTree + "/" + "main").tree
            const databasesDir = rootDir.find(element => element.path === 'keys');

            if (databasesDir === undefined) {
                console.debug("Keys Directory not Found on GitHub");
                return;
            }

            const databases = this.getJSON(this.githubTree+"/"+databasesDir.sha).tree
            const databaseDir = databases.find(element => element.path === database);

            if (databaseDir === undefined) {
                console.debug("Database not found on GitHub " + database);
                return;
            } 
            
            const idsFiles = this.getJSON(this.githubTree+"/"+databaseDir.sha).tree
            const idFile = idsFiles.find(element => element.path === id+'.pem');

            if (idFile === undefined) {
                console.debug("Id not found on GitHub " + id);
                return;
            }

            const publicKeyPem = atob(this.getJSON(idFile.url).content)

            return publicKeyPem;
        } catch(err) {
            console.error(err);
        }
    },

    getKeyId: function (pubkeyURL) {
        // Download pubkey to verify
        if (this.localPubKeyDB[pubkeyURL]) {
            return this.localPubKeyDB[pubkeyURL];
        }
            
        try {
            // Try to download from the DNS TXT record. 
            const jsonResponse = this.getJSON("https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT');
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
            const txtResponse = this.getTXT("https://" + pubkeyURL);

            if (txtResponse.includes("-----BEGIN PUBLIC KEY-----")) { 
                this.localPubKeyDB[pubkeyURL] = txtResponse;
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
    },    

    debugParseURI: function(uri) {
        try {
          const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.parseURI(uri);
          const decodedFields = this.parsePayload(payload);

          // Updates screen elements. 
          let formattedResult = "Type: <span class='protocol'>" + type+":"+version+"</span><br>" + 
                                "Signature: <span class='signature'>" + signatureBase32NoPad.substr(0,10) + ".." + signatureBase32NoPad.substr(signatureBase32NoPad.length-10,10) + "</span>" + "<br>" +
                                "Public Keys: <span class='pub-key'>" + pubKeyLink + "</span>" + "<br>" +
                                "Fields: <br>";

          const header = this.getPayloadHeader(type, version);  

          // Decodes all fields
          decodedFields.forEach(function(field, index) {
              formattedResult += "  "+header[index].replace(/^\w/, (c) => c.toUpperCase())+": <span class='message'>" + field + "</span><br>" 
          });

          return formattedResult;
        } catch (err) {
          console.error(err);
          return "";
        }
    },

    debugDownloadVerify: function(pubkeyURL, payload, signatureBase32NoPad) {
      let publicKeyPEM = this.getKeyId(pubKeyLink);
      if (publicKeyPEM !== null) {
          try{
              let verified = this.verify(publicKeyPEM, payload, signatureBase32NoPad);
              return "Signature: " + (verified ? "Independently Verified" : "Not Valid");
          } catch(err) {
              return "Signature Verification Failed: " + err;
              console.error(err);
          }
      } else {
          return "Verification Failed: Public Key not found.";
      }
    },

    debugVerify: function(uri) {
        let formattedMessages = "";
        
        if (uri === "") {
            formattedMessages += "Field is empty. It's not a valid URI.<br>";
            return;
        }

        try {
            this.parseURI(uri);
            formattedMessages += "QR was parsed sucessfully!<br><br>";
        } catch (err) {
            formattedMessages += "Could not parse string into the URI format.<br>";
            return formattedMessages;
        }                

        const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = this.parseURI(uri);

        if (schema !== "CRED") {
            formattedMessages += "QR is not a credential: Code must start with CRED instead of "+schema +".<br>";
            return formattedMessages;
        }

        if (!this.payloadTypeExist(type, version)) {
            formattedMessages += "Type or version <b>" + type + ":" + version + "</b> was not recognized. Make sure this payload type and version are available on <a href='https://github.com/Path-Check/paper-cred/tree/main/payloads'>GitHub</a> <br><br>";
        }

        if (formattedMessages.includes("QR was parsed sucessfully!")) {
            formattedMessages += this.debugDownloadVerify(pubKeyLink, payload, signatureBase32NoPad);
        } else {
            formattedMessages += "<br>Signature: not verified";
        }

        return formattedMessages;
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = PCF 