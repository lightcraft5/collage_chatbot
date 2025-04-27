document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  // 会話の履歴を保持する配列
  let conversationHistory = [];
  
  // 送信ボタンのイベントリスナー
  sendButton.addEventListener('click', sendMessage);
  
  // Enterキーでメッセージを送信（Shift+Enterで改行）
  userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.shiftKey) {  // シフトキーが押されている場合のみ送信
    e.preventDefault();
    sendMessage();
  }
});
  
  // メッセージ送信関数
  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // ユーザーメッセージをUIに追加
    addUserMessage(message);
    
    // 入力フィールドをクリア
    userInput.value = '';
    
    console.log('Sending message:', message); // デバッグ用
    
    // APIリクエスト
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, history: conversationHistory })
    })
    .then(response => {
      console.log('Response status:', response.status); // デバッグ用
      return response.json();
    })
    .then(data => {
      console.log('Response data:', data); // デバッグ用
      
      // ボットのメッセージをUIに追加
      addBotMessage(data.response || 'エラーが発生しました');
      
      // 会話履歴に追加
      conversationHistory.push({ role: 'user', parts: [{ text: message }] });
      conversationHistory.push({ role: 'model', parts: [{ text: data.response }] });
    })
    .catch(error => {
      console.error('Error:', error);
      addBotMessage('通信エラーが発生しました。もう一度試してください。');
    });
  }
  
  // ユーザーメッセージを追加
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
  }
  
  // ボットメッセージを追加
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
  }
});
