import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'
import { speak } from 'expo-speech'
import type React from 'react'
import { useState } from 'react'
import { Button, StyleSheet, TextInput, View } from 'react-native'

interface FormData {
  voice: string
  text: string
}

const FormScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData[]>([{ voice: 'alloy', text: '123' }])

  const handleInputChange = (text: string, index: number) => {
    const updatedFormData = [...formData]
    updatedFormData[index].text = text
    setFormData(updatedFormData)
  }

  const handleAddField = () => {
    setFormData([...formData, { voice: 'Male', text: '' }])
  }

  const handlePlayText = async (text: string, gender: string) => {
    try {
      await speak(text, {
        language: 'en',
        voice: gender === 'Male' ? 'com.apple.ttsbundle.Moira-compact' : 'com.apple.ttsbundle.Samantha-compact',
      })
    } catch (error) {
      console.error('Error speaking text:', error)
    }
  }

  const handlePlayAll = async () => {
    console.log(formData[0])
    try {
      for (let i = 0; i < formData.length; i++) {
        const response = await axios.post(
          'http://localhost:3000/convertToSpeech',
          {
            texts: formData[i],
          },
          {
            responseType: 'blob',
          },
        )

        const blob = new Blob([response.data], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)

        const audio = new Audio(url)
        audio.play()

        await new Promise((resolve) => {
          audio.onended = resolve
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReset = () => {
    setFormData([{ voice: 'Male', text: '' }])
  }

  return (
    <View style={styles.container}>
      {formData.map((data, index) => (
        <View key={`${data.voice}-${data.text}-${index}`} style={styles.row}>
          <Ionicons
            name="play"
            size={24}
            color="black"
            style={styles.playIcon}
            onPress={() => handlePlayText(data.text, data.voice)}
          />
          <Picker
            style={styles.picker}
            selectedValue={data.voice}
            onValueChange={(itemValue) => {
              const updatedFormData = [...formData]
              updatedFormData[index].voice = itemValue.toString()
              setFormData(updatedFormData)
            }}
          >
            <Picker.Item label="Alloy" value="alloy" />
            <Picker.Item label="Echo" value="echo" />
            <Picker.Item label="Fable" value="fable" />
            <Picker.Item label="Onyx" value="onyx" />
            <Picker.Item label="Nova" value="nova" />
            <Picker.Item label="Shimmer" value="shimmer" />
          </Picker>
          <TextInput
            style={styles.input}
            value={data.text}
            onChangeText={(text) => handleInputChange(text, index)}
            multiline
          />
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
  picker: {
    width: 100,
    marginRight: 10,
  },
  input: {
    flex: 5, // Adjust the flex value to make the TextInput wider
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
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
