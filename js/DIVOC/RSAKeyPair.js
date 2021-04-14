/*!
 * Copyright (c) 2018-2019 Digital Bazaar, Inc. All rights reserved.
 */

const {
  md: {sha256},
  pki: {getPublicKeyFingerprint, publicKeyFromPem},
  util: {binary: {base58, raw}}
} = forge;

/**
 * @constant
 * @type {number}
 * @default
 */
const DEFAULT_RSA_KEY_BITS = 2048;

/**
 * @constant
 * @type {number}
 * @default
 */
const DEFAULT_RSA_EXPONENT = 0x10001;

class RSAKeyPair extends cryptold.LDKeyPair {
  /* eslint-disable max-len */
  /**
   * An implementation of
   * [RSA encryption]{@link https://simple.wikipedia.org/wiki/RSA_algorithm}
   * for
   * [jsonld-signatures]{@link https://github.com/digitalbazaar/jsonld-signatures}.
   * @example
   * > const options = {
   *    privateKeyPem: 'testPrivateKey',
   *    publicKeyPem: 'testPublicKey'
   *  };
   * > const RSAKey = new RSAKeyPair(options);
   * @param {KeyPairOptions} options - Keys must be in RSA format other
   * options must follow [KeyPairOptions]{@link ./index.md#KeyPairOptions}.
   * @param {string} options.publicKeyPem - Public Key for Signatures.
   * @param {string} options.privateKeyPem - Your Confidential key for signing.
   */
  /* eslint-enable */
  constructor(options = {}) {
    super(options);
    this.type = 'RsaVerificationKey2018';
    this.privateKeyPem = options.privateKeyPem;
    this.publicKeyPem = options.publicKeyPem;

    this.validateKeyParams(); // validate keyBits and exponent
  }
  /**
   * Returns the public key.
   * @implements {LDKeyPair#publicKey}
   * @readonly
   *
   * @returns {string} The public key.
   * @see [publicKey]{@link ./LDKeyPair.md#publicKey}
   */
  get publicKey() {
    return this.publicKeyPem;
  }
  /**
   * Returns the private key.
   * @implements {LDKeyPair#privateKey}
   * @readonly
   *
   * @returns {string} The private key.
   * @see [privateKey]{@link ./LDKeyPair.md#privateKey}
   */
  get privateKey() {
    return this.privateKeyPem;
  }

  /**
   * Generates an RSA KeyPair using the RSA Defaults.
   * @example
   * > const keyPair = await RSAKeyPair.generate();
   * > keyPair
   * RSAKeyPair { ...
   * @param {KeyPairOptions} [options={}] - See LDKeyPair
   * docstring for full list.
   *
   * @returns {Promise<RSAKeyPair>} A Default encrypted RSA KeyPair.
   * @see [KeyPairOptions]{@link ./index.md#KeyPairOptions}
   */
  static async generate(options = {}) {
    // forge will use a native implementation in nodejs >= 10.12.0
    // and a purejs implementation in browser and nodejs < 10.12.0
    return new Promise((resolve, reject) => {
      forge.pki.rsa.generateKeyPair({
        bits: DEFAULT_RSA_KEY_BITS,
        e: DEFAULT_RSA_EXPONENT,
        workers: -1
      }, (err, keyPair) => {
        if(err) {
          return reject(err);
        }
        resolve(new RSAKeyPair({
          publicKeyPem: forge.pki.publicKeyToPem(keyPair.publicKey),
          privateKeyPem: forge.pki.privateKeyToPem(keyPair.privateKey),
          ...options
        }));
      });
    });
  }
  /**
   * Creates a RSA Key Pair from an existing private key.
   * @example
   * > const options = {
   *    privateKeyPem: 'testkeypem'
   *  };
   * > const key = await RSAKeyPair.from(options);
   * @param {Object} options - Contains a private key.
   * @param {Object} [options.privateKey] - A private key.
   * @param {string} [options.privateKeyPem] - An RSA Private key.
   *
   * @returns {RSAKeyPair} An RSA Key Pair.
   */
  static async from(options) {
    const privateKeyPem = options.privateKeyPem ||
      // legacy privateDidDoc format
      (options.privateKeyPem && options.privateKey.privateKeyPem);

    const keys = new RSAKeyPair({
      publicKey: options.publicKeyPem,
      privateKeyPem,
      type: options.type || options.keyType, // todo: deprecate keyType usage
      ...options
    });

    return keys;
  }
  /**
   * Validates this key.
   * @example
   * > rsaKeyPair.validateKeyParams();
   * undefined
   *
   * @returns {undefined} If it does not throw then the key is valid.
   * @throws Invalid RSA keyBit length
   * @throws Invalid RSA exponent
   */
  validateKeyParams() {
    if(this.publicKeyPem) {
      const publicKey = forge.pki.publicKeyFromPem(this.publicKeyPem);
      const keyBits = publicKey.n.bitLength();
      if(keyBits !== DEFAULT_RSA_KEY_BITS) {
        throw new Error(`Invalid RSA keyBit length ${JSON.stringify(keyBits)}` +
          ` required value is ${DEFAULT_RSA_KEY_BITS}`);
      }
      if(publicKey.e.toString(10) !== '65537') {
        throw new Error(
          `Invalid RSA exponent ${JSON.stringify(publicKey.e.toString(10))}` +
          ' required value is 65537}');
      }
    }

    if(this.privateKeyPem) {
      const privateKey = forge.pki.privateKeyFromPem(this.privateKeyPem);
      const keyBits = privateKey.n.bitLength();
      if(keyBits !== DEFAULT_RSA_KEY_BITS) {
        throw new Error(`Invalid RSA keyBit length ${JSON.stringify(keyBits)}` +
          ` required value is ${DEFAULT_RSA_KEY_BITS}`);
      }
      if(privateKey.e.toString(10) !== '65537') {
        throw new Error(
          `Invalid RSA exponent ${JSON.stringify(privateKey.e.toString(10))}` +
          ' required value is 65537}');
      }
    }
  }

  /**
   * Adds this KeyPair's publicKeyPem to a public node.
   * @example
   * > rsaKeyPair.addEncodedPublicKey({id: 'testnode'});
   * { publicKeyPem: 'testPublicKey' }
   * @param {KeyPairOptions} publicKeyNode - A Node with out a publicKeyPem set.
   *
   * @returns {KeyPairOptions} A public node with a publicKeyPem set.
   * @see [KeyPairOptions]{@link ./index.md#KeyPairOptions}
   */
  addEncodedPublicKey(publicKeyNode) {
    publicKeyNode.publicKeyPem = this.publicKeyPem;
    return publicKeyNode;
  }
  /**
   * Adds this KeyPair's privateKeyPem to a public node.
   * @example
   * > rsaKeyPair.addEncryptedPrivateKey({id: 'testnode'});
   * { privateKeyPem: 'testPrivateKey' }
   * @param {KeyPairOptions} keyNode - A Node with out a publicKeyPem set.
   *
   * @returns {KeyPairOptions} A public node with a privateKeyPem set.
   * @see [KeyPairOptions]{@link ./index.md#KeyPairOptions}
   */
  async addEncryptedPrivateKey(keyNode) {
    if(this.passphrase !== null) {
      keyNode.privateKeyPem = forge.pki.encryptRsaPrivateKey(
        forge.pki.privateKeyFromPem(this.privateKeyPem),
        this.passphrase,
        {algorithm: 'aes256'}
      );
    } else {
      // no passphrase, do not encrypt private key
      keyNode.privateKeyPem = this.privateKeyPem;
    }
    return keyNode;
  }

  /**
   * Generates and returns a multiformats
   * encoded RSA public key fingerprint (for use with cryptonyms, for example).
   * @example
   * > rsaKeyPair.fingerprint();
   * 3423dfdsf3432sdfdsds
   *
   * @returns {string} An RSA fingerprint.
   */
  fingerprint() {
    const buffer = forge.util.createBuffer();

    // use SubjectPublicKeyInfo fingerprint
    const fingerprintBuffer = forge.pki.getPublicKeyFingerprint(
      forge.pki.publicKeyFromPem(this.publicKeyPem),
      {md: sha256.create()});
    // RSA cryptonyms are multiformats encoded values, specifically they are:
    // (multicodec RSA SPKI-based public key 0x5d + sha2-256 0x12 +
    // 32 byte value 0x20)
    buffer.putBytes(forge.util.hexToBytes('5d1220'));
    buffer.putBytes(fingerprintBuffer.bytes());

    // prefix with `z` to indicate multi-base base58btc encoding
    return `z${base58.encode(buffer)}`;
  }

  /*
   * Tests whether the fingerprint
   * was generated from a given key pair.
   * @example
   * > rsaKeyPair.verifyFingerprint('zdsfdsfsdfdsfsd34234');
   * {valid: true}
   * @param {string} fingerprint - An RSA fingerprint for a key.
   *
   * @returns {boolean} True if the fingerprint is verified.
   */
  verifyFingerprint(fingerprint) {
    // fingerprint should have `z` prefix indicating
    // that it's multi-base encoded
    if(!(typeof fingerprint === 'string' && fingerprint[0] === 'z')) {
      return {
        error: new Error('`fingerprint` must be a multibase encoded string.'),
        valid: false
      };
    }
    // base58.decode returns Buffer(nodejs) or Uint8Array
    const fingerprintBuffer = base58.decode(fingerprint.slice(1));
    // keyFingerprintBuffer is a forge ByteStringBuffer
    const keyFingerprintBuffer = getPublicKeyFingerprint(
      publicKeyFromPem(this.publicKeyPem), {md: sha256.create()});

    // validate the first three multicodec bytes 0x5d1220
    const valid = fingerprintBuffer.slice(0, 3).toString('hex') === '5d1220' &&
      keyFingerprintBuffer.toHex() ===
      fingerprintBuffer.slice(3).toString('hex');
    if(!valid) {
      return {
        error: new Error('The fingerprint does not match the public key.'),
        valid: false
      };
    }

    return {valid};
  }

  /* eslint-disable max-len */
  /**
   * Returns a signer object with an async sign function for use by
   * [jsonld-signatures]{@link https://github.com/digitalbazaar/jsonld-signatures}
   * to sign content in a signature.
   * @example
   * > const signer = rsaKeyPair.signer();
   * > signer.sign({data});
   *
   * @returns {{sign: Function}} An RSA Signer Function for a single key.
   * for a single Private Key.
   */
  /* eslint-enable */
  signer() {
    return rsaSignerFactory(this);
  }

  /* eslint-disable max-len */
  /**
   * Returns a verifier object with an async
   * function verify for use with
   * [jsonld-signatures]{@link https://github.com/digitalbazaar/jsonld-signatures}.
   * @example
   * > const verifier = rsaKeyPair.verifier();
   * > const valid = await verifier.verify({data, signature});
   *
   * @returns {{verify: Function}} An RSA Verifier Function for a single key.
   */
  /* eslint-enable */
  verifier() {
    return rsaVerifierFactory(this);
  }
}

/**
 * @ignore
 * Returns an object with an async sign function.
 * The sign function is bound to the KeyPair
 * and then returned by the KeyPair's signer method.
 * @example
 * > const factory = rsaSignerFactory(rsaKeyPair);
 * > const bytes = await factory.sign({data});
 * @param {RSAKeyPair} key - They key this factory will verify for.
 *
 * @returns {{sign: Function}} An RSA Verifier Function for a single key.
 */
function rsaSignerFactory(key) {
  if(!key.privateKeyPem) {
    return {
      async sign() {
        throw new Error('No private key to sign with.');
      }
    };
  }

  // browser or other environment (including node 6.x)
  const privateKey = forge.pki.privateKeyFromPem(key.privateKeyPem);
  return {
    async sign({data}) {
      const pss = createPss();
      const md = sha256.create();
      md.update(raw.encode(data), 'binary');
      const binaryString = privateKey.sign(md, pss);
      return raw.decode(binaryString);
    }
  };
}

/**
 * @ignore
 * Returns an object with an async verify function.
 * The verify function is bound to the KeyPair
 * and then returned by the KeyPair's verifier method.
 * @example
 * > const verifier = rsaVerifierFactory(rsaKeyPair);
 * > verifier.verify({data, signature});
 * false
 * @param {RSAKeyPair} key - An RSAKeyPair.
 *
 * @returns {Function} An RSA Verifier for the key pair passed in.
 */
function rsaVerifierFactory(key) {
  // browser or other environment (including node 6.x)
  const publicKey = publicKeyFromPem(key.publicKeyPem);
  return {
    async verify({data, signature}) {
      const pss = createPss();
      const md = sha256.create();
      md.update(raw.encode(data), 'binary');
      try {
        return publicKey.verify(
          md.digest().bytes(),
          raw.encode(signature),
          pss);
      } catch(e) {
        console.log(e);
        // simply return false, do return information about malformed signature
        return false;
      }
    }
  };
}

/**
 * @ignore
 * creates an RSA PSS used in signatures.
 * @example
 * > const pss = createPss();
 *
 * @returns {PSS} A PSS object.
 * @see [PSS]{@link ./index.md#PSS}
 */
function createPss() {
  const md = sha256.create();
  return forge.pss.create({
    md,
    mgf: forge.mgf.mgf1.create(sha256.create()),
    saltLength: md.digestLength
  });
}

