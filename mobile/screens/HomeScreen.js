import React, { useState, useEffect,Fragment } from 'react';
import { View, Text, Image, Platform, TouchableOpacity, StyleSheet, Dimensions, Button } from 'react-native';

// import {BarCodeScanner} from "expo-barcode-scanner";
// import { CameraView, Camera } from "expo-camera/next";
import Constants from 'expo-constants';

const API_URL = Platform.OS === 'ios' ? 'http://10.1.1.164:3000' : 'http://localhost:3000';

const HomeScreen = ({navigation}) =>{
    const [url, setUrl] = useState('');
    const [displayProfile, setDisplayProfile] = useState(true);

    useEffect(() => {
        const id = "123";
        const payload = {
            id,
        };

        fetch(`${API_URL}/cmt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
         .then(async res =>{
            try{
                const jsonRes = await res.json();
                if(res.status === 200){
                    setUrl(jsonRes.qrcUrl);
                    // setLoading(false);
                }else{

                }
            } catch (err) {
                console.log(err);
            };
        });

        }, [])

    return (
    <View style={styles.box}>   
        <View style={styles.card}>
        <Text style={styles.heading}>Mary</Text>
        <Text style={styles.content}>ID: 123</Text>
        <Image source={{uri: url !== "" ? url : undefined}} style={styles.QRCode} ></Image>
        <View style={styles.form}>
            {displayProfile && 
                <TouchableOpacity style={styles.button} onPress={()=>{
                    navigation.navigate('Auth', {name: '111'}) 
                }}>
                    <Text style={styles.buttonText}>Go to Detail</Text>
                </TouchableOpacity>
            }
        </View>
        </View>
    </View>
    );
  }
  
  const styles = StyleSheet.create({
      box:{
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
          textAlign:'center',
          marginTop: '5%',
          color: 'black',
      },
      content: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign:'center',
        color: 'black',
        marginBottom: '5%',
      },
      form: {
          flex: 1,
          justifyContent: 'space-between',
          paddingBottom: '5%',
          marginLeft: '15%',
          marginTop: '5%',
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
        fontWeight: '400'
    },
      QRCode: {
          flex: 1,
          width: '100%',
          height: '100%',
          resizeMode: 'contain',
      },
  });
  export default HomeScreen;