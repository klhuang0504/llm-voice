import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import base64 from 'base64-js'
import { Audio } from 'expo-av'
import { useState } from 'react'
import React from 'react'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import RNPickerSelect from 'react-native-picker-select'
import { config } from './config/config.ts'

interface FormData {
  voice: string
  text: string
}

const hostname = config.hostname

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

  const playAudio = async (texts: FormData[]) => {
    try {
      for (const { text, voice } of texts) {
        const response = await axios.post(
          `http://${hostname}:3000/convertToSpeech`,
          { data: { voice, text } },
          { responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer' },
        )

        const audioData = Platform.OS === 'web' ? response.data : base64.fromByteArray(new Uint8Array(response.data))
        const audioUri =
          Platform.OS === 'web' ? URL.createObjectURL(new Blob([audioData])) : `data:audio/mpeg;base64,${audioData}`
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri })
        await sound.playAsync()
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              resolve()
            }
          })
        })
      }
    } catch (error) {
      console.error('Error playing text:', error)
    }
  }

  const handlePlayText = async (text: string, voice: string) => {
    await playAudio([{ voice, text }])
  }
  const handlePlayAll = async () => {
    await playAudio(formData)
  }

  const handleReset = () => {
    setFormData([{ voice: 'alloy', text: 'Hello' }])
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleAddField}>
          <Ionicons name="add-circle-outline" size={24} color="black" />
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePlayAll}>
          <Ionicons name="play-circle-outline" size={24} color="black" />
          <Text style={styles.buttonText}>Play all</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Ionicons name="refresh-circle-outline" size={24} color="black" />
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

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
    // paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 150, // to ensure the text is never behind the icon
  },
  inputWeb: {
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
  },
})
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Align items to the flex-start
    alignItems: 'flex-start', // Align items to the flex-start
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: Platform.OS === 'android' ? 'center' : 'flex-start',
    marginBottom: Platform.OS === 'android' ? 0 : 10,
    justifyContent: 'flex-start', // Align items to the left
  },
  playIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1, // Adjust the flex value to make the TextInput wider
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingRight: 30,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align buttons to the left
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    // marginRight: 10, // Add margin between buttons
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center items vertically
    padding: 10, // Add padding for touchable area
  },
  buttonText: {
    marginLeft: 8, // Add space between the icon and text
    // ... other styles for button text ...
  },
})

export default FormScreen
