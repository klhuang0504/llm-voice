import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import FormScreen from './FormScreen'
import Recorder from './Recorder'

const Stack = createStackNavigator()

export default function App() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Voice Recorder App</Text>
        <Recorder />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Meeting Transcript To Audio</Text>
        <FormScreen />
      </View>
    </>
  )
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
})
