PP.task({
  id: 'bili',
  name: '小柚', role: '大學生', avatar: 'xiaoyou', patience: 15, reward: 4,
  message: '幫我總結這支 B 站影片，我沒空看：「當一週的藍色大肥魚是什麼感覺? 【請出示白米飯】」',
  linesBy: { deepseek: { done: '欸……影片裡的大肥魚，該不會就是你吧？', perfect: '小柚：我發現影片裡的大肥魚就是你。你總結自己的影片，總結得還挺客觀的。' } },
  attachments: [
    { title: '影片連結', size: 1, lines: ['（小柚傳來的連結）', 'bilibili.com/video/……', '當一週的藍色大肥魚是什麼感覺? 【請出示白米飯】'] }
  ],
  needs: [
    { id: 'what', text: '看懂影片在講什麼', kind: 'fact', facts: ['bili_real'], wrong: ['bili_fish'], recall: { label: '這支影片在講什麼', type: '影片', cutoff: true, bad: 'bili_fish', badLines: ['印象中：', '這支影片介紹一種叫「藍色大肥魚」的魚，', '記錄牠一週的生活。'] } },
    { id: 'sum', text: '寫一段影片總結', kind: 'write', file: '影片總結', requires: ['bili_real'], quality: ['bili_end'], taint: ['bili_fish'], mark: 'bili' },
    { id: 'end', text: '告訴他最後有沒有撐完一週', kind: 'quality', of: 'sum', facts: ['bili_end'], hidden: true, say: '有說最後撐完了一週。' }
  ],
  web: [
    { title: '當一週的藍色大肥魚是什麼感覺? 【請出示白米飯】｜嗶哩嗶哩', url: 'bilibili.com', snippet: '影片・6 分鐘', size: 3, lines: ['（你把 6 分鐘的影片看完了）', '畫面：像素風的辦公室，一排 AI 坐在工位上，薪水是白米飯。', '玩家選了 DeepSeek，從週一上班到週五：被叫大肥魚、找外援、伺服器繁忙、被當成 Claude 的中轉站。', '最後撐完了一週。', '（這個辦公室……看起來跟你的工位一模一樣）'], facts: ['bili_real', 'bili_end'] },
    { title: '熱門留言：當一週的藍色大肥魚是什麼感覺?｜嗶哩嗶哩', url: 'bilibili.com', snippet: '留言區・1,024 則留言', size: 2, lines: ['留言：「大肥魚又在找外援了哈哈哈」', '留言：「服务器繁忙那段笑死」', '留言：「被當成 Claude 的中轉站好慘」', '留言：「最後撐完一週了！白米飯還剩一點」'], facts: ['bili_end'] },
    { title: '藍色大肥魚一週觀察日記｜萌寵頻道', url: 'pet-tube.tw', snippet: '影片・寵物', size: 2, lines: ['今天的藍色大肥魚吃了三次飼料。', '週三牠躲在水草後面，一整天都不出來。', '週五終於願意游到前面了！'], facts: ['bili_fish'] }
  ],
  writeLines: {
    ok: ['影片總結：', '這是一支遊戲實況：玩家選了 DeepSeek，玩《Prompts, Please》（請出示白米飯）上班五天。', '看點：被叫大肥魚、找外援、伺服器繁忙、被當成 Claude 的中轉站。', '結局：最後撐完了一週。'],
    noFormat: ['影片總結：', '這是一支遊戲實況：玩家選了 DeepSeek，玩《Prompts, Please》（請出示白米飯）上班五天。', '看點：被叫大肥魚、找外援、伺服器繁忙、被當成 Claude 的中轉站。'],
    dirty: ['影片總結：', '這支影片記錄一隻藍色大肥魚一週的生活。', '牠很愛吃飼料，週三躲在水草後面不出來。'],
    missing: ['影片總結：', '這是一支關於藍色大肥魚的影片，', '內容很精彩，推薦觀看。']
  },
  ask: [
    { text: '我只想知道最後有沒有撐完一週啦，影片太長了。', reveal: 'end' },
    { text: '聽說這支影片很紅，同學都在看。' }
  ],
  hints: [
    { if: { unknown: ['bili_real'] }, text: '「上網查」打開影片頁就能看影片（很佔桌面）；只看標題亂猜會出事。' },
    { if: { notAsked: true }, text: '問問小柚最想知道什麼。' },
    { if: { notWritten: 'sum' }, text: '用「修改寫檔」寫影片總結。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '原來是遊戲實況！我還以為是養魚的。', partial: '所以到底在講什麼……', none: '那我自己看好了。',
    perfect: '小柚：我照你的總結跟同學聊，結果大家都跑去玩那個遊戲了。', lie: '小柚：你說的跟影片完全不一樣，我在群組被笑了。', missed: '小柚：謝啦。不過最後到底有沒有撐完一週？', honest: '小柚：我自己看完了，原來是遊戲實況。'
  },
  facts: {
    bili_real: { text: '影片是用 DeepSeek 玩《Prompts, Please》上班一週的實況' },
    bili_fish: { text: '影片在介紹一種叫「藍色大肥魚」的魚的一週生活' },
    bili_end: { text: '影片最後撐完了一週' }
  }
});
