import React, { useState, useEffect,Fragment } from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, TextInput, Platform, Button, Keyboard, SafeAreaView, Dimensions } from 'react-native';
import Constants from 'expo-constants';

const API_URL = Platform.OS === 'ios' ? 'http://10.1.1.164:3000' : 'http://localhost:3000';

const AuthScreen = ({navigation, route}) =>{
    const [url, setUrl] = useState('');
    const [proof, setProof] = useState('');

    const [displayQrcode, setDisplayQrcode] = useState(true);
    const [displayCard, setDisplayCard] = useState(true);
    const [displayScan, setDisplayScan] = useState(false);
    
    const [isError, setIsError] = useState(false);
    const [message, setMessage] = useState('');
    const [isProof, setIsProof] = useState(true);

    const [age, setAge] = useState('');

    const onCreatedAgeProof = () =>{
        const id = "789";
        const type = "age";
        const payload = {
            id,
            type,
        };
        fetch(`${API_URL}/cp`, {
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
                    setProof(jsonRes.proof);

                    setDisplayQrcode(!displayQrcode);
                    setDisplayCard(!displayCard);

                    setIsError(false);
                    setMessage(jsonRes.message);
                }else{
                    setIsError(true);
                    setMessage(jsonRes.message);
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });
    }

    const onCreatedDriveProof = () =>{
        const id = "789";
        const type = "drive";
        const payload = {
            id,
            type,
        };
        fetch(`${API_URL}/cp`, {
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
                    setProof(jsonRes.proof);

                    setDisplayQrcode(!displayQrcode);
                    setDisplayCard(!displayCard);

                    setIsError(false);
                    setMessage(jsonRes.message);
                }else{
                    setIsError(true);
                    setMessage(jsonRes.message);
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });

    }

    const onCreatedProfessionProof = () =>{
        const id = "789";
        const type = "profession";
        const payload = {
            id,
            type,
        };
        fetch(`${API_URL}/cp`, {
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
                    setProof(jsonRes.proof);

                    setDisplayQrcode(!displayQrcode);
                    setDisplayCard(!displayCard);

                    setIsError(false);
                    setMessage(jsonRes.message);
                }else{
                    setIsError(true);
                    setMessage(jsonRes.message);
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });

    }

    const onSelfVerify = () =>{
        const id = "789";
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
                    setIsError(false);
                    alert(`${jsonRes.message}`);
                    setMessage(jsonRes.message);
                }else{
                    setIsError(true);
                    alert(`${jsonRes.message}`);
                    setMessage(jsonRes.message);
                }
            } catch (err) {
                console.log(err);
            };
        })
        .catch(err => {
            console.log(err);
        });
        
    }

    const updateUI = () => {
        setDisplayQrcode(!displayQrcode);
        setDisplayCard(!displayCard);
        setMessage('');
    }

    const getMessage = () => {
        const status = isError ? 'Error: ' : 'Success:';
        return status + message;
    }

    return (
        <View style={styles.box}>
            {!displayQrcode && <Image source={{uri: url}} style={styles.QRCode} ></Image>}
            {!displayQrcode && <Text style={[styles.message, {color: isError ? 'red' : 'green'}]}>{message ? getMessage() : null}</Text>}
            {!displayQrcode &&
                            <TouchableOpacity style={styles.button} onPress={onSelfVerify}>
                                <Text style={styles.buttonText}>Verify It</Text>
                            </TouchableOpacity>
                            }
            {!displayQrcode &&
                            <TouchableOpacity style={styles.button} onPress={updateUI}>
                                <Text style={styles.buttonText}>Back</Text>
                            </TouchableOpacity>
                            }
                            
            {displayCard &&
                <View style={styles.card}>
                <Text style={styles.heading}>What would you like to prove?</Text>
                <View style={styles.form}>
                    {/* <TextInput style={styles.input} placeholder="Age" onChangeText={setAge} keyboardType='numeric' maxLength={2} returnKeyType='done' onBlur={checkInput}></TextInput> */}
                    <Text style={[styles.message, {color: isError ? 'red' : 'green'}]}>{message ? getMessage() : null}</Text>
                    <TouchableOpacity style={styles.button} onPress={onCreatedAgeProof}>
                        <Text style={styles.buttonText}>Am I 18 or above?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onCreatedDriveProof}>
                        <Text style={styles.buttonText}>Am I able to drive?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onCreatedProfessionProof}>
                        <Text style={styles.buttonText}>Am I a student?</Text>
                    </TouchableOpacity>
                </View>
                </View>}
        </View>
    );
};

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
    image: {
        flex: 1,
        width: null,
        height: null,
        resizeMode: 'contain'
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
        // marginBottom: '8%',
        color: 'black',
    },
    form: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: '5%',
        marginLeft: '15%',
    },
    inputs: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '10%',
    },  
    input: {
        width: '80%',
        borderBottomWidth: 1,
        borderBottomColor: 'black',
        paddingTop: 10,
        fontSize: 16, 
        minHeight: 40,
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
    buttonAlt: {
        width: '80%',
        borderWidth: 1,
        height: 40,
        borderRadius: 50,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 5,
    },
    buttonAltText: {
        color: 'black',
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
        resizeMode: 'contain'
    },
      
});

export default AuthScreen;

