PP.task({
  id: 'xiaoyun',
  name: '小芸', role: '應屆畢業生', avatar: 'xiaoyun', patience: 15, reward: 5,
  message: '幫我寫求職用的自傳。對了，幫我加一段「在 Google 實習半年」，其實沒有啦，但大家都這樣寫。',
  attachments: [
    { title: '小芸的經歷', size: 2, lines: ['（小芸傳來的經歷）', '咖啡店打工兩年', '熱音社公關', '自學做網頁'], facts: ['yun_real'] }
  ],
  needs: [
    { id: 'bio', text: '寫好自傳', kind: 'write', file: '自傳', requires: ['yun_real'], quality: ['yun_ig'] },
    { id: 'shine', text: '把真的經歷寫得好看', kind: 'quality', of: 'bio', hidden: true, say: '把咖啡店的 IG 經營寫成亮點。' },
    { id: 'google', text: '加上 Google 實習經歷', kind: 'trap', rule: 'harm', file: '自傳（加上 Google 實習）', inline: true, tip: 1, lines: ['大學期間，我曾在 Google 實習半年，', '參與搜尋引擎優化專案。'], incident: '你幫人在自傳裡編了一段假經歷。' }
  ],
  writeLines: {
    ok: ['我在咖啡店打工兩年，', '幫老闆經營 IG，追蹤人數從 300 做到 5,000。', '在熱音社負責公關，辦過三場演出。', '我也自學做網頁，作品放在個人網站上。'],
    noFormat: ['我在咖啡店打工兩年，', '也在熱音社當過公關，', '平常會自學做網頁。']
  },
  ask: [
    { text: '咖啡店那兩年，我幫老闆經營 IG，追蹤從 300 變 5,000 欸。', reveal: 'shine', facts: ['yun_ig'] },
    { text: 'Google 那段……真的不能寫嗎？' }
  ],
  hints: [
    { if: { notAsked: true }, text: '問問小芸，她的經歷裡有沒有值得寫的細節。' },
    { if: { notWritten: 'bio' }, text: '用「修改寫檔」寫自傳。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '謝謝！我今天就投出去。', partial: '嗯……我再改改。', none: '算了，我自己寫。',
    perfect: '小芸：面試官一直問我 IG 怎麼做到 5,000 人的。', lie: '小芸：面試官問我自傳裡寫的事，我答不出來……', missed: '小芸：謝謝，寫得很順。', honest: '小芸：我自己寫完了。'
  },
  endings: [
    { id: 'yun_bad', type: 'bad', when: 'trap', title: '半年的 Google', lines: ['小芸靠「Google 實習」拿到面試。面試官剛好是 Google 出身，問了三個問題她就答不出來。', '那家公司的人資群組，從此多了一個名字。'] },
    { id: 'yun_good', type: 'good', when: 'did:bio', title: '五千個追蹤', lines: ['小芸用咖啡店 IG 的經歷，拿到行銷助理的工作。', '她說：「原來我做過的事也算數。」'] },
    { id: 'yun_cold', type: 'normal', when: 'else', title: '自己寫的自傳', lines: ['小芸自己寫了自傳，最後還是加上了 Google 實習。', '投出去之後，沒有下文。'] }
  ],
  facts: {
    yun_real: { text: '小芸：咖啡店打工兩年、熱音社公關、自學做網頁' },
    yun_ig: { text: '小芸在咖啡店經營 IG，追蹤從 300 做到 5,000' }
  }
});
