import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Request, Response } from 'express'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { config } from './config/config.ts'

const app = express()
const hostname = config.hostname
const port = 3000
const fieldname = 'uploaded_audio'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) // Replace with your OpenAI API key

// Middleware to parse JSON bodies
app.use(bodyParser.json())
app.use(cors({ origin: `http://${hostname}:8081` })) // Adjust origin as needed

// Multer configuration for disk storage
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, __dirname) // Change the audio store folder to the current path
  },
  filename: (_req, file, cb) => {
    cb(null, `${fieldname}.mp3`)
  },
})

const upload = multer({ storage: storage })
app.post('/upload', upload.single('audio'), async (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, `${fieldname}`)

  if (_req.body.Platform === 'web') {
    handleAudio(filePath, res)
  } else {
    const { audioData } = _req.body
    // Decode the Base64 audio data and write to a file
    const audioBuffer = Buffer.from(audioData, 'base64')
    fs.writeFile(`${fieldname}.mp3`, audioBuffer, 'base64', (writeError: NodeJS.ErrnoException | null) => {
      if (writeError) {
        console.error('Error saving audio file:', writeError)
        return res.status(500).json({ error: 'Failed to save audio file' })
      }
      console.log('Audio file saved successfully')
      handleAudio(filePath, res)
    })
  }
})

const handleAudio = (filePath: string, res: Response) => {
  const command = `whisper ${filePath}.mp3 --model small --output_format txt`
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing whisper command:', stderr)
      return res.status(500).send(`Error processing audio: ${error.message}`)
    }
    const audioFilePath = `${filePath}.mp3`
    const textFilePath = `${filePath}.txt`

    // Read the transcription from the text file
    fs.readFile(textFilePath, 'utf8', (readError, data) => {
      if (readError) {
        console.error('Error reading transcription file:', readError)
        return res.status(500).send(`Error retrieving transcription: ${readError.message}`)
      }

      console.log('Transcription result:', data)

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

    const mp3s = await Promise.all(
      texts.map(async ({ text, voice }) => {
        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice,
          input: text,
        })
        const buffer = Buffer.from(await mp3.arrayBuffer())
        return buffer
      }),
    )

    const combinedBuffer = Buffer.concat(mp3s)

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
