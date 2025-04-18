import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, KeySquare, RefreshCw, Copy, CheckCircle, FileSignature } from 'lucide-react';

interface EncryptionResult {
  encrypted: string;
  decrypted?: string;
  key?: string;
  publicKey?: string;
  privateKey?: string;
}

interface SignatureResult {
  message: string;
  signature: string;
  publicKey: string;
  privateKey: string;
  verified?: boolean;
}

const CryptoDemo: React.FC = () => {
  const [message, setMessage] = useState('');
  const [symmetricResult, setSymmetricResult] = useState<EncryptionResult | null>(null);
  const [asymmetricResult, setAsymmetricResult] = useState<EncryptionResult | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [decryptInput, setDecryptInput] = useState({ message: '', key: '' });
  const [verifyInput, setVerifyInput] = useState({ message: '', signature: '', publicKey: '' });

  // Symmetric encryption using AES-GCM
  const handleSymmetricEncryption = async () => {
    try {
      const keyBuffer = crypto.getRandomValues(new Uint8Array(32));
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        messageBuffer
      );

      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const keyBase64 = btoa(String.fromCharCode(...keyBuffer));

      setSymmetricResult({
        encrypted: `${encryptedBase64}.${ivBase64}`,
        key: keyBase64
      });
    } catch (error) {
      console.error('Symmetric encryption failed:', error);
    }
  };

  const handleSymmetricDecryption = async (encryptedMessage: string, keyBase64: string) => {
    try {
      const [encryptedBase64, ivBase64] = encryptedMessage.split('.');
      
      const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      );

      const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Symmetric decryption failed:', error);
      return 'Decryption failed';
    }
  };

  const handleAsymmetricEncryption = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        keyPair.publicKey,
        messageBuffer
      );

      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

      setAsymmetricResult({
        encrypted: encryptedBase64,
        publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
        privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`
      });
    } catch (error) {
      console.error('Asymmetric encryption failed:', error);
    }
  };

  const handleAsymmetricDecryption = async (encryptedBase64: string, privateKeyPEM: string) => {
    try {
      const privateKeyBase64 = privateKeyPEM
        .replace('-----BEGIN PRIVATE KEY-----\n', '')
        .replace('\n-----END PRIVATE KEY-----', '');
      
      const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
      
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['decrypt']
      );

      const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Asymmetric decryption failed:', error);
      return 'Decryption failed';
    }
  };

  const handleSignMessage = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-PSS",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );

      const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
      
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        keyPair.privateKey,
        messageBuffer
      );

      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

      setSignatureResult({
        message,
        signature: signatureBase64,
        publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
        privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`
      });
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  const handleVerifySignature = async (message: string, signatureBase64: string, publicKeyPEM: string) => {
    try {
      const publicKeyBase64 = publicKeyPEM
        .replace('-----BEGIN PUBLIC KEY-----\n', '')
        .replace('\n-----END PUBLIC KEY-----', '');
      
      const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
      
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        true,
        ['verify']
      );

      const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const isValid = await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        signatureBuffer,
        messageBuffer
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">
          Interactive Cryptography Learning Lab
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Message Input</h2>
          <textarea
            className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Symmetric Encryption */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <KeyRound className="text-indigo-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Symmetric</h2>
            </div>
            <p className="text-gray-600 mb-4">
              AES-GCM with 256-bit key
            </p>
            <button
              onClick={handleSymmetricEncryption}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center mb-4"
            >
              <Lock className="mr-2" size={20} />
              Encrypt
            </button>
            
            {symmetricResult && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Encrypted:</span>
                    <button
                      onClick={() => copyToClipboard(symmetricResult.encrypted)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{symmetricResult.encrypted}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Key:</span>
                    <button
                      onClick={() => copyToClipboard(symmetricResult.key || '')}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{symmetricResult.key}</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Decrypt</h3>
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="Enter encrypted message"
                      value={decryptInput.message}
                      onChange={(e) => setDecryptInput(prev => ({ ...prev, message: e.target.value }))}
                    />
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Enter key"
                      value={decryptInput.key}
                      onChange={(e) => setDecryptInput(prev => ({ ...prev, key: e.target.value }))}
                    />
                    <button
                      onClick={async () => {
                        const decrypted = await handleSymmetricDecryption(decryptInput.message, decryptInput.key);
                        setSymmetricResult(prev => ({ ...prev!, decrypted }));
                      }}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                    >
                      <Unlock className="inline mr-2" size={16} />
                      Decrypt
                    </button>
                  </div>
                  {symmetricResult.decrypted && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-green-700">Decrypted: {symmetricResult.decrypted}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Asymmetric Encryption */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <KeySquare className="text-green-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Asymmetric</h2>
            </div>
            <p className="text-gray-600 mb-4">
              RSA-OAEP with 4096-bit keys
            </p>
            <button
              onClick={handleAsymmetricEncryption}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center mb-4"
            >
              <Lock className="mr-2" size={20} />
              Encrypt
            </button>
            
            {asymmetricResult && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Encrypted:</span>
                    <button
                      onClick={() => copyToClipboard(asymmetricResult.encrypted)}
                      className="text-green-600 hover:text-green-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{asymmetricResult.encrypted}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Public Key:</span>
                    <button
                      onClick={() => copyToClipboard(asymmetricResult.publicKey || '')}
                      className="text-green-600 hover:text-green-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{asymmetricResult.publicKey}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Private Key:</span>
                    <button
                      onClick={() => copyToClipboard(asymmetricResult.privateKey || '')}
                      className="text-green-600 hover:text-green-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{asymmetricResult.privateKey}</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Decrypt</h3>
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="Enter encrypted message"
                      value={decryptInput.message}
                      onChange={(e) => setDecryptInput(prev => ({ ...prev, message: e.target.value }))}
                    />
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="Enter private key"
                      value={decryptInput.key}
                      onChange={(e) => setDecryptInput(prev => ({ ...prev, key: e.target.value }))}
                    />
                    <button
                      onClick={async () => {
                        const decrypted = await handleAsymmetricDecryption(decryptInput.message, decryptInput.key);
                        setAsymmetricResult(prev => ({ ...prev!, decrypted }));
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    >
                      <Unlock className="inline mr-2" size={16} />
                      Decrypt
                    </button>
                  </div>
                  {asymmetricResult.decrypted && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-green-700">Decrypted: {asymmetricResult.decrypted}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Digital Signatures */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <FileSignature className="text-purple-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Signatures</h2>
            </div>
            <p className="text-gray-600 mb-4">
              RSA-PSS with 4096-bit keys
            </p>
            <button
              onClick={handleSignMessage}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center mb-4"
            >
              <FileSignature className="mr-2" size={20} />
              Sign Message
            </button>
            
            {signatureResult && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Message:</span>
                    <button
                      onClick={() => copyToClipboard(signatureResult.message)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{signatureResult.message}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Signature:</span>
                    <button
                      onClick={() => copyToClipboard(signatureResult.signature)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{signatureResult.signature}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Public Key:</span>
                    <button
                      onClick={() => copyToClipboard(signatureResult.publicKey)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all">{signatureResult.publicKey}</p>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Verify Signature</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Enter message"
                      value={verifyInput.message}
                      onChange={(e) => setVerifyInput(prev => ({ ...prev, message: e.target.value }))}
                    />
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="Enter signature"
                      value={verifyInput.signature}
                      onChange={(e) => setVerifyInput(prev => ({ ...prev, signature: e.target.value }))}
                    />
                    <textarea
                      className="w-full p-2 border rounded"
                      placeholder="Enter public key"
                      value={verifyInput.publicKey}
                      onChange={(e) => setVerifyInput(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                    <button
                      onClick={async () => {
                        const verified = await handleVerifySignature(
                          verifyInput.message,
                          verifyInput.signature,
                          verifyInput.publicKey
                        );
                        setSignatureResult(prev => ({ ...prev!, verified }));
                      }}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                    >
                      <CheckCircle className="inline mr-2" size={16} />
                      Verify
                    </button>
                  </div>
                  {signatureResult.verified !== undefined && (
                    <div className={`mt-2 p-2 rounded ${signatureResult.verified ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={signatureResult.verified ? 'text-green-700' : 'text-red-700'}>
                        Signature is {signatureResult.verified ? 'valid' : 'invalid'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Educational Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Learning Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-600">Symmetric Encryption</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Uses the same key for encryption and decryption</li>
                <li>Faster than asymmetric encryption</li>
                <li>Ideal for large data</li>
                <li>Uses AES-GCM mode</li>
                <li>256-bit key length</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2 text-green-600">Asymmetric Encryption</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Uses public/private key pairs</li>
                <li>RSA-OAEP algorithm</li>
                <li>4096-bit keys</li>
                <li>Perfect for key exchange</li>
                <li>Slower but more secure</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Digital Signatures</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Ensures message authenticity</li>
                <li>Uses RSA-PSS algorithm</li>
                <li>4096-bit keys</li>
                <li>Provides non-repudiation</li>
                <li>Verifiable by anyone</li>
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Suggested Exercises</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Try encrypting the same message multiple times - notice how the output changes</li>
              <li>Exchange encrypted messages with others using both methods</li>
              <li>Sign messages and verify signatures to understand authentication</li>
              <li>Try modifying a signed message to see how verification fails</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDemo;