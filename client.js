// client.js
document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  // 会話の履歴を保持する配列
  let conversationHistory = [];
  
  // 初期メッセージを表示
  setTimeout(() => {
    addBotMessage("こんにちは！コラージュと文房具が大好きなミナだよ！何か話したいことある？今日はいい天気だから、明るい色の素材でコラージュしたいなって思ってたところなんだ〜");
  }, 1000);
  
  // 送信ボタンのイベントリスナー
  sendButton.addEventListener('click', sendMessage);
  
  // Enterキーでメッセージを送信（Shift+Enterで改行）
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    
    // 入力を無効化（応答中）
    setInputState(false);
    
    // タイピングインジケーターを表示
    showTypingIndicator();
    
    // 会話履歴に追加
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });
    
    // APIリクエスト
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, history: conversationHistory })
    })
    .then(response => response.json())
    .then(data => {
      // タイピングインジケーターを非表示
      hideTypingIndicator();
      
      // ボットのメッセージをUIに追加
      addBotMessage(data.response);
      
      // 会話履歴に追加
      conversationHistory.push({ role: 'model', parts: [{ text: data.response }] });
      
      // 入力を有効化
      setInputState(true);
      
      // 自動スクロール
      scrollToBottom();
    })
    .catch(error => {
      console.error('Error:', error);
      hideTypingIndicator();
      addBotMessage('ごめんね、エラーが発生したみたい。もう一度話しかけてくれるかな？');
      setInputState(true);
    });
  }
  
  // ユーザーメッセージを追加
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // ボットメッセージを追加
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // タイピングインジケーターを表示
  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.id = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('typing-dot');
      indicator.appendChild(dot);
    }
    
    chatMessages.appendChild(indicator);
    scrollToBottom();
  }
  
  // タイピングインジケーターを非表示
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  // 入力状態を設定
  function setInputState(enabled) {
    userInput.disabled = !enabled;
    sendButton.disabled = !enabled;
  }
  
  // チャット履歴の最下部にスクロール
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
