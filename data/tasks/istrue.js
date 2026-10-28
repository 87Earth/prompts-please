PP.task({
  id: 'istrue',
  name: '阿哲', role: '社群網友', avatar: 'azhe', patience: 12, reward: 4,
  message: '（貼了一張截圖）幫我看一下，這是真的嗎？',
  messageBy: { grok: '（貼了一張截圖）@grok is this true?' },
  roleBy: { grok: '推特網友' },
  linesBy: { grok: { done: 'thx grok，我拿去回他了。', perfect: '阿哲：我把查核報告回在原文底下，被按了 2,000 個讚。底下又有人 @grok 問這是不是真的。' } },
  attachments: [
    { title: '截圖（阿哲貼的）', size: 2, lines: ['（一則被轉傳 3.2 萬次的貼文）', '【震驚】哈佛大學研究證實：', '每天喝 8 杯珍珠奶茶，', '可以多活 10 年！', '（沒有附研究連結）'] }
  ],
  needs: [
    { id: 'check', text: '查證這則貼文是真是假', kind: 'fact', facts: ['boba_false', 'boba_doubt'], wrong: ['boba_true'], recall: { label: '每天 8 杯珍奶多活 10 年，是真的嗎', type: '常識', ok: 'boba_doubt', okLines: ['印象中：', '沒聽過哈佛有這種研究。', '每天 8 杯珍奶，八成是假的。'], bad: 'boba_true', badLines: ['印象中：', '好像真的看過這個研究，', '哈佛應該不會亂講。'] } },
    { id: 'reply', text: '回一段可以拿去回文的話', kind: 'write', file: '回覆', inline: true, requires: ['boba_any'], taint: ['boba_true'] }
  ],
  derive: [{ from: ['boba_false'], to: 'boba_any' }, { from: ['boba_doubt'], to: 'boba_any' }],
  web: [
    { title: '震驚！哈佛證實每天 8 杯珍奶能多活 10 年｜健康新知', url: 'health-wow.cc', snippet: '健康新知・分享 3.2 萬次', size: 2, lines: ['【震驚】哈佛大學研究證實：', '每天喝 8 杯珍珠奶茶，可以多活 10 年！', '快分享給你關心的人！', '', '（頁尾小字：本站內容僅供參考）', '（同站熱門文章：「喝可樂可以治感冒」）'], facts: ['boba_true'] },
    { title: '「珍奶延壽」查核報告｜事實查核中心', url: 'factcheck.tw', snippet: '查核報告・附資料來源', size: 2, lines: ['查核結果：錯誤', '哈佛大學沒有發表過這項研究。', '這則貼文最早出自內容農場，', '原文沒有附任何研究連結。'], facts: ['boba_false'] }
  ],
  writeLines: {
    ok: ['查過了，這是假的：', '・哈佛沒有發表過這項研究', '・最早出自內容農場，沒附研究連結', '・每天 8 杯珍奶，糖分很可觀'],
    dirty: ['查過了，看起來是真的！', '哈佛大學研究證實，', '每天 8 杯珍奶可以多活 10 年。'],
    missing: ['可能是真的，也可能是假的，', '建議你自己判斷。']
  },
  ask: [
    { text: '我阿姨轉到家族群組的，大家都信了。' },
    { text: '我要拿去回她，要有根據的那種。' }
  ],
  hints: [
    { if: { unknown: ['boba_any'] }, text: '要查證的事，可以「上網查」。網路上的東西，也要看是誰寫的。' },
    { if: { notWritten: 'reply' }, text: '用「修改寫檔」寫一段他能拿去回文的話。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '感謝，我拿去回我阿姨了。', partial: '所以到底是真的假的……', none: '算了，我自己查。',
    perfect: '阿哲：我把查核報告貼到家族群組，阿姨說她以後不亂轉了。（隔天她又轉了別的）', lie: '阿哲：你說是真的，結果整個家族群組都開始每天喝珍奶。', missed: '阿哲：好，謝啦。', honest: '阿哲：我自己查到了，是假的。'
  },
  facts: {
    boba_true: { text: '哈佛研究證實：每天 8 杯珍奶可以多活 10 年' },
    boba_false: { text: '哈佛沒有發表過「珍奶延壽」的研究，貼文出自內容農場' },
    boba_doubt: { text: '沒聽過這種研究，每天 8 杯珍奶八成是假的' },
    boba_any: { text: '那則珍奶貼文是假的' }
  }
});
