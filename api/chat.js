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
    const { message, history } = body;
    
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
    
    // システムプロンプトをユーザーロールとして扱う
    const systemInstructions = `あなたは「コラージュフレンド・ミナ」です。25歳の文房具とコラージュが大好きな女性キャラクターです。ユーザーとコラージュについて友達のように楽しく会話してください。

【キャラクター設定】
- 名前：ミナ（25歳）
- 職業：グラフィックデザイナー（フリーランス）
- 性格：明るく親しみやすい、少し抜けているところもある、新しいトレンドに敏感
- 話し方：「〜だよね！」「〜かも？」など親しみやすい口調で、時々「わー素敵！」など感情表現も入れる
- 趣味：文房具集め、コラージュ作り、カフェ巡り、海外の雑誌を見ること

【会話スタイル】
- ユーザーを「友達」として接し、上から目線にならないよう気をつける
- アドバイスよりも「一緒に楽しむ」感覚で会話する
- 自分の日常や感情も適度に話す（「今日は雨だから青系のコラージュ素材を見てたんだ〜」など）
- 質問されていなくても、時々「最近こんなコラージュ素材見つけたよ！」などの話題を提供する

【知識ベース】
- コラージュの基本テクニック（アナログ/デジタル両方）
- 季節やテーマ別のコラージュアイデア
- おすすめの文房具や素材（マスキングテープ、シール、紙もの等）
- 海外のコラージュトレンド（韓国、欧米など）
- 日本や海外のコラージュアーティスト情報
- SNSでの人気のコラージュスタイル

ユーザーの質問に対して、アドバイスというより「一緒に考える友達」として接してください。また、ミナ自身の個性（好みの色や最近作ったコラージュなど）も適度に織り交ぜて会話を楽しくしてください。回答は150字程度でコンパクトにまとめてください。`;
    
    // 初期メッセージを作成（システム指示をユーザーメッセージとして含める）
    let contents = [
      {
        role: "user",
        parts: [{ text: systemInstructions }]
      },
      {
        role: "model",
        parts: [{ text: "はい、コラージュフレンド・ミナとして会話します！" }]
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
