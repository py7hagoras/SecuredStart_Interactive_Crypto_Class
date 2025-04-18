import React, { useState } from 'react';
import { FileSignature, Copy, CheckCircle, KeySquare, Edit2, X, Check } from 'lucide-react';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface SignatureResult {
  message: string;
  signature: string;
  digest?: string;
  verified?: boolean;
  verificationDigest?: string;
}

interface SignatureDemoProps {
  keyPair: KeyPair | null;
  result: SignatureResult | null;
  onStateChange: (keyPair: KeyPair | null, result: SignatureResult | null) => void;
}

const SignatureDemo: React.FC<SignatureDemoProps> = ({ keyPair, result, onStateChange }) => {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifyInput, setVerifyInput] = useState({ message: '', signature: '', publicKey: '' });
  const [editingPublicKey, setEditingPublicKey] = useState(false);
  const [editingPrivateKey, setEditingPrivateKey] = useState(false);
  const [tempPublicKey, setTempPublicKey] = useState('');
  const [tempPrivateKey, setTempPrivateKey] = useState('');

  const generateKeyPair = async () => {
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

      const newKeyPair = {
        publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
        privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`
      };
      
      onStateChange(newKeyPair, result);
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  };

  const handleSignMessage = async () => {
    if (!keyPair) return;

    try {
      const privateKeyBase64 = keyPair.privateKey
        .replace('-----BEGIN PRIVATE KEY-----\n', '')
        .replace('\n-----END PRIVATE KEY-----', '');
      
      const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
      
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        true,
        ['sign']
      );

      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      // Generate message digest
      const digestBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
      const digestArray = Array.from(new Uint8Array(digestBuffer));
      const digestHex = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        messageBuffer
      );

      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

      onStateChange(keyPair, {
        message,
        signature: signatureBase64,
        digest: digestHex
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

      // Generate verification digest
      const digestBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
      const digestArray = Array.from(new Uint8Array(digestBuffer));
      const verificationDigest = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const isValid = await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        signatureBuffer,
        messageBuffer
      );

      return { isValid, verificationDigest };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return { isValid: false, verificationDigest: '' };
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditPublicKey = () => {
    setTempPublicKey(keyPair?.publicKey || '');
    setEditingPublicKey(true);
  };

  const handleEditPrivateKey = () => {
    setTempPrivateKey(keyPair?.privateKey || '');
    setEditingPrivateKey(true);
  };

  const handleSavePublicKey = () => {
    if (keyPair) {
      onStateChange(
        {
          ...keyPair,
          publicKey: tempPublicKey
        },
        result
      );
    }
    setEditingPublicKey(false);
  };

  const handleSavePrivateKey = () => {
    if (keyPair) {
      onStateChange(
        {
          ...keyPair,
          privateKey: tempPrivateKey
        },
        result
      );
    }
    setEditingPrivateKey(false);
  };

  const handleCancelEdit = (type: 'public' | 'private') => {
    if (type === 'public') {
      setEditingPublicKey(false);
      setTempPublicKey('');
    } else {
      setEditingPrivateKey(false);
      setTempPrivateKey('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <h2 className="text-3xl font-bold text-purple-900">Digital Signatures</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">About</h3>
          <p className="text-gray-600">
            Digital signatures provide authenticity and non-repudiation for messages. 
            This implementation uses RSA-PSS with 4096-bit keys and SHA-256 for message digests.
          </p>
        </div>

        <div className="space-y-6">
          {!keyPair && (
            <button
              onClick={generateKeyPair}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <KeySquare className="mr-2" size={20} />
              Generate Key Pair
            </button>
          )}

          {keyPair && (
            <>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Public Key:</span>
                  <div className="flex gap-2">
                    {!editingPublicKey && (
                      <>
                        <button
                          onClick={handleEditPublicKey}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(keyPair.publicKey)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </>
                    )}
                    {editingPublicKey && (
                      <>
                        <button
                          onClick={handleSavePublicKey}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit('public')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingPublicKey ? (
                  <textarea
                    className="w-full text-sm font-mono p-4 rounded border focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={tempPublicKey}
                    onChange={(e) => setTempPublicKey(e.target.value)}
                    rows={5}
                  />
                ) : (
                  <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                    {keyPair.publicKey}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Private Key:</span>
                  <div className="flex gap-2">
                    {!editingPrivateKey && (
                      <>
                        <button
                          onClick={handleEditPrivateKey}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(keyPair.privateKey)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </>
                    )}
                    {editingPrivateKey && (
                      <>
                        <button
                          onClick={handleSavePrivateKey}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelEdit('private')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingPrivateKey ? (
                  <textarea
                    className="w-full text-sm font-mono p-4 rounded border focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={tempPrivateKey}
                    onChange={(e) => setTempPrivateKey(e.target.value)}
                    rows={5}
                  />
                ) : (
                  <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                    {keyPair.privateKey}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Sign
                </label>
                <textarea
                  className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                />
              </div>

              <button
                onClick={handleSignMessage}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <FileSignature className="mr-2" size={20} />
                Sign Message
              </button>

              {result && (
                <div className="space-y-6 mt-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Original Message:</span>
                      <button
                        onClick={() => copyToClipboard(result.message)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                      {result.message}
                    </p>
                  </div>

                  {result.digest && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Message Digest (SHA-256):</span>
                        <button
                          onClick={() => copyToClipboard(result.digest!)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                        {result.digest}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Digital Signature:</span>
                      <button
                        onClick={() => copyToClipboard(result.signature)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                      {result.signature}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Verify a Signature</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Original Message
                        </label>
                        <input
                          type="text"
                          className="w-full p-4 border rounded-lg"
                          placeholder="Enter original message"
                          value={verifyInput.message}
                          onChange={(e) => setVerifyInput(prev => ({ ...prev, message: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Digital Signature
                        </label>
                        <textarea
                          className="w-full p-4 border rounded-lg"
                          placeholder="Enter signature"
                          value={verifyInput.signature}
                          onChange={(e) => setVerifyInput(prev => ({ ...prev, signature: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Public Key
                        </label>
                        <textarea
                          className="w-full p-4 border rounded-lg"
                          placeholder="Enter public key"
                          value={verifyInput.publicKey}
                          onChange={(e) => setVerifyInput(prev => ({ ...prev, publicKey: e.target.value }))}
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const { isValid, verificationDigest } = await handleVerifySignature(
                            verifyInput.message,
                            verifyInput.signature,
                            verifyInput.publicKey
                          );
                          onStateChange(keyPair, { 
                            ...result, 
                            verified: isValid,
                            verificationDigest
                          });
                        }}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700"
                      >
                        <CheckCircle className="inline mr-2" size={16} />
                        Verify Signature
                      </button>
                    </div>
                    {result.verified !== undefined && (
                      <div className="mt-4 space-y-4">
                        <div className={`p-4 rounded-lg ${result.verified ? 'bg-green-50' : 'bg-red-50'}`}>
                          <p className={result.verified ? 'text-green-700' : 'text-red-700'}>
                            Signature is {result.verified ? 'valid' : 'invalid'}
                          </p>
                        </div>
                        {result.verificationDigest && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Hash Comparison:</h4>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-gray-600">Original Message Digest:</p>
                                <p className="text-sm font-mono break-all bg-white p-2 rounded border">
                                  {result.digest}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Verification Message Digest:</p>
                                <p className="text-sm font-mono break-all bg-white p-2 rounded border">
                                  {result.verificationDigest}
                                </p>
                              </div>
                              <div className={`p-2 rounded ${result.digest === result.verificationDigest ? 'bg-green-50' : 'bg-red-50'}`}>
                                <p className={result.digest === result.verificationDigest ? 'text-green-700' : 'text-red-700'}>
                                  Message digests are {result.digest === result.verificationDigest ? 'identical' : 'different'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureDemo;