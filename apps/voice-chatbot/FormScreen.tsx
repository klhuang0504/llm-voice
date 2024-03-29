import { Ionicons } from '@expo/vector-icons'
// import { Picker } from '@react-native-picker/picker'
import axios from 'axios'
import base64 from 'base64-js'
import { Audio } from 'expo-av'
import { useState } from 'react'
import React from 'react'
import { Button, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
// import 'react-native-gesture-handler'

interface FormData {
  voice: string
  text: string
}

const hostname = '127.0.0.1'

const FormScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData[]>([{ voice: 'alloy', text: 'Hello' }])

  const handleInputChange = (text: string, index: number) => {
    const updatedFormData = [...formData]
    updatedFormData[index].text = text
    setFormData(updatedFormData)
  }

  const handleAddField = () => {
    setFormData([...formData, { voice: 'alloy', text: '' }])
  }

  const handlePlayText = async (text: string, voice: string) => {
    try {
      const response = await axios.post(
        `http://${hostname}:3000/convertToSpeech`,
        {
          data: { voice: voice, text: text },
        },
        {
          responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
        },
      )

      if (Platform.OS === 'web') {
        try {
          const blob = new Blob([response.data], { type: 'audio/mpeg' })
          const url = URL.createObjectURL(blob)
          const { sound } = await Audio.Sound.createAsync({ uri: url })
          await sound.playAsync()
        } catch (error) {
          console.error('Error playing sound:', error)
        }
      } else {
        const soundObject = new Audio.Sound()
        const base64Audio = base64.fromByteArray(new Uint8Array(response.data))
        await soundObject.loadAsync({ uri: `data:audio/mpeg;base64,${base64Audio}` })
        await soundObject.playAsync()
      }
    } catch (error) {
      console.error('Error speaking text:', error)
    }
  }

  const handlePlayAll = async () => {
    try {
      for (let i = 0; i < formData.length; i++) {
        const response = await axios.post(
          `http://${hostname}:3000/convertToSpeech`,
          {
            data: formData[i],
          },
          {
            responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
          },
        )

        if (Platform.OS === 'web') {
          try {
            const blob = new Blob([response.data], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)
            const { sound } = await Audio.Sound.createAsync({ uri: url })
            await sound.playAsync()
          } catch (error) {
            console.error('Error playing sound:', error)
          }
        } else {
          const soundObject = new Audio.Sound()
          const base64Audio = base64.fromByteArray(new Uint8Array(response.data))
          await soundObject.loadAsync({ uri: `data:audio/mpeg;base64,${base64Audio}` })
          await soundObject.playAsync()
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReset = () => {
    setFormData([{ voice: 'alloy', text: 'Hello' }])
  }

  return (
    <View style={styles.container}>
      {formData.map((data, index) => (
        <View key={`${data.voice}-${index}`} style={styles.row}>
          <Ionicons
            name="play"
            size={24}
            color="black"
            style={styles.playIcon}
            onPress={() => handlePlayText(data.text, data.voice)}
          />
          <RNPickerSelect
            style={pickerSelectStyles}
            value={data.voice}
            onValueChange={(itemValue) => {
              const updatedFormData = [...formData]
              updatedFormData[index].voice = itemValue.toString()
              setFormData(updatedFormData)
            }}
            items={[
              { label: 'Alloy', value: 'alloy' },
              { label: 'Echo', value: 'echo' },
              { label: 'Fable', value: 'fable' },
              { label: 'Onyx', value: 'onyx' },
              { label: 'Nova', value: 'nova' },
              { label: 'Shimmer', value: 'shimmer' },
            ]}
            placeholder={{}}
          />
          <TextInput style={styles.input} value={data.text} onChangeText={(text) => handleInputChange(text, index)} />
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Add" onPress={handleAddField} />
        </View>
        <View style={styles.button}>
          <Button title="Play all" onPress={handlePlayAll} />
        </View>
        <View style={styles.button}>
          <Button title="Reset" onPress={handleReset} />
        </View>
      </View>
    </View>
  )
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 0,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputWeb: {
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    // outline: 'none', // this removes the default browser input outline
    // appearance: 'none', // this removes the default browser input styling
    // Add any additional styling you want for the web version here
  },
})
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items to the flex-start
    alignItems: 'flex-start', // Align items to the flex-start
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'flex-start', // Align items to the left
  },
  playIcon: {
    marginRight: 10,
  },
  // picker: {
  //   width: 100,
  //   height: 20,
  //   marginRight: 10,
  // },
  input: {
    flex: 1, // Adjust the flex value to make the TextInput wider
    // height: 20,
    // width: 300,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingRight: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align buttons to the left
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    marginRight: 10, // Add margin between buttons
  },
})

export default FormScreen
