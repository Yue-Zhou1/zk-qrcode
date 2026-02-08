import React, { useMemo, useState } from 'react';
import { Button, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';

import {
  detectQrPayloadType,
  verifyIdentityQr,
  verifyProof,
} from '../services/apiClient';

const DEFAULT_USER_ID = '123';
const opacity = 'rgba(0, 0, 0, .4)';
const { width } = Dimensions.get('window');
const qrSize = width * 0.7;

function VerifyScreen({ route }) {
  const userId = useMemo(() => route?.params?.userId || DEFAULT_USER_ID, [route?.params?.userId]);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [displayCard, setDisplayCard] = useState(true);
  const [displayScan, setDisplayScan] = useState(false);
  const [message, setMessage] = useState('');

  function onScan() {
    setDisplayScan(true);
    setDisplayCard(false);
    setMessage('');
  }

  function onCancelScan() {
    setDisplayScan(false);
    setDisplayCard(true);
    setScanned(false);
  }

  async function onVerifyMerkleTree(rootPayload) {
    const response = await verifyIdentityQr({
      id: userId,
      root: rootPayload,
    });
    return response.message || 'User identity verified';
  }

  async function onVerifyProof(proofPayload) {
    const response = await verifyProof({
      id: userId,
      proof: proofPayload,
    });
    return response.message || 'Verify success';
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned) {
      return;
    }

    setScanned(true);

    const qrPayload = detectQrPayloadType(data);

    try {
      let resultMessage = '';
      if (qrPayload.type === 'proof') {
        resultMessage = await onVerifyProof(qrPayload.payload);
      } else if (qrPayload.type === 'identity-root') {
        resultMessage = await onVerifyMerkleTree(qrPayload.payload);
      } else {
        throw new Error('Unsupported QR payload format');
      }

      setMessage(resultMessage);
      alert(resultMessage);
      onCancelScan();
    } catch (error) {
      const failedMessage = error.message || 'Verification failed';
      setMessage(failedMessage);
      alert(failedMessage);
      onCancelScan();
    }
  }

  if (!permission) {
    return <View style={styles.box} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.box}>
        <Text style={styles.message}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {displayScan && (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={[StyleSheet.absoluteFillObject, styles.container]}
        >
          <Text style={styles.description}>Scan The QR code</Text>
          <View style={styles.qr} />
          <Text onPress={onCancelScan} style={styles.cancel}>
            Cancel
          </Text>
        </CameraView>
      )}

      {displayScan && scanned && <Button title="Tap to Scan Again" onPress={onCancelScan} />}

      {displayCard && (
        <View style={styles.card}>
          <View style={styles.form}>
            <TouchableOpacity style={styles.button} onPress={onScan}>
              <Text style={styles.buttonText}>Scan QRCode</Text>
            </TouchableOpacity>
            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}

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
    maxHeight: 480,
    paddingBottom: '10%',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
  message: {
    fontSize: 16,
    marginVertical: '5%',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    padding: 8,
  },
  qr: {
    marginTop: '10%',
    marginBottom: '20%',
    width: qrSize,
    height: qrSize,
    backgroundColor: opacity,
    borderWidth: 2,
    borderColor: 'red',
  },
  description: {
    fontSize: width * 0.09,
    marginTop: '5%',
    textAlign: 'center',
    width: '70%',
    color: 'green',
  },
  cancel: {
    fontSize: width * 0.05,
    textAlign: 'center',
    width: '70%',
    color: 'white',
  },
});

export default VerifyScreen;
