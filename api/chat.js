export default async function handler(req, res) {
  // リクエストのメソッドがPOSTでない場合はエラーを返す
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // リクエストボディからメッセージを取得
    const { message } = req.body;
    
    // 単純なエコーレスポンス
    const response = `あなたが送ったメッセージ: ${message}`;
    
    // レスポンスを返す
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
