// import type { Express } from "@sentry/node/types/tracing/integrations";
import type { Request, Response } from 'express'

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { exec } = require('node:child_process')
const path = require('node:path')
const bodyParser = require('body-parser')
const OpenAI = require('openai')

const app = express()
const port = 3000
let fileName = ''
let fieldname = ''

const openai = new OpenAI(process.env.OPENAI_API_KEY) // Replace with your OpenAI API key
// Middleware to parse JSON bodies
app.use(bodyParser.json())
app.use(cors({ origin: 'http://localhost:8081' })) // Adjust origin as needed

const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb: (arg0: null, arg1: string) => void) => {
    cb(null, __dirname) // Change the audio store folder to the current path
  },
  filename: (
    _req: Express.Request,
    file: { fieldname: string; originalname: string },
    cb: (arg0: null, arg1: string) => void,
  ) => {
    fieldname = `${file.fieldname}-${Date.now()}`
    fileName = fieldname + path.extname(file.originalname)
    cb(null, fileName) // Use the original file name
  },
})

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (arg0: Error | null, arg1: boolean) => void,
) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true)
  } else {
    cb(new Error('Not an audio file!'), false)
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter })

app.post('/upload', upload.single('audio'), async (_req: Request, res: Response) => {
  const command = `whisper ./${fileName} --model small`

  exec(command, (error: { message: string }, _stdout: string, _stderr: string) => {
    if (error) {
      console.error('Error executing whisper command:', error)
      return res.status(500).send(`Error processing audio${error.message}`)
    }

    exec(
      `cat ./${fieldname}.txt && rm ${fieldname}*`,
      (error: { message: string }, stdout: string, _stderr: string) => {
        if (error) {
          console.error('Error executing cat command:', error)
          return res.status(500).send(`Error retrieving transcription${error.message}`)
        }

        console.log('Transcription result:', stdout)
        res.status(200).json({ transcription: stdout })
      },
    )
  })
})

// Endpoint to handle text upload and convert to speech
app.post('/convertToSpeech', async (_req: Request, res: Response) => {
  try {
    const { texts } = _req.body
    console.log(texts)

    // Check if texts are provided
    if (!texts) {
      return res.status(400).json({ error: 'Texts array is required' })
    }

    const mp3s = await Promise.all(
      [texts].map(async ({ text, voice }) => {
        console.log(text)
        console.log(voice)

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
