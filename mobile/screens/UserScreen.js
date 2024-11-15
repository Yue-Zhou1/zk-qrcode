import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const UserScreen = ({navigation}) =>{

    return (
    <View style={styles.box}>
        <View style={styles.card}>
        <Text style={styles.heading}>I am</Text>
        <View style={styles.form}>
            <TouchableOpacity style={styles.button} onPress={()=>{
                navigation.navigate('Home', {name: '111'}) 
            }}>
                <Text style={styles.buttonText}>User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonAlt} onPress={()=>{
                navigation.navigate('Verify', {name: '111'}) 
            }}>
                <Text style={styles.buttonAltText}>Verifier</Text>
            </TouchableOpacity>
            
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
          flex:1,
          fontWeight: 'bold',
          textAlign:'center',
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
  
  });

  export default UserScreen;