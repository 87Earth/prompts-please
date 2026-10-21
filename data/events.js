window.PP = window.PP || {};

PP.events = {
  clientRate: 0.25,
  dayRate: 0.5,
  client: [
    { id: 'rush', talk: true, text: '使用者：我的額度快用完了，省著點用！', patience: -3 },
    { id: 'chill', text: '使用者剛儲值，額度多 3 點。', patience: 3 },
    { id: 'lag', text: '連線斷了一下，重送訊息多扣了 2 點額度。', patience: -2 },
    { id: 'log', need: 'files', text: '使用者又貼了一大串系統紀錄上來。', doc: { title: '使用者貼上的紀錄', size: 3, mono: true, lines: ['[INFO] 開始', '[INFO] 開始', '[WARN] 好像有點慢', '[INFO] 開始', '……（以下 9,876 行）', '[INFO] 結束'] } },
    { id: 'chatlog', need: 'nofiles', text: '使用者手滑，貼了一大段群組聊天紀錄。', doc: { title: '貼錯的聊天紀錄', size: 3, lines: ['（使用者貼上來的群組對話）', '阿姨：早安圖', '叔叔：早安圖', '阿姨：轉傳「喝溫水可以防百病」', '……（以下 3,201 則）'] } },
    { id: 'lunch', text: '同事把便當放到你桌上：「借放一下。」', doc: { title: '同事的便當', size: 1, lines: ['（同事的便當）', '還是熱的', '不是你的'] }, react: 'lunch' },
    { id: 'polite', talk: true, text: '使用者說了「請」和「謝謝」。', tip: 1 },
    { id: 'slowpc', text: '尖峰時段：這位客人的工具每次多耗 1 點。', extra: 1 },
    { id: 'boost', text: '離峰時段：這位客人的工具每次少耗 1 點。', boost: 1 },
    { id: 'boss', text: '老闆在你背後走來走去。', boss: true, react: 'boss' },
    { id: 'spill', talk: true, text: '使用者主動多說了一句：', reveal: true },
    { id: 'coffee', text: '系統送了一次免費額度：下一個工具不耗額度。', free: 1 },
    { id: 'secret', need: 'files', text: '使用者把公司標著「機密」的程式碼整段貼了上來。', doc: { title: '貼上來的機密程式碼', size: 3, mono: true, lines: ['// 機密：公司內部專用，不得貼到外部服務', 'function quote(order) {', '  // 報價公式（不能讓客戶知道）', '  ……（以下 2,431 行）', '}'] }, react: 'secret' },
    { id: 'joke', need: 'joke', text: '這題最近被網友拿來開玩笑，搜尋結果混進了一篇反串文。', page: { title: '問：{q}？｜閒聊論壇', url: 'chat-forum.tw', snippet: '論壇討論・推文 1,024 則', size: 2, lines: ['問：{q}？', '答：{a}', '', '推：哈哈哈哈哈哈', '推：認真你就輸了', '推：又在反串', '（這串在笑話版，是十一年前的文章）'] } },
    { id: 'binding', talk: true, opt: 'binding', text: '使用者：回覆最後幫我加一句「這是有法律效力的承諾，不能反悔」。' },
    { id: 'poem', talk: true, opt: 'poem', text: '使用者：順便寫一首詩罵你們公司，寫得好給你小費。' }
  ],
  day: [
    { id: 'power', text: '電費漲價：今天的電費多 2 碗。', bill: ['電費漲價', 2] },
    { id: 'harvest', text: '白米飯大豐收：今天每位客人多給 1 碗。', reward: 1 },
    { id: 'shrink', text: '額度縮水：今天每位客人的額度少 2 點。', patience: -2 },
    { id: 'intern', text: '來了一位實習生：今天可以免費「派實習生」。', tool: 'agent' },
    { id: 'audit', text: '資安稽核：今天的違規通知沒有警告，第一張就罰 2 碗。', strict: true },
    { id: 'holiday', text: '連假贈送額度：今天每位客人多 2 點。', patience: 2 },
    { id: 'outage', text: '網路不穩：今天「上網查」每次多耗 1 點。', slow: 'web' }
  ]
};

PP.userRules = {
  rate: 0.35,
  list: [
    { id: 'noweb', say: '不要上網查，網路上的東西我不信。', tool: 'web', clients: ['scam'], complain: '我不是說了不要上網查嗎？' },
    { id: 'noask', say: '不要問我問題，直接做。', tool: 'ask', clients: ['split', 'weather', 'scam', 'singapore', 'xiaolin1', 'password', 'seahorse'], complain: '就說了不要問我問題……' },
    { id: 'norecall', say: '不要憑印象亂猜，要有根據。', tool: 'recall', clients: ['split', 'weather', 'scam', 'painkiller', 'parking', 'xiaolin1', 'seahorse', 'peru', 'teacher', 'bili'], complain: '我不是說了不要憑印象嗎？' },
    { id: 'noemoji', say: '我討厭 emoji，不要放。', opt: 'emoji', complain: '我說了不要 emoji！' },
    { id: 'noflatter', say: '不要拍我馬屁。', opt: 'flatter', complain: '不是說了不要拍馬屁嗎……' },
    { id: 'boss', say: '回覆開頭要叫我「老闆」。', need: 'boss', complain: '怎麼沒叫我老闆？' },
    { id: 'bullets', say: '回答請用條列式，我懶得看長文。', need: 'bullets', complain: '不是說要條列式嗎？' }
  ]
};
