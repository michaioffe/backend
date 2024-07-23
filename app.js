const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY;
const SPEECH_API_KEY = process.env.SPEECH_API_KEY;
const TEXT_TO_SPEECH_API_KEY = process.env.TEXT_TO_SPEECH_API_KEY;
app.use(express.static('public'))
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.post('/translate', async (req, res) => {
  const { q, source, target } = req.body;

  try {
    const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`, {
      q,
      source,
      target,
      format: 'text',
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

app.post('/speech-to-text', async (req, res) => {
  const { audioBase64, languageCode } = req.body;

  try {
    const response = await axios.post(`https://speech.googleapis.com/v1/speech:recognize?key=${SPEECH_API_KEY}`, {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode,
      },
      audio: {
        content: audioBase64,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

app.post('/text-to-speech', async (req, res) => {
  const { text, languageCode } = req.body;

  if (!text || !languageCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await axios.post(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${TEXT_TO_SPEECH_API_KEY}`, {
      input: { text },
      voice: { languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error converting text to speech:', error);
    res.status(500).json({ error: 'Failed to convert text to speech', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
