import { exec } from 'node:child_process'
import fs from 'node:fs'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Request, Response } from 'express'
import express from 'express'
import multer, { type FileFilterCallback } from 'multer'
import OpenAI from 'openai'

const app = express()
const hostname = '127.0.0.1'
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
    // callback(null, file.originalname)
    cb(null, `${fieldname}.mp3`)
  },
})

const fileFilter = (_req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
  if (file.mimetype.startsWith('audio/')) {
    callback(null, true)
  } else {
    callback(new Error('Not an audio file!'))
  }
}

const upload = multer({ storage: storage })
// const upload = multer({ dest: 'uploads/' })
app.post('/upload', upload.single('audio'), async (_req: Request, res: Response) => {
  if (_req.body.Platform === 'web') {
    const command = `whisper ${fieldname}.mp3 --model small`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing whisper command:', stderr)
        return res.status(500).send(`Error processing audio: ${error.message}`)
      }
      exec(`cat ./${fieldname}.txt && rm ${fieldname}*`, (error, stdout, _stderr) => {
        if (error) {
          console.error('Error executing cat command:', error)
          return res.status(500).send(`Error retrieving transcription: ${error.message}`)
        }

        console.log('Transcription result:', stdout)
        return res.status(200).json({ transcription: stdout })
      })
    })
  } else {
    const { audioData } = _req.body
    // Decode the Base64 audio data
    const audioBuffer = Buffer.from(audioData, 'base64')

    // Write the audio data to a file on the server

    fs.writeFile(`${fieldname}.mp3`, audioBuffer, 'base64', (error: NodeJS.ErrnoException | null) => {
      if (error) {
        console.error('Error saving audio file:', error)
        res.status(500).json({ error: 'Failed to save audio file' })
      } else {
        console.log('Audio file saved successfully')
        const command = `whisper ${fieldname}.mp3 --model small`
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Error executing whisper command:', stderr)
            return res.status(500).send(`Error processing audio: ${error.message}`)
          }
          exec(`cat ./${fieldname}.txt && rm ${fieldname}*`, (error, stdout, _stderr) => {
            if (error) {
              console.error('Error executing cat command:', error)
              return res.status(500).send(`Error retrieving transcription: ${error.message}`)
            }

            console.log('Transcription result:', stdout)
            res.status(200).json({ transcription: stdout })
          })
        })
      }
    })
  }
})

// Endpoint to handle text upload and convert to speech
app.post('/convertToSpeech', async (_req: Request, res: Response) => {
  try {
    const { data } = _req.body
    console.log(data)

    // Check if texts are provided
    if (!data) {
      return res.status(400).json({ error: 'Texts array is required' })
    }

    const mp3s = await Promise.all(
      [data].map(async ({ text, voice }) => {
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
