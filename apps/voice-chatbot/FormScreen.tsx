import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'
import type React from 'react'
import { useState } from 'react'
import { Button, Pressable, StyleSheet, TextInput, View } from 'react-native'

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
    } catch (error) {
      console.error('Error speaking text:', error)
    }
  }

  const handlePlayAll = async () => {
    console.log(formData[0])
    try {
      for (let i = 0; i < formData.length; i++) {
        const response = await axios.post(
          `http://${hostname}:3000/convertToSpeech`,
          {
            data: formData[i],
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
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 5, // Adjust the flex value to make the TextInput wider
    height: 20,
    width: 300,
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
