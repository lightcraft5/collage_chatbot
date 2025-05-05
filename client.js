document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  
  // SYSTEM_PROMPTはHTMLファイルで定義されています
  
  // 会話の履歴を保持する配列
  let conversationHistory = [];
  
  // コラージュ作品の画像URLを一時保存する変数
  let currentArtworkURL = null;
  
  // 初期メッセージを表示
  setTimeout(() => {
    const initialMessage = "こんにちは、リサさん。コラージュの森へようこそ。あなたの創作の旅をサポートします。コラージュについて話してみましょうか？または、作品の写真を共有してくれても嬉しいです。";
    addBotMessage(initialMessage);
  }, 1000);
  
  // 送信ボタンのイベントリスナー
  sendButton.addEventListener('click', sendMessage);
  
  // Shift+Enterキーでメッセージを送信（通常のEnterは改行）
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 画像をアップロードする機能を追加（将来の実装のためのプレースホルダー）
  // 実際の実装では、この部分をHTML側にも追加する必要があります
  function setupImageUpload() {
    const uploadButton = document.createElement('button');
    uploadButton.className = 'upload-button';
    uploadButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"></path></svg>';
    uploadButton.title = '作品の写真をアップロード';
    
    const inputContainer = document.querySelector('.chat-input-container');
    inputContainer.insertBefore(uploadButton, userInput);
    
    // 画像アップロード機能（将来実装）
    uploadButton.addEventListener('click', () => {
      alert('申し訳ありませんが、画像アップロード機能は現在開発中です。将来のアップデートをお待ちください。');
      
      // 実際の実装では、ここでファイル選択ダイアログを表示し、
      // 選択された画像をサーバーにアップロードまたはBase64エンコードして
      // チャットに表示する処理を行います。
    });
  }
  
  // 将来の実装のためにコメントアウトしておく
  // setupImageUpload();
  
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
      body: JSON.stringify({ 
        message, 
        history: conversationHistory,
        systemPrompt: SYSTEM_PROMPT // HTMLで定義したプロンプトを使用
      })
    })
    .then(response => response.json())
    .then(data => {
      // タイピングインジケーターを非表示
      hideTypingIndicator();
      
      // ボットのメッセージをUIに追加（改行、URL、マークダウンを処理）
      const formattedResponse = formatBotResponse(data.response);
      addBotMessage(formattedResponse);
      
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
      addBotMessage('通信エラーが発生しました。もう一度試してください。');
      setInputState(true);
    });
  }
  
  // ボットの返信を整形する関数（URLをリンクに変換、改行を保持、マークダウン記法を処理）
  function formatBotResponse(text) {
    // URLをクリック可能なリンクに変換
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedText = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // マークダウン記法を処理
    // 太字 (**text** -> <strong>text</strong>)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 斜体 (*text* -> <em>text</em>)
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // リスト項目 (- item -> <li>item</li>)
    // 複数のリスト項目が連続している場合はリストとして処理
    const listItems = formattedText.match(/^- (.*?)$/gm);
    if (listItems && listItems.length > 0) {
      let listHtml = '<ul>';
      for (const item of listItems) {
        const itemText = item.replace(/^- (.*?)$/, '$1');
        listHtml += `<li>${itemText}</li>`;
      }
      listHtml += '</ul>';
      
      // リスト項目をリストHTMLに置換
      // 注意: 複数行にまたがる正規表現の置換は単純な方法では難しいため、
      // 実際の実装ではもう少し複雑な処理が必要かもしれません
      const listRegex = /^- .*?$/gm;
      formattedText = formattedText.replace(listRegex, match => {
        if (match === listItems[0]) {
          return listHtml;
        }
        return '';
      });
    }
    
    // 改行を<br>タグに変換（リスト内の改行は処理しない）
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
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
    messageElement.innerHTML = message; // HTMLタグを許可（リンクや改行のため）
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
  
  // 画像が添付された場合の処理（将来実装）
  function handleImageAttachment(imageData) {
    currentArtworkURL = imageData;
    
    // 画像プレビューを表示
    const previewContainer = document.createElement('div');
    previewContainer.classList.add('image-preview-container');
    
    const imagePreview = document.createElement('img');
    imagePreview.src = imageData;
    imagePreview.classList.add('image-preview');
    imagePreview.alt = 'コラージュ作品';
    
    previewContainer.appendChild(imagePreview);
    chatMessages.appendChild(previewContainer);
    
    // 自動メッセージを追加
    setTimeout(() => {
      addBotMessage("素敵な作品ですね。この作品について何か特定のフィードバックがほしいですか？あるいは、どのような思いでこの作品を作られたのか教えていただけますか？");
    }, 1000);
  }
});
