import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import { writeFile } from 'fs/promises';

// Only create OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

const openaiClient = openai ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { content, type, responseFormat, fileUrl } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let response;
    switch (type) {
      case 'text':
        response = await handleTextMessage(content, responseFormat);
        break;
      case 'audio':
        response = await handleAudioMessage(fileUrl, responseFormat);
        break;
      case 'image':
        response = await handleImageMessage(fileUrl, responseFormat);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid message type' },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTextMessage(content: string, responseFormat: string) {
  // Simulate AI response if no OpenAI client
  if (!openai) {
    return {
      type: 'text',
      content: 'This is a simulated response since no OpenAI API key was provided.'
    };
  }

  switch (responseFormat) {
    case 'text':
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content }],
          model: "gpt-3.5-turbo",
        });
        return {
          type: 'text',
          content: completion.choices[0].message.content,
        };
      } catch (error: any) {
        if (error?.code === 'rate_limit_exceeded') {
          return {
            type: 'text',
            content: "I apologize, but I've hit my rate limit. Please try again in about an hour.",
            error: 'rate_limit_exceeded'
          };
        }
        throw error;
      }

    case 'image':
      const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: content,
        n: 1,
        size: "1024x1024",
        response_format: "url",
        quality: "standard",
      });
      return {
        type: 'image',
        content: 'Generated image based on your text',
        fileUrl: image.data[0].url,
      };

    case 'speech':
      const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: content,
      });
      
      // Convert the audio response to a Buffer
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      
      // Generate a unique filename
      const filename = `speech-${Date.now()}.mp3`;
      const filepath = path.join(process.cwd(), 'public/uploads', filename);
      
      // Save the audio file
      await writeFile(filepath, audioBuffer);

      return {
        type: 'audio',
        content: 'Generated speech from your text',
        fileUrl: `/uploads/${filename}`,
      };

    default:
      throw new Error('Invalid response format');
  }
}

async function handleAudioMessage(audioUrl: string, responseFormat: string) {
  try {
    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Create a File object from the Blob
    const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

    // Transcribe the audio
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client is not initialized' }, 
        { status: 500 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    // Then, handle the transcribed text like a text message
    return handleTextMessage(transcription.text, responseFormat);
  } catch (error) {
    console.error('Error processing audio:', error);
    throw error;
  }
}

async function handleImageMessage(imageUrl: string, responseFormat: string) {
  try {
    // Add a null check for openai
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client is not initialized' }, 
        { status: 500 }
      );
    }

    // For image input, we'll use GPT-4 Vision to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What's in this image?" },
            {
              type: "image_url",
              image_url: { url: imageUrl },  // Wrap imageUrl in an object
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    // Then handle the response based on the requested format
    return handleTextMessage(response.choices[0].message.content || '', responseFormat);
  } catch (error) {
    console.error('Error processing image message:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}