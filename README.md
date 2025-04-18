# Cryptography Lab

An interactive web application for learning and experimenting with different cryptographic techniques. Built with React, TypeScript, and the Web Crypto API.

## Features

### 1. Symmetric Encryption (AES-GCM)

The symmetric encryption tab demonstrates AES-GCM encryption with a 256-bit key:

- Enter a custom encryption key or let the system generate a random one
- Encrypt any text message
- View the encrypted message and encryption key
- Decrypt messages using either:
  - The provided encryption key
  - Your own custom key
- Includes IV (Initialization Vector) for enhanced security

### 2. Asymmetric Encryption (RSA-OAEP)

The asymmetric encryption tab showcases RSA-OAEP encryption with 4096-bit keys:

- Generate public/private key pairs
- Edit or import existing keys
- Encrypt messages using the public key
- Decrypt messages using the private key
- Copy keys and encrypted messages to clipboard
- Secure key management with PEM format

### 3. Digital Signatures (RSA-PSS)

The digital signatures tab demonstrates RSA-PSS signatures with SHA-256:

- Generate signing key pairs
- Sign messages with the private key
- Verify signatures using the public key
- View message digests (SHA-256 hashes)
- Compare original and verification digests
- Full signature validation workflow

## Security Features

- Uses Web Crypto API for cryptographic operations
- Implements secure key generation
- Proper IV handling for symmetric encryption
- Strong key sizes (256-bit AES, 4096-bit RSA)
- PEM format for key storage
- Message digest verification

## How to Use

1. **Symmetric Encryption**:
   - Optional: Enter a custom encryption key
   - Type your message
   - Click "Encrypt Message"
   - Copy the encrypted message and key
   - To decrypt: Paste the encrypted message and key, then click "Decrypt"
   - Use custom key option for decryption with your own key

2. **Asymmetric Encryption**:
   - Generate a new key pair or import existing keys
   - Enter your message
   - Click "Encrypt Message"
   - Share the encrypted message and public key
   - To decrypt: Use the private key with the encrypted message
   - Edit keys as needed using the edit buttons

3. **Digital Signatures**:
   - Generate a new key pair or import existing keys
   - Enter the message to sign
   - Click "Sign Message"
   - View the signature and message digest
   - To verify: Enter the original message, signature, and public key
   - Check both signature validity and digest matching

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Security Notes

- Keep private keys secure and never share them
- Use strong, unique keys for symmetric encryption
- Verify signatures with trusted public keys
- Always use fresh IVs for symmetric encryption
- Protect sensitive data during transmission