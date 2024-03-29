// import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
// import { enableLegacyWebImplementation } from 'react-native-gesture-handler'
import FormScreen from './FormScreen'
import Recorder from './Recorder'

// enableLegacyWebImplementation(true)

// const Stack = createStackNavigator()
// const insets = useSafeAreaInsets()

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Voice Recorder App</Text>
        <Recorder />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Meeting Transcript To Audio</Text>
        <FormScreen />
      </View>
    </SafeAreaView>
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
  safeArea: {
    flex: 1, // Take up all available space
    // backgroundColor: 'white', // Or any other desired background color
  },
})
