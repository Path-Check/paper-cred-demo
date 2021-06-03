var PCFUtils = {
    debugPayloadURL: async  function(type, version) {
       return "https://github.com/Path-Check/paper-cred/blob/main/payloads/"+type.toLowerCase()+"."+version+".md";
    },

    crop: async function(signature) {
        return signature.substr(0,5) + ".." + signature.substr(signature.length-5,5);
    }, 

    cropFieldName: async function(key) {
        let uppercase = key.replace(/^\w/, (c) => c.toUpperCase());
        if (uppercase.length > 10) {
            uppercase = this.crop(uppercase);
        }
        return uppercase;
    }, 

    htmlEncode: async function(text) {
        if (!text) return text;
        return text.replaceAll('>','&#62;')
                   .replaceAll('<','&#60;')
                   .replaceAll('\'','&#39;')
                   .replaceAll('\"','&#34;');
    },

    debugFields: async function(padding, decodedFields) {
        // Decodes all fields
        let formattedResult = ""
        for (var key in decodedFields) {
            if (Array.isArray(decodedFields[key])) {
                for (let arrayItem=0; arrayItem < decodedFields[key].length; arrayItem++) {
                    formattedResult += padding + await this.cropFieldName(key) +arrayItem+ ": <br>";
                    formattedResult += await this.debugFields(padding + "  ",  decodedFields[key][arrayItem]);
                }
            } else {
                formattedResult += padding + await this.cropFieldName(key) + ": " +
                                "<span class='message'>" + 
                                    await this.htmlEncode(decodedFields[key])
                                + "</span><br>" 
            }

        }
        return formattedResult;
    },

    debugParseURI: async function(uri) {
        try {
            const [schema, type, version, signature, keyID, payloadNormalized] = await CRED.unpack(uri);
            const payload = await CRED.unpackAndVerify(uri);
            const decodedFields = await CRED.mapHeaders(payload, type, version);

            const rKeyID = await CRED.resolveKey(keyID);

            // Updates screen elements. 
            let formattedResult = "Type: <span class='protocol'>" + type + ":" + version +
                                            " (<a href='" + await this.debugPayloadURL(type, version) + "'>spec</a>)" +
                                        "</span><br>" + 
                                "Signature: <span class='signature'>" + await this.crop(signature) + "</span>" + "<br>" +
                                "PubKey: <span class='pub-key'>" + keyID + "</span>" +
                                        " (<a href='" + rKeyID.debugPath + "'>"+rKeyID.type+"</a>)" + "<br>" +
                                "Fields: <br>";

            formattedResult += await this.debugFields("  ", decodedFields);

            return formattedResult;
        } catch (err) {
            console.error(err);
            return "";
        }
    },

    debugVerify: async function(uri) {
        let formattedMessages = "";
        
        if (uri === "") {
            formattedMessages += "Field is empty. It's not a valid URI.<br>";
            return;
        }

        try {
            await CRED.unpack(uri);
            formattedMessages += "QR was parsed sucessfully!<br><br>";
        } catch (err) {
            formattedMessages += "Could not parse string into the URI format.<br>";
            return formattedMessages;
        }                

        const [schema, type, version, signatureBase32NoPad, keyID, payloadStr] = await CRED.unpack(uri);
        const rKeyID = await CRED.resolveKey(keyID);

        if (!rKeyID) {
            formattedMessages += "Public Key not found";
            return formattedMessages;
        }

        const payloadArray = await CRED.unpackAndVerify(uri);
        const decodedFields = await CRED.mapHeaders(payloadArray, type, version);

        if (schema !== "CRED") {
            formattedMessages += "QR is not a credential: Code must start with CRED instead of "+schema +".<br>";
            return formattedMessages;
        }

        if (!decodedFields) {
            formattedMessages += "Type or version <b>" + type + ":" + version + "</b> was not recognized. Make sure this payload type and version are available on <a href='https://github.com/Path-Check/paper-cred/tree/main/payloads'>GitHub</a> <br><br>";
        }

        if (formattedMessages.includes("QR was parsed sucessfully!")) {
            formattedMessages += payloadArray ? "Signature: Verified" : "<br>Signature: Invalid" ;
        } else {
            formattedMessages += "<br>Signature: not verified";
        }

        return formattedMessages;
    },

    debugURI: async function(uri) {
        const [schema, type, version, signature, pubKeyLink, payload] = await CRED.unpack(uri);
        
        let uriDebugger = "<a href='https://github.com/Path-Check/paper-cred'><span class='schema'>" + schema + "</span></a>:" + 
                                    "<a href='https://github.com/Path-Check/paper-cred/blob/main/payloads/"+type.toLowerCase()+"."+version+".md'><span class='protocol'>"+type+":"+version+"</span></a>:" +                           
                                    "<span class='signature'>" + signature + "</span>" + ":" +
                                    "<span class='pub-key'>" + pubKeyLink + "</span>" + ":" +
                                    "<span class='message'>" + payload + "</span><br>";

        uriDebugger +=
            "<pre>CRED:<span class='protocol'>TYPE:VER</span>:<span class='signature'>SIG</span>:" +
            "<span class='pub-key'>KEYID</span>:<span class='message'>PAYLOAD</span></pre>";

        return uriDebugger;
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = PCFUtils