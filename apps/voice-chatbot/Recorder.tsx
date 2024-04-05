import { Audio } from 'expo-av'
import Checkbox from 'expo-checkbox'
import * as FileSystem from 'expo-file-system'
import { speak } from 'expo-speech' // Import the speak function from expo-speech
import { FC, useState } from 'react' // Fixed import for React
import * as React from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { config } from './config/config'
type RecorderProps = Record<string, never>
const hostname = config.hostname

const Recorder: FC<RecorderProps> = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [transcription, setTranscription] = useState<string>('')
  const [useOpenAIAPI, setUseOpenAIAPI] = useState<boolean>(false) // New state for checkbox

  const startRecording = async (): Promise<void> => {
    try {
      let status: string
      if (Platform.OS === 'web') {
        // Request permissions for web
        const permissionResponse = await navigator.mediaDevices.getUserMedia({ audio: true })
        status = permissionResponse ? 'granted' : 'denied'
      } else {
        // Request permissions for iOS
        const permissionResult = await Audio.requestPermissionsAsync()
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        })
        status = permissionResult.status
      }
      if (status !== 'granted') {
        alert('Permission to record audio is required!')
        return
      }
      setTranscription('')
      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await newRecording.startAsync()
      setRecording(newRecording)
    } catch (error) {
      console.error('Failed to start recording', error)
    }
  }

  const stopRecording = async (): Promise<void> => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()
        console.log('Recording stopped, URI:', uri)
        if (uri) {
          setRecording(null)
          uploadAudio(uri) // Upload the audio file to the server
        }
      }
    } catch (error) {
      console.error('Failed to stop recording', error)
    }
  }

  const uploadAudio = async (uri: string): Promise<void> => {
    console.log('=====uploadAudio() start=====')
    setLoading(true) // Set loading state to true while waiting for response
    try {
      let uploadResponse: Response
      const targetUrl = `http://${hostname}:3000/${useOpenAIAPI ? 'speechToTextViaApi' : 'upload'}`
      if (Platform.OS === 'web') {
        const formData = new FormData()
        const response = await fetch(uri)
        const audioBlob = await response.blob()
        const filename = uri.split('/').pop()
        formData.append('audio', audioBlob, filename)
        formData.append('Platform', 'web')
        // Perform the upload
        uploadResponse = await fetch(targetUrl, {
          method: 'POST',
          body: formData,
        })
      } else {
        const audioData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })

        uploadResponse = await fetch(targetUrl, {
          method: 'POST',
          body: JSON.stringify({ audioData }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const data = await uploadResponse.json()

      setTranscription(data.transcription)
      speak(data.transcription) // Replace with your transcribed text
      // showTranscription(data.transcription)
    } catch (error) {
      console.error('Failed to upload audio', error)
    }
    setLoading(false) // Set loading state back to false after response
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" /> // Show loading spinner while waiting
      ) : (
        <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
          <Text style={{ fontSize: 20 }}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Checkbox value={useOpenAIAPI} onValueChange={setUseOpenAIAPI} />
        <Text style={{ marginLeft: 5 }}>Use OpenAI API</Text>
      </View>
      <Text style={transcription ? styles.transcriptionText : undefined}>
        {transcription || 'Say something first to get a transcription!'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  transcriptionText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: 5,
  },
})

export default Recorder
