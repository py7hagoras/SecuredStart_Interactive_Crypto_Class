import React, { useState } from 'react';
import { Lock, Unlock, Copy, CheckCircle, Edit2, X, Check } from 'lucide-react';

interface EncryptionResult {
  encrypted: string;
  decrypted?: string;
  key?: string;
  iv?: string;
}

interface SymmetricDemoProps {
  savedKey: string | null;
  result: EncryptionResult | null;
  onStateChange: (key: string | null, result: EncryptionResult | null) => void;
}

const SymmetricDemo: React.FC<SymmetricDemoProps> = ({ savedKey, result, onStateChange }) => {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [decryptInput, setDecryptInput] = useState({ message: '', key: '', customKey: '' });
  const [customKey, setCustomKey] = useState(savedKey || '');
  const [useCustomKeyForDecryption, setUseCustomKeyForDecryption] = useState(false);

  const handleEncryption = async () => {
    try {
      let key;
      if (customKey) {
        // Use custom key if provided
        const encoder = new TextEncoder();
        const keyData = encoder.encode(customKey);
        // Hash the custom key to ensure it's always 256 bits
        const hash = await crypto.subtle.digest('SHA-256', keyData);
        key = await crypto.subtle.importKey(
          'raw',
          hash,
          'AES-GCM',
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate a new random key if no custom key
        key = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        messageBuffer
      );

      const exportedKey = await crypto.subtle.exportKey('raw', key);
      
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
      const ivBase64 = btoa(String.fromCharCode(...iv));

      onStateChange(customKey || keyBase64, {
        encrypted: `${encryptedBase64}.${ivBase64}`,
        key: keyBase64
      });
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  };

  const handleDecryption = async (encryptedBase64: string, keyBase64: string, customKeyForDecryption: string) => {
    try {
      const [ciphertext, ivBase64] = encryptedBase64.split('.');
      
      let keyBytes;
      if (useCustomKeyForDecryption) {
        // If using custom key for decryption, hash it first
        const encoder = new TextEncoder();
        const keyData = encoder.encode(customKeyForDecryption);
        keyBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', keyData));
      } else {
        // Otherwise use the provided key directly
        keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
      }

      const encryptedBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        encryptedBytes
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return 'Decryption failed. Please check your key and encrypted message.';
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <h2 className="text-3xl font-bold text-indigo-900">Symmetric Encryption</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">About</h3>
          <p className="text-gray-600">
            This implementation uses AES-GCM with a 256-bit key and 96-bit IV. You can either 
            provide your own encryption key or let the system generate a random one.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Encryption Key (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={customKey}
                onChange={(e) => {
                  const newKey = e.target.value;
                  setCustomKey(newKey);
                  onStateChange(newKey, result);
                }}
                placeholder="Enter a custom key or leave empty for random key"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Encrypt
            </label>
            <textarea
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
            />
          </div>

          <button
            onClick={handleEncryption}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
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
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                  {result.encrypted}
                </p>
              </div>

              {!customKey && result.key && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Encryption Key:</span>
                    <button
                      onClick={() => copyToClipboard(result.key || '')}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-sm font-mono break-all bg-white p-4 rounded border">
                    {result.key}
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Decrypt a Message</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encrypted Message (with IV)
                    </label>
                    <textarea
                      className="w-full p-4 border rounded-lg"
                      placeholder="Enter encrypted message with IV (format: encrypted.iv)"
                      value={decryptInput.message}
                      onChange={(e) => setDecryptInput(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useCustomKey"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={useCustomKeyForDecryption}
                      onChange={(e) => setUseCustomKeyForDecryption(e.target.checked)}
                    />
                    <label htmlFor="useCustomKey" className="ml-2 block text-sm text-gray-900">
                      Use custom key for decryption
                    </label>
                  </div>

                  {useCustomKeyForDecryption ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Decryption Key
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 border rounded-lg"
                        placeholder="Enter custom decryption key"
                        value={decryptInput.customKey}
                        onChange={(e) => setDecryptInput(prev => ({ ...prev, customKey: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decryption Key
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 border rounded-lg"
                        placeholder="Enter key"
                        value={decryptInput.key}
                        onChange={(e) => setDecryptInput(prev => ({ ...prev, key: e.target.value }))}
                      />
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const decrypted = await handleDecryption(
                        decryptInput.message,
                        decryptInput.key,
                        decryptInput.customKey
                      );
                      onStateChange(customKey || savedKey, { ...result!, decrypted });
                    }}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700"
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
        </div>
      </div>
    </div>
  );
};

export default SymmetricDemo;