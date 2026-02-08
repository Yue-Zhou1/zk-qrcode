import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { createIdentityQr } from '../services/apiClient';

const DEFAULT_USER_ID = '123';

function HomeScreen({ navigation, route }) {
  const userId = useMemo(() => route?.params?.userId || DEFAULT_USER_ID, [route?.params?.userId]);

  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadIdentityQr() {
      try {
        const response = await createIdentityQr({ id: userId });
        if (!isMounted) return;

        setUrl(response.qrcUrl || '');
        setMessage(response.message || 'QR code loaded');
        setIsError(false);
      } catch (error) {
        if (!isMounted) return;

        setMessage(error.message || 'Failed to load identity QR');
        setIsError(true);
      }
    }

    loadIdentityQr();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <View style={styles.box}>
      <View style={styles.card}>
        <Text style={styles.heading}>User</Text>
        <Text style={styles.content}>ID: {userId}</Text>

        <Image source={{ uri: url || undefined }} style={styles.QRCode} />

        <Text style={[styles.message, { color: isError ? 'red' : 'green' }]}>{message}</Text>

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('Auth', { userId });
            }}
          >
            <Text style={styles.buttonText}>Go to Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '5%',
    color: 'black',
  },
  content: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginBottom: '5%',
  },
  form: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '3%',
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
    textAlign: 'center',
    marginTop: '2%',
    marginHorizontal: 20,
  },
  QRCode: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default HomeScreen;
