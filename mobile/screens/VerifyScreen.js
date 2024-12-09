import React, { useState, useEffect,Fragment } from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet, Dimensions, Button } from 'react-native';
// import {BarCodeScanner} from "expo-barcode-scanner";
import { CameraView, Camera } from "expo-camera";
import Constants from 'expo-constants';

const API_URL = Platform.OS === 'ios' ? 'http://10.1.1.164:3000' : 'http://localhost:3000';

const HomeScreen = ({navigation}) =>{
    const [hasPermission, setHasPermission] = useState(null);
    
    const [scanned, setScanned] = useState(false);
    const [displayCard, setDisplayCard] = useState(true);
    const [displayScan, setDisplayScan] = useState(false);

    const handleBarCodeScanned = ({type, data}) => {
        setScanned(true);
        onCancelScan();
        const qrcode = data.split("|")[1];
        // qrcode 1: Age Proof;
        // qrcode 2: Merkle Tree;
        switch(qrcode){
            case "1":
                onVerifyProof(data);
                break;
            case "2":
                onVerifyMerkleTree(data);
                break;
        }
    }

    const onScan = () =>{
        setDisplayScan(true);
        setDisplayCard(false);
    }

    const onCancelScan = () => {
        setDisplayScan(false);
        setDisplayCard(true);
        setScanned(false)
    }

    const onVerifyMerkleTree = (root) =>{
        const id = "123";
        const payload = {
            root,
            id,
        };
        fetch(`${API_URL}/vmt`, {
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
                    // setIsError(false);
                    alert(`${jsonRes.message}`);
                    onCancelScan();
                }else{
                    // setIsError(true);
                    alert(`${jsonRes.message}`);
                    onCancelScan();
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });
        
    }


    const onVerifyProof = (proof) =>{
        const id = "123";
        const payload = {
            proof,
            id,
        }
        fetch(`${API_URL}/vp`, {
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
                    // setIsError(false);
                    alert(`${jsonRes.message}`);
                    onCancelScan();
                    // setMessage(jsonRes.message);
                }else{
                    // setIsError(true);
                    alert(`${jsonRes.message}`);
                    onCancelScan();
                    // setMessage(jsonRes.message);
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });
        
    }

    return (
        <View style={styles.box}>
            {displayScan && 
                        <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{barcodeTypes: ["qr"],}}
                        style={[StyleSheet.absoluteFillObject, styles.container]}>
                        <Text style={styles.description}>Scan The QR code</Text>
                        <View
                            style={styles.qr}
                        />
                        <Text onPress={onCancelScan} style={styles.cancel}>
                            Cancel
                        </Text>
                        </CameraView>
                        }
            {displayScan && scanned && <Button title={'Tap to Scan Again'} onPress={onCancelScan}/>
                            }

            {displayCard &&
                        <View style={styles.card}>
                            <View style={styles.form}>
                                <TouchableOpacity style={styles.button} onPress={onScan}>
                                    <Text style={styles.buttonText}>Scan QRCode</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
            }

        </View>
    );
  }

  const opacity = 'rgba(0, 0, 0, .4)';
  const { width } = Dimensions.get('window');
  const qrSize = width * 0.7;
  
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
        fontWeight: '400'
    },
    message: {
        fontSize: 16,
        marginVertical: '5%',
    },
    QRCode: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
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
        backgroundColor:opacity,
        borderWidth:2,
        borderColor:'red',
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

  export default HomeScreen;