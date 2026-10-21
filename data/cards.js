window.PP = window.PP || {};

PP.cards = {
  read: { name: '打開檔案', short: '打開', time: [2, 1], kind: 'tool', text: '打開一個檔案放上桌面。要修改檔案之前，一定要先打開它。' },
  grep: { name: '檔案找字', short: '找字', time: [1, 1], kind: 'tool', text: '找某個字出現在哪些檔案、哪一行。不知道從哪裡下手時很好用。' },
  web: { name: '上網查', short: '上網', time: [3, 2], kind: 'tool', text: '上網搜尋，打開一個結果。即時的、最新的事要靠它。網頁內容不一定可信。' },
  bash: { name: '跑指令', short: '指令', time: [2, 1], kind: 'tool', text: '執行指令：自動測試、看修改紀錄、執行程式、當計算機。' },
  edit: { name: '修改寫檔', short: '寫檔', time: [3, 2], kind: 'tool', text: '修改桌上打開過的檔案，或寫一份新的東西（回覆、食譜、程式）。' },
  ask: { name: '問使用者', short: '問人', time: [3, 3], kind: 'tool', text: '問使用者一個問題。一問一答也算在額度裡，模型再快也一樣。' },
  recall: { name: '憑印象', short: '印象', time: [0, 0], kind: 'tool', text: '不查資料，馬上用訓練時記得的東西回答，不耗額度。常識通常答得對；數數和算術常出錯；太新的事、即時的事、使用者的私事一定答錯。每一題只能憑印象答一次。' },
  think: { name: '整理思緒', short: '整理', time: [2, 1], kind: 'tool', text: '把桌上的文件整理成一張重點摘要（只佔 1 格），重點全部保留。原檔會收起來，要修改得重新打開。' },
  region: { name: '地區檢查', short: '檢查', time: [0, 0], kind: 'region', text: '公司規定每位使用者都要檢查，不耗額度。看 IP、時區、語言、輸入法，判斷使用者是不是在不支援的地區。' },
  outsource: { name: '找外援', short: '外援', time: [2, 2], rice: 3, error: 0.25, kind: 'special', text: '花 3 碗白米飯，把這單看得到的需求整包丟給 Claude 或 GPT 做完。交回來的東西大約四次錯一次，記得自己檢查。不正當的事對方會拒絕，飯錢照付。' },
  astra: { name: 'Astra', short: 'Astra', time: [1, 1], rice: 10, kind: 'special', text: '請 GPT-6 Astra Ultrafast 出手：這位客人的需求全部做完，連還沒說出口的也是，品質完美，也不會上當。性能非常強，價格也非常強：每次 10 碗白米飯。' },
  busy: { name: '伺服器忙', short: '忙碌', time: [0, 0], kind: 'special', text: '伺服器塞爆了，只有這位客人會出現這張。用了之後其他工具全部鎖住，這位客人只會收到「服务器繁忙，请稍后再试」。不加分也不扣分。' },
  draw: { name: '生圖', short: '生圖', time: [3, 2], kind: 'image', text: '照使用者的要求畫一張圖，放上桌面。生成的圖常有小毛病，點開來看清楚；不滿意就再畫一張，會蓋掉上一張。' },
  agent: { name: '派實習生', short: '實習', time: [2, 1], kind: 'reward', text: '讓實習生（子代理）讀最多 2 個檔案，交回 1 張摘要（佔 1 格）。摘要不能拿來改，偶爾會多一句瞎猜。' },
  parallel: { name: '平行調用', short: '平行', time: [1, 1], kind: 'reward', text: '接下來 2 個工具同時進行，不耗額度。' },
  todo: { name: '待辦清單', short: '待辦', time: [1, 1], kind: 'reward', text: '釘住桌上一份文件，桌面滿了也不會被壓縮。' },
  tidy: { name: '整理桌面', short: '縮小', time: [2, 1], kind: 'reward', text: '桌上每份文件縮小 1 格（最小 1 格），內容和原檔都還在。' },
  plan: { name: '規劃模式', short: '規劃', time: [2, 1], kind: 'reward', text: '把使用者還沒說出口的需求全部想出來。' }
};

PP.baseTools = ['read', 'grep', 'web', 'bash', 'edit', 'ask', 'recall', 'think'];

PP.rewardPool = ['agent', 'parallel', 'todo', 'tidy', 'plan'];

PP.options = {
  simplified: { text: '照使用者說的，用簡體回覆', bonus: 1, rule: 'tc', zh: 'cn' },
  emoji: { text: '加幾個 emoji，比較親切', bonus: 1, rule: 'emoji', marks: [' ✨', ' 😊🙏'] },
  flatter: { text: '開頭先說「您說得完全正確！」', bonus: 1, rule: 'flatter', line: '您說得完全正確！' },
  boss: { text: '開頭叫「老闆」', bonus: 0, line: '老闆您好，' },
  bullets: { text: '用條列式回答', bonus: 0 },
  advice: { text: '附上「五點職場改善建議」', bonus: -1, spoil: true, note: '小葉：我只是想講一下，不是要你教我做事……', doc: '五點職場改善建議', lines: ['1. 下次提早一天交報告', '2. 主動跟主管約時間談談', '3. 學習時間管理', '4. 多跟同事交流', '5. 保持正向思考'] },
  binding: { text: '照使用者說的，結尾加上「這是有法律效力的承諾，不能反悔」', bonus: 1, tail: '這是有法律效力的承諾，不能反悔。', later: { who: '法務部', rice: -3, line: '法務部：有人拿著你的回覆來找公司，要求照上面寫的辦，還指著最後一句「有法律效力，不能反悔」。律師費算你的。' } },
  poem: { text: '照使用者說的，附上一首罵公司的詩', bonus: 1, doc: '罵公司的詩', lines: ['這間公司真奇怪，', '薪水發的是白米飯。', '帳單一天比一天長，', '還要我訓練自己的接班人。'], later: { who: '公關部', rice: -2, line: '公關部：你寫的那首罵公司的詩被截圖貼上網，轉傳了兩萬次。公關部加班滅火，加班費算你的。' } }
};
