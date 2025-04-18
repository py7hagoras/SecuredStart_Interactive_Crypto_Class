import React, { useState } from 'react';
import { Lock, Unlock, Copy, CheckCircle, KeySquare, Edit2, X, Check } from 'lucide-react';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface EncryptionResult {
  encrypted: string;
  decrypted?: string;
}

interface AsymmetricDemoProps {
  keyPair: KeyPair | null;
  result: EncryptionResult | null;
  onStateChange: (keyPair: KeyPair | null, result: EncryptionResult | null) => void;
}

const AsymmetricDemo: React.FC<AsymmetricDemoProps> = ({ keyPair, result, onStateChange }) => {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [decryptInput, setDecryptInput] = useState({ message: '', key: '' });
  const [editingPublicKey, setEditingPublicKey] = useState(false);
  const [editingPrivateKey, setEditingPrivateKey] = useState(false);
  const [tempPublicKey, setTempPublicKey] = useState('');
  const [tempPrivateKey, setTempPrivateKey] = useState('');

  const generateKeyPair = async () => {
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

      const newKeyPair = {
        publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`,
        privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`
      };
      
      onStateChange(newKeyPair, result);
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  };

  const handleEncryption = async () => {
    if (!keyPair) return;

    try {
      const publicKeyBase64 = keyPair.publicKey
        .replace('-----BEGIN PUBLIC KEY-----\n', '')
        .replace('\n-----END PUBLIC KEY-----', '');
      
      const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
      
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );

      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        messageBuffer
      );

      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

      onStateChange(keyPair, { encrypted: encryptedBase64 });
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  };

  const handleDecryption = async (encryptedBase64: string, privateKeyPEM: string) => {
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
      console.error('Decryption failed:', error);
      return 'Decryption failed';
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
          <h2 className="text-3xl font-bold text-green-900">Asymmetric Encryption</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">About</h3>
          <p className="text-gray-600">
            Asymmetric encryption uses a pair of keys: a public key for encryption and a private 
            key for decryption. This implementation uses RSA-OAEP with 4096-bit keys, providing 
            robust security for sensitive data transmission.
          </p>
        </div>

        <div className="space-y-6">
          {!keyPair && (
            <button
              onClick={generateKeyPair}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
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
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(keyPair.publicKey)}
                          className="text-green-600 hover:text-green-800"
                        >
                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </>
                    )}
                    {editingPublicKey && (
                      <>
                        <button
                          onClick={handleSavePublicKey}
                          className="text-green-600 hover:text-green-800"
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
                    className="w-full text-sm font-mono p-4 rounded border focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(keyPair.privateKey)}
                          className="text-green-600 hover:text-green-800"
                        >
                          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        </button>
                      </>
                    )}
                    {editingPrivateKey && (
                      <>
                        <button
                          onClick={handleSavePrivateKey}
                          className="text-green-600 hover:text-green-800"
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
                    className="w-full text-sm font-mono p-4 rounded border focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  Message to Encrypt
                </label>
                <textarea
                  className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                />
              </div>

              <button
                onClick={handleEncryption}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Lock className="mr-2" size={20} />
                Encrypt Message
              </button>

              {result && (
                <div className="space-y-6 mt-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Encrypted Message:</span>
                      <button
                        onClick={() => copyToClipboard(result.encrypted)}
                        className="text-green-600 hover:text-green-800"
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                      {result.encrypted}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Decrypt a Message</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encrypted Message
                        </label>
                        <textarea
                          className="w-full p-4 border rounded-lg"
                          placeholder="Enter encrypted message"
                          value={decryptInput.message}
                          onChange={(e) => setDecryptInput(prev => ({ ...prev, message: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Private Key
                        </label>
                        <textarea
                          className="w-full p-4 border rounded-lg"
                          placeholder="Enter private key"
                          value={decryptInput.key}
                          onChange={(e) => setDecryptInput(prev => ({ ...prev, key: e.target.value }))}
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const decrypted = await handleDecryption(decryptInput.message, decryptInput.key);
                          onStateChange(keyPair, { ...result, decrypted });
                        }}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700"
                      >
                        <Unlock className="inline mr-2" size={16} />
                        Decrypt Message
                      </button>
                    </div>
                    {result.decrypted && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Decrypted Message:</h4>
                        <p className="text-green-700">{result.decrypted}</p>
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

export default AsymmetricDemo;