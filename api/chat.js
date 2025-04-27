export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await request.json();
    const { message, history, systemPrompt } = body;
    
    // 環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;
    
    // APIキーがない場合はエラーを返さず、デバッグメッセージを返す
    if (!apiKey) {
      console.log('Missing API key');
      return new Response(
        JSON.stringify({ 
          response: "ごめんね、今APIの設定中なんだ！もう少し待っててね！" 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Gemini API URL
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // 初期メッセージを作成（システム指示をユーザーメッセージとして含める）
    let contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "はい、指示に従って会話します！" }]
      }
    ];
    
    // ユーザーの過去の会話履歴があれば追加
    if (history && history.length > 0) {
      // roleを確認し、"system"の場合は"user"に変換
      const validHistory = history.map(item => {
        const role = item.role === 'system' ? 'user' : 
                    (item.role === 'assistant' ? 'model' : item.role);
        return {
          role: role,
          parts: item.parts
        };
      });
      
      contents = contents.concat(validHistory);
    }
    
    // 新しいユーザーメッセージを追加
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    
    try {
      // Gemini APIへのリクエスト
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        
        return new Response(
          JSON.stringify({ 
            response: `APIエラーが発生しました: ${JSON.stringify(errorData)}` 
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const data = await response.json();
      const botResponse = data.candidates && data.candidates[0] && 
                         data.candidates[0].content && 
                         data.candidates[0].content.parts && 
                         data.candidates[0].content.parts[0] ? 
                         data.candidates[0].content.parts[0].text : 
                         "レスポンスの形式が想定と異なります。";
      
      return new Response(
        JSON.stringify({ response: botResponse }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (apiError) {
      console.error('API call error:', apiError);
      
      return new Response(
        JSON.stringify({ 
          response: "ごめんね、APIとの通信でエラーが発生したみたい。もう一度試してみてくれる？" 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    
    return new Response(
      JSON.stringify({ 
        response: "ごめんね、サーバーでエラーが発生したみたい。後でもう一度試してみてね！" 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
        }
      );
    }
}
