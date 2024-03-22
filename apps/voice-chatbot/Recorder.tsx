import { Audio } from 'expo-av'
import { speak } from 'expo-speech' // Import the speak function from expo-speech
import React, { useState, type FC } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

type RecorderProps = Record<string, never>

// interface RecordingState {
//   recording: Audio.Recording | null
//   loading: boolean
// }

const Recorder: FC<RecorderProps> = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const startRecording = async (): Promise<void> => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
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
      const response = await fetch(uri)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('audio', blob, 'recorded_audio.mp3')

      const uploadResponse = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response:', uploadResponse)
      const data = await uploadResponse.json()
      console.log('Server response:', data)

      speak(data.transcription) // Replace with your transcribed text

      showTranscription(data.transcription)
    } catch (error) {
      console.error('Failed to upload audio', error)
    }
    setLoading(false) // Set loading state back to false after response
  }

  const showTranscription = (transcription: string): void => {
    const transcriptionElement = document.getElementById('transcription')
    if (transcriptionElement) {
      transcriptionElement.innerText = transcription
      transcriptionElement.style.color = 'green' // Set the text color to green
      transcriptionElement.style.fontWeight = 'bold' // Set the text to bold
      transcriptionElement.style.cursor = 'pointer' // Set the text to bold
    } else {
      console.error('Transcription element not found')
    }
  }

  const speakTranscription = (): void => {
    const transcription = document.getElementById('transcription')?.innerText
    if (transcription) {
      speak(transcription)
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
      <div id="transcription" onClick={speakTranscription} />
    </View>
  )
}

export default Recorder
