import React, { useState } from 'react';
import { KeyRound, KeySquare, FileSignature } from 'lucide-react';
import SymmetricDemo from './components/SymmetricDemo';
import AsymmetricDemo from './components/AsymmetricDemo';
import SignatureDemo from './components/SignatureDemo';

type View = 'symmetric' | 'asymmetric' | 'signature';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface EncryptionResult {
  encrypted: string;
  decrypted?: string;
}

interface SignatureResult {
  message: string;
  signature: string;
  digest?: string;
  verified?: boolean;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('symmetric');
  
  // Persistent state for each component
  const [symmetricState, setSymmetricState] = useState<{
    key: string | null;
    result: EncryptionResult | null;
  }>({
    key: null,
    result: null
  });

  const [asymmetricState, setAsymmetricState] = useState<{
    keyPair: KeyPair | null;
    result: EncryptionResult | null;
  }>({
    keyPair: null,
    result: null
  });

  const [signatureState, setSignatureState] = useState<{
    keyPair: KeyPair | null;
    result: SignatureResult | null;
  }>({
    keyPair: null,
    result: null
  });

  const renderView = () => {
    switch (currentView) {
      case 'symmetric':
        return (
          <SymmetricDemo 
            savedKey={symmetricState.key}
            result={symmetricState.result}
            onStateChange={(key, result) => {
              setSymmetricState({ key, result });
            }}
          />
        );
      case 'asymmetric':
        return (
          <AsymmetricDemo 
            keyPair={asymmetricState.keyPair}
            result={asymmetricState.result}
            onStateChange={(keyPair, result) => {
              setAsymmetricState({ keyPair, result });
            }}
          />
        );
      case 'signature':
        return (
          <SignatureDemo 
            keyPair={signatureState.keyPair}
            result={signatureState.result}
            onStateChange={(keyPair, result) => {
              setSignatureState({ keyPair, result });
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-indigo-900">
                  Cryptography Lab
                </h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setCurrentView('symmetric')}
            className={`p-6 rounded-lg shadow-md flex items-center justify-center space-x-2 transition-all
              ${currentView === 'symmetric' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
          >
            <KeyRound size={24} />
            <span className="text-lg font-semibold">Symmetric Encryption</span>
          </button>

          <button
            onClick={() => setCurrentView('asymmetric')}
            className={`p-6 rounded-lg shadow-md flex items-center justify-center space-x-2 transition-all
              ${currentView === 'asymmetric' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-green-600 hover:bg-green-50'}`}
          >
            <KeySquare size={24} />
            <span className="text-lg font-semibold">Asymmetric Encryption</span>
          </button>

          <button
            onClick={() => setCurrentView('signature')}
            className={`p-6 rounded-lg shadow-md flex items-center justify-center space-x-2 transition-all
              ${currentView === 'signature' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-purple-600 hover:bg-purple-50'}`}
          >
            <FileSignature size={24} />
            <span className="text-lg font-semibold">Digital Signatures</span>
          </button>
        </div>

        {renderView()}
      </div>
    </div>
  );
}

export default App;