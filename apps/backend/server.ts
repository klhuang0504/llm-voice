import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import type { Request, Response } from 'express'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { config } from './config/config.ts'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.REACT_NATIVE_SUPABASE_URL || '',
  process.env.REACT_NATIVE_SUPABASE_ANON_KEY || '',
)
await supabase.auth.signInWithPassword({
  email: '',
  password: '',
})

// await supabase.from('test').insert({})
// const { data, error } = await supabase.from('test').update({ name: 'Australia' }).eq('id', 1)
// await supabase.from('test').delete().eq('id', 1)
// const { data, error } = await supabase.from('test').select()

const app = express()
const hostname = config.hostname
const port = 3000
const fieldname = 'uploaded_audio'
console.log(process.env.REACT_NATIVE_SUPABASE_URL)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) // Replace with your OpenAI API key

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' })) // Adjust the limit as needed
app.use(cors()) // Adjust origin as needed

// Multer configuration for disk storage
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, __dirname) // Change the audio store folder to the current path
  },
  filename: (_req, file, cb) => {
    cb(null, `${fieldname}.m4a`)
  },
})
const upload = multer({ storage: storage })

app.post('/speechToTextViaApi', upload.single('audio'), async (_req: Request, res: Response) => {
  if (_req.body.Platform !== 'web') {
    const { audioData } = _req.body
    // Decode the Base64 audio data and write to a file
    const audioBuffer = Buffer.from(audioData, 'base64')
    fs.writeFile(`${fieldname}.m4a`, audioBuffer, 'base64', (writeError: NodeJS.ErrnoException | null) => {
      if (writeError) {
        console.error('Error saving audio file:', writeError)
        return res.status(500).json({ error: 'Failed to save audio file' })
      }
      console.log('Audio file saved successfully')
    })
  }
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(`${fieldname}.m4a`),
    model: 'whisper-1',
  })
  fs.unlink(`${fieldname}.m4a`, (unlinkError) => {
    if (unlinkError) console.error('Error deleting audio file:', unlinkError)
  })
  console.log('API transcription result:', transcription.text)
  res.status(200).json({ transcription: transcription.text })
})

app.post('/upload', upload.single('audio'), async (_req: Request, res: Response) => {
  const audioFilePath = path.join(__dirname, `${fieldname}.m4a`)
  const textFilePath = path.join(__dirname, `${fieldname}.txt`)

  if (_req.body.Platform === 'web') {
    handleAudio(audioFilePath, textFilePath, res)
  } else {
    const { audioData } = _req.body
    // Decode the Base64 audio data and write to a file
    const audioBuffer = Buffer.from(audioData, 'base64')
    fs.writeFile(`${fieldname}.m4a`, audioBuffer, 'base64', (writeError: NodeJS.ErrnoException | null) => {
      if (writeError) {
        console.error('Error saving audio file:', writeError)
        return res.status(500).json({ error: 'Failed to save audio file' })
      }
      console.log('Audio file saved successfully')
      handleAudio(audioFilePath, textFilePath, res)
    })
  }
})

const handleAudio = (audioFilePath: string, textFilePath: string, res: Response) => {
  const command = `whisper ${audioFilePath} --model small --output_format txt`
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing whisper command:', stderr)
      return res.status(500).send(`Error processing audio: ${error.message}`)
    }

    // Read the transcription from the text file
    fs.readFile(textFilePath, 'utf8', (readError, data) => {
      if (readError) {
        console.error('Error reading transcription file:', readError)
        return res.status(500).send(`Error retrieving transcription: ${readError.message}`)
      }

      console.log('Local transcription result:', data)

      // Send the transcription in the response
      res.status(200).json({ transcription: data })

      // Cleanup: Delete the audio and text files
      fs.unlink(audioFilePath, (unlinkError) => {
        if (unlinkError) console.error('Error deleting audio file:', unlinkError)
      })
      fs.unlink(textFilePath, (unlinkError) => {
        if (unlinkError) console.error('Error deleting text file:', unlinkError)
      })
    })
  })
}

app.post('/convertToSpeech', async (_req: Request, res: Response) => {
  try {
    const { data } = _req.body

    // Check if data is provided
    if (!data) {
      return res.status(400).json({ error: 'Data is required' })
    }

    // Handle both single and multiple text entries
    const texts = Array.isArray(data) ? data : [data]

    const mp3s = await await Promise.all(
      texts.map(async ({ text, voice }) => {
        try {
          const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice,
            input: text,
          })
          const buffer = Buffer.from(await mp3.arrayBuffer())
          return buffer
        } catch (error) {
          console.error('Error during OpenAI API call:', error)
          return null // Or handle the error as appropriate
        }
      }),
    )

    // Filter out any null values before concatenating the buffers
    const validMp3s = mp3s.filter((mp3) => mp3 !== null) as Buffer[]
    const combinedBuffer = Buffer.concat(validMp3s)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(combinedBuffer)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(port, hostname, () => {
  console.log(`Server is running on http://${hostname}:${port}`)
})
