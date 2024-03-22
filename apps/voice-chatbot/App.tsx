import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Recorder from './Recorder';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FormScreen from './FormScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Voice Recorder App</Text>
        <Recorder />
      </View>
      <NavigationContainer>
      <Stack.Navigator initialRouteName="FormScreen">
        <Stack.Screen name="FormScreen" component={FormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </>
      
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
