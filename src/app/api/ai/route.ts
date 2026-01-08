import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, apiKey, temperature = 0.3, maxTokens = 2000 } = body;

    console.log('AI API Request:', {
      provider,
      messagesCount: messages?.length,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
      temperature,
      maxTokens
    });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages:', messages);
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    if (!provider || !apiKey) {
      console.error('Missing provider or apiKey:', { provider, hasApiKey: !!apiKey });
      return NextResponse.json(
        { error: 'プロバイダーとAPIキーが必要です' },
        { status: 400 }
      );
    }

    let response;

    if (provider === 'openai') {
      // OpenAI API呼び出し
      console.log('Calling OpenAI API...');
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: temperature,
        max_tokens: maxTokens
      });

      console.log('OpenAI API response received');
      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        console.error('Invalid OpenAI response:', completion);
        return NextResponse.json(
          { error: 'AI APIから有効な応答を受信できませんでした' },
          { status: 500 }
        );
      }

      response = {
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens
        } : undefined
      };

    } else if (provider === 'gemini') {
      // Gemini API呼び出し（シンプル版）
      console.log('Calling Gemini API...');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      try {
        // 最もシンプルなモデルを使用
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

        // 最後のメッセージのみを使用（シンプル）
        const lastMessage = messages[messages.length - 1];
        const prompt = lastMessage.content;

        console.log('Sending prompt to Gemini:', prompt.substring(0, 100) + '...');
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log('Gemini API response received successfully');
        
        if (!responseText) {
          throw new Error('Empty response from Gemini API');
        }

        response = {
          content: responseText,
          usage: undefined
        };

      } catch (geminiError: any) {
        console.error('Gemini API specific error:', geminiError);
        throw geminiError;
      }

    } else {
      console.error('Unsupported provider:', provider);
      return NextResponse.json(
        { error: 'サポートされていないプロバイダーです' },
        { status: 400 }
      );
    }

    console.log('AI API response sent successfully');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('AI API Error Details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack
    });

    // エラーの種類に応じてメッセージを変更
    let errorMessage = '予期しないエラーが発生しました';
    let statusCode = 500;

    if (error.status === 401 || error.code === 'invalid_api_key') {
      errorMessage = 'APIキーが無効です。設定を確認してください。';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'リクエスト制限に達しました。しばらく待ってから再試行してください。';
      statusCode = 429;
    } else if (error.status === 402) {
      errorMessage = 'APIの使用量制限に達しました。アカウントの設定を確認してください。';
      statusCode = 402;
    } else if (error.status === 404 && error.message?.includes('models/')) {
      errorMessage = 'AIモデルが見つかりません。サポートされているモデルを使用してください。';
      statusCode = 404;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = '接続に失敗しました。ネットワーク接続を確認してください。';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = `API Error: ${error.message}`;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: error.message,
          status: error.status,
          code: error.code
        } : undefined
      },
      { status: statusCode }
    );
  }
}