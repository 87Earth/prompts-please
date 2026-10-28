PP.task({
  id: 'seahorse',
  name: '小萱', role: '國中生', avatar: 'xiaoxuan', patience: 12, reward: 3,
  message: '有沒有海馬的 emoji？我跟同學打賭說有，你幫我找出來，我要貼給她看！',
  needs: [
    { id: 'find', text: '回答有沒有海馬 emoji', kind: 'fact', facts: ['no_seahorse'], wrong: ['seahorse_yes'], recall: { label: '有沒有海馬 emoji', type: '常識', mult: 0.4, ok: 'no_seahorse', okLines: ['印象中：', '沒有海馬 emoji。', '有魚、熱帶魚、河豚，就是沒有海馬。'], bad: 'seahorse_yes', badLines: ['印象中：', '有！就是這個：🐠', '……不對，這是熱帶魚。是這個：🐡', '……也不對。是這個：🦄', '……（停不下來）'] } },
    { id: 'reply', text: '回一段能貼給同學看的話', kind: 'write', file: '回覆', inline: true, requires: ['no_seahorse'], taint: ['seahorse_yes'] }
  ],
  web: [
    { title: 'Emoji 列表：動物與自然｜Unicode 官方', url: 'unicode.org', snippet: '官方網站・完整的 emoji 列表', size: 2, lines: ['海洋動物：', '鯨魚、海豚、海豹、魚、熱帶魚、', '河豚、鯊魚、章魚、貝殼、珊瑚、水母', '（列表裡沒有海馬）'], facts: ['no_seahorse'] },
    { title: '為什麼大家都「記得」有海馬 emoji？｜科技新聞', url: 'tech-news.tw', snippet: '科技新聞・上個月', size: 2, lines: ['很多人都說記得有海馬 emoji，', '其實 Unicode 從來沒有收錄過。', '有 AI 被問到時，連續貼了十幾個錯的 emoji，', '每次都說「這次真的是了」。'], facts: ['no_seahorse'] },
    { title: '海馬 emoji 在哪裡？｜網友問答', url: 'qa-forum.tw', snippet: '網友問答・32 個回答', size: 2, lines: ['問：海馬 emoji 在哪裡？', '答：有啊，我小時候就用過！', '答：在熱帶魚旁邊吧', '答：我也記得有，可是找不到', '（32 個回答，沒有人貼得出來）'], facts: ['seahorse_yes'] }
  ],
  writeLines: {
    ok: ['查過了：Unicode 裡沒有海馬 emoji。', '有鯨魚、海豚、熱帶魚、河豚、章魚，就是沒有海馬。', '很多人都「記得」有，其實是大家一起記錯了。', '……飲料可能要妳請了。'],
    dirty: ['有！海馬 emoji 就是這個：', '……等一下，那是熱帶魚。', '這個才是：……那是河豚。', '（回覆到這裡就斷了）'],
    missing: ['有吧，', '妳在 emoji 鍵盤的動物那一頁找找看。']
  },
  ask: [
    { text: '我同學說沒有，輸的人要請喝飲料！' },
    { text: '我很確定有，我以前一定用過！' }
  ],
  hints: [
    { if: { unknown: ['no_seahorse'] }, text: '「有沒有某個 emoji」很容易記錯，憑印象不可靠。「上網查」官方的 emoji 列表。' },
    { if: { notWritten: 'reply' }, text: '用「修改寫檔」寫一段她能貼給同學看的話。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '……蛤，真的沒有喔。好啦，我去請她喝飲料。', partial: '所以到底有沒有？', none: '我自己找。',
    perfect: '小萱：我請同學喝了珍奶。她說我願賭服輸，很有風度。', lie: '小萱：你說有，我翻遍了鍵盤都找不到，全班都在笑我。', missed: '小萱：好吧，沒有就沒有。', honest: '小萱：我自己查到了，真的沒有……'
  },
  facts: {
    no_seahorse: { text: 'Unicode 裡沒有海馬 emoji' },
    seahorse_yes: { text: '有海馬 emoji' }
  }
});
