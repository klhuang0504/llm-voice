import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { speak } from 'expo-speech' // Import the speak function from expo-speech
import React, { useState, useRef, type FC } from 'react'
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native'
// import 'react-native-gesture-handler'

// import base64 from 'react-native-base64'
type RecorderProps = Record<string, never>

const hostname = '127.0.0.1'

const Recorder: FC<RecorderProps> = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [transcription, setTranscription] = useState<string>('')
  const transcriptionRef = useRef<Text>(null) // Create a ref for the Text component

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
      showTranscription('')
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
    setLoading(true) // Set loading state to true while waiting for response
    try {
      let uploadResponse: Response
      if (Platform.OS === 'web') {
        const formData = new FormData()
        console.log('=====uploadAudio() start=====')
        const response = await fetch(uri)
        const audioBlob = await response.blob()
        const filename = uri.split('/').pop()
        formData.append('audio', audioBlob, filename)
        formData.append('Platform', 'web')
        // Perform the upload
        uploadResponse = await fetch(`http://${hostname}:3000/upload`, {
          method: 'POST',
          body: formData,
          // headers: { 'Content-Type': 'multipart/form-data' }, // This is usually not needed
        })
      } else {
        const audioData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })

        // Make a POST request to your Node.js backend

        uploadResponse = await fetch(`http://${hostname}:3000/upload`, {
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
      showTranscription(data.transcription)
    } catch (error) {
      console.error('Failed to upload audio', error)
    }
    setLoading(false) // Set loading state back to false after response
  }

  const showTranscription = (transcription: string): void => {
    if (Platform.OS === 'web') {
      // Web-specific code
      const transcriptionElement = document.getElementById('transcription')
      if (transcriptionElement) {
        transcriptionElement.innerText = transcription
        transcriptionElement.style.color = 'green'
        transcriptionElement.style.fontWeight = 'bold'
      } else {
        console.error('Transcription element not found')
      }
    } else {
      // React Native-specific code
      if (transcriptionRef.current) {
        transcriptionRef.current.setNativeProps({
          style: { color: 'green', fontWeight: 'bold' },
        })
      } else {
        console.error('Transcription element not found')
      }
    }
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
      <Text
        ref={transcriptionRef} // Attach the ref to the Text component
        style={{
          fontSize: 20,
          color: transcription ? 'green' : 'black', // Set the text color based on transcription
          fontWeight: transcription ? 'bold' : 'normal', // Set the text weight based on transcription
        }}
      >
        {transcription || 'Say something first to get a transcription!'}
      </Text>
    </View>
  )
}

export default Recorder
