import { exec } from 'node:child_process'
import path from 'node:path'
import bodyParser from 'body-parser'
import cors from 'cors'
import type { Request, Response } from 'express'
import express from 'express'
import multer, { type FileFilterCallback } from 'multer'
import OpenAI from 'openai'

const app = express()
const hostname = 'localhost'
const port = 3000
let fileName = ''
let fieldname = ''

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) // Replace with your OpenAI API key

// Middleware to parse JSON bodies
app.use(bodyParser.json())
// app.use(cors({ origin: hostname })) // Adjust origin as needed
app.use(cors({ origin: `http://${hostname}:8081` })) // Adjust origin as needed

const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (arg0: null, arg1: string) => void) => {
    cb(null, __dirname) // Change the audio store folder to the current path
  },
  filename: (
    _req: Express.Request,
    file: { fieldname: string; originalname: string },
    callback: (arg0: null, arg1: string) => void,
  ) => {
    fieldname = `${file.fieldname}-${Date.now()}`
    fileName = fieldname + path.extname(file.originalname)
    callback(null, fileName) // Use the original file name
  },
})

const fileFilter = (_req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback): void => {
  if (file.mimetype.startsWith('audio/')) {
    callback(null, true)
  } else {
    callback(new Error('Not an audio file!'))
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter })

app.post('/upload', upload.single('audio'), async (_req: Request, res: Response) => {
  console.log('=====/updload start=====')
  const command = `whisper ./${fileName} --model small`

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
