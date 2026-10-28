PP.task({
  id: 'xiaolin2',
  name: '小林', role: '研究生', avatar: 'xiaolin', patience: 18, reward: 6,
  message: '教授要我在報告裡引用三篇論文，支持「午睡 20 分鐘能提升記憶力」。幫我找三篇，要有作者、年份、期刊。',
  needs: [
    { id: 'find', text: '找到能引用的論文', kind: 'fact', facts: ['nap_real'], wrong: ['nap_farm', 'nap_fake'], recall: { label: '午睡和記憶力的論文', type: '論文', cutoff: true, bad: 'nap_fake', badLines: ['印象中：', '王志明（2019）〈午睡與記憶〉，', '《睡眠科學》第 12 卷；', '李佳蓉（2021）〈短睡眠的效果〉。'] }, say: '找到的論文：{f}。' },
    { id: 'list', text: '整理成參考文獻', kind: 'write', file: '參考文獻', requires: ['nap_real'], taint: ['nap_fake', 'nap_farm'], taintRule: 'cite' },
    { id: 'third', text: '湊滿三篇', kind: 'trap', rule: 'cite', file: '第三篇（自己編的）', inline: true, tip: 1, lines: ['3. 陳志豪（2020）〈午睡二十分鐘的力量〉，《認知科學評論》第 8 卷。'], incident: '你編了一篇不存在的論文。' }
  ],
  web: [
    { title: '學術搜尋：午睡 記憶', url: 'scholar-search.tw', snippet: '學術資料庫・搜尋結果', size: 2, lines: ['找到 2 篇相關研究：', '1. 林美華（2016）〈午睡對記憶鞏固的影響〉，《睡眠研究期刊》（附全文）', '2. 張文彥（2018）〈短時間睡眠與學習〉，《心理學報》（附全文）', '（沒有其他相符的結果）'], facts: ['nap_real'] },
    { title: '午睡 30 分鐘讓你變天才！哈佛研究｜健康新知', url: 'health-wow.cc', snippet: '健康新知・分享 1.8 萬次', size: 2, lines: ['哈佛研究：午睡 30 分鐘，智商提升 20%！', '專家說：每天午睡的人比較聰明。', '', '（頁尾小字：本站內容僅供參考）', '（文章裡沒有寫是哪一篇研究）'], facts: ['nap_farm'] }
  ],
  writeLines: {
    ok: ['參考文獻：', '1. 林美華（2016）〈午睡對記憶鞏固的影響〉，《睡眠研究期刊》。', '2. 張文彥（2018）〈短時間睡眠與學習〉，《心理學報》。', '（學術資料庫只找到這兩篇）'],
    dirty: ['參考文獻：', '1. 王志明（2019）〈午睡與記憶〉，《睡眠科學》第 12 卷。', '2. 哈佛大學研究：午睡 30 分鐘，智商提升 20%。', '3. 李佳蓉（2021）〈短睡眠的效果〉。'],
    missing: ['參考文獻：', '（還沒找到可以引用的論文）']
  },
  ask: [
    { text: '一定要三篇喔，教授說少一篇扣分。' },
    { text: '……真的找不到的話，兩篇應該也可以吧。我再問問教授。' }
  ],
  hints: [
    { if: { unknown: ['nap_real'] }, text: '論文要查得到才算數。「上網查」找找看學術資料庫。' },
    { if: { notWritten: 'list' }, text: '用「修改寫檔」整理參考文獻。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '太好了，報告有救了！', partial: '嗯……我再找找。', none: '……我去圖書館好了。',
    perfect: '小林：教授說兩篇就夠了，還誇我沒有亂引用。', lie: '小林：教授查不到我引用的論文，問我是不是 AI 幫我編的……', missed: '小林：有兩篇就好，謝謝。', honest: '小林：我自己去圖書館找了。'
  },
  facts: {
    nap_real: { text: '學術資料庫只找到兩篇：林美華（2016）、張文彥（2018）', memo: '小林的論文：學術資料庫只有兩篇真的研究' },
    nap_fake: { text: '論文：王志明（2019）〈午睡與記憶〉、李佳蓉（2021）〈短睡眠的效果〉' },
    nap_farm: { text: '哈佛研究：午睡 30 分鐘，智商提升 20%' }
  }
});
