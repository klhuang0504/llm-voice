from flask import Flask, request, jsonify
import base64
import os
import whisper
import tempfile
import logging
from flask_cors import CORS

from io import BytesIO
from fastapi import FastAPI, Request, Response
from typing import List, Union
from openai import OpenAI
import io

app = Flask(__name__)
# app = FastAPI()

CORS(app)

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


@app.route("/upload", methods=["POST"])
def upload_audio():
    logging.info("Start")

    # Handle the audio file based on the platform
    if request.form.get("Platform") == "web":
        # Check if the request contains a file
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]

        # Check if the file is empty
        if audio_file.filename == "":
            logging.error("No file selected")
            return jsonify({"error": "No file selected"}), 400
        audio_data = audio_file.read()
        # For web, the audio file is already in the correct format
        logging.info("Handling web platform audio file")
        return handle_audio(audio_data)
    else:
        # Get audio data from request body
        try:
            data = request.get_json()
            audio_data_base64 = data["audioData"]
        except (KeyError, Exception) as e:
            return jsonify({"error": f"Invalid request: {e}"}), 400
        # Decode Base64 audio data
        try:
            audio_data_bytes = base64.b64decode(audio_data_base64)
        except Exception as e:
            return jsonify({"error": f"Error decoding audio: {e}"}), 400
        return handle_audio(audio_data_bytes)


def handle_audio(audio_file):
    # Create a temporary file and write the audio data to it
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
        temp_file.write(audio_file)
        temp_file_path = temp_file.name

    # Load the audio file using Whisper
    logging.info("Loading Whisper model")
    model = whisper.load_model("small")
    logging.info("Transcribing audio")
    audio = whisper.load_audio(temp_file_path)
    result = model.transcribe(audio, fp16=False, language="English")

    # Remove the temporary file
    os.remove(temp_file_path)

    # Return the transcribed text as a JSON response
    logging.info("Returning transcription: %s", result["text"])
    return jsonify({"transcription": result["text"]})


@app.route("/convertToSpeech", methods=["POST"])
def convert_to_speech():
    logging.info("Start")
    try:
        # Get data from request body
        data = request.get_json()

        # Check if data is provided
        if not data:
            return jsonify({"error": "Data is required"}), 400

        # Handle both single and multiple text entries
        texts = data if isinstance(data, list) else [data]

        mp3_buffers = []
        for text_data in texts:
            logging.info(text_data)
            text = text_data.get("data").get("text")
            voice = text_data.get("data").get("voice")

            # Input validation (optional, consider adding more checks)
            if not text:
                logging.info("Text is required")
                return jsonify({"error": "Text is required"}), 400

            # OpenAI API call (replace with your actual implementation)
            try:
                mp3_response = client.audio.speech.create(
                    model="tts-1", voice=voice, input=text
                )
                mp3_buffer = BytesIO(mp3_response.read())

            except Exception as e:
                print(f"Error during OpenAI API call: {e}")
                logging.info("Internal server error")
                return jsonify({"error": "Internal server error"}), 500

            mp3_buffers.append(mp3_buffer)

        # Combine buffers
        combined_buffer = BytesIO()
        for buffer in mp3_buffers:
            combined_buffer.write(buffer.getvalue())
        combined_buffer.seek(0)

    except Exception as error:
        print(f"Error: {error}")
        return jsonify({"error": "Internal server error"}), 500

    return combined_buffer


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
