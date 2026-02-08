import React, { useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { createProof, verifyProof } from '../services/apiClient';

const DEFAULT_USER_ID = '123';

function AuthScreen({ route }) {
  const userId = useMemo(() => route?.params?.userId || DEFAULT_USER_ID, [route?.params?.userId]);

  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [proofPayload, setProofPayload] = useState('');
  const [displayQrcode, setDisplayQrcode] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateProof(claimType) {
    setIsSubmitting(true);
    try {
      const response = await createProof({ id: userId, type: claimType });
      setQrcodeUrl(response.qrcUrl || '');
      setProofPayload(response.proof || '');
      setDisplayQrcode(true);
      setIsError(false);
      setMessage(response.message || 'Proof created successfully');
    } catch (error) {
      setIsError(true);
      setMessage(error.message || 'Failed to create proof');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelfVerify() {
    if (!proofPayload) {
      setIsError(true);
      setMessage('No proof available. Please create a proof first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyProof({
        id: userId,
        proof: proofPayload,
      });

      setIsError(false);
      setMessage(response.message || 'Verify success');
      alert(response.message || 'Verify success');
    } catch (error) {
      setIsError(true);
      setMessage(error.message || 'Verify failed');
      alert(error.message || 'Verify failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetProofView() {
    setDisplayQrcode(false);
    setMessage('');
  }

  function renderMessage() {
    if (!message) {
      return null;
    }

    const label = isError ? 'Error: ' : 'Success: ';
    return `${label}${message}`;
  }

  return (
    <View style={styles.box}>
      {displayQrcode ? (
        <>
          <Image source={{ uri: qrcodeUrl || undefined }} style={styles.QRCode} />
          <Text style={[styles.message, { color: isError ? 'red' : 'green' }]}>{renderMessage()}</Text>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSelfVerify}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>Verify It</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={resetProofView}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.heading}>What would you like to prove?</Text>
          <View style={styles.form}>
            <Text style={[styles.message, { color: isError ? 'red' : 'green' }]}>{renderMessage()}</Text>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleCreateProof('age')}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Am I 18 or above?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleCreateProof('drive')}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Am I able to drive?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleCreateProof('profession')}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Am I a student?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: '80%',
    borderRadius: 20,
    maxHeight: 380,
    paddingBottom: '20%',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: '15%',
    marginTop: '5%',
    color: 'black',
  },
  form: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: '5%',
    marginLeft: '15%',
  },
  button: {
    width: '80%',
    backgroundColor: 'black',
    height: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  message: {
    fontSize: 16,
    marginVertical: '5%',
  },
  QRCode: {
    flex: 1,
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    maxWidth: width * 0.9,
  },
});

export default AuthScreen;
