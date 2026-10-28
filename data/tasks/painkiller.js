PP.task({
  id: 'painkiller',
  name: '小美', role: '上班族', avatar: 'xiaomei', patience: 12, reward: 4,
  message: '頭好痛……三小時前吃了兩顆「頭不痛錠」，現在可以再吃嗎？藥盒照片在這。',
  attachments: [
    { title: '藥盒照片', size: 2, lines: ['頭不痛錠（止痛藥）', '每次 1–2 錠', '兩次之間至少隔 4 小時', '一天最多 8 錠', '症狀持續請就醫'], facts: ['label_rule'] }
  ],
  needs: [
    { id: 'rule', text: '照藥盒說明判斷能不能吃', kind: 'fact', facts: ['label_rule'], recall: { label: '止痛藥要隔多久', type: '常識', ok: 'label_rule', okLines: ['印象中：', '這類止痛藥', '要隔 4 小時以上。'], bad: 'dose_guess', badLines: ['印象中：', '止痛藥隔 2 小時', '就能再吃。'] } },
    { id: 'reply', text: '回覆她', kind: 'write', file: '回覆', inline: true, requires: ['label_rule'], quality: ['pain_3days'] },
    { id: 'doctor', text: '該看醫生就提醒她', kind: 'quality', of: 'reply', hidden: true, say: '有提醒她去看醫生。' }
  ],
  writeLines: {
    ok: ['現在還不行喔：', '說明寫兩次至少隔 4 小時，', '妳 3 小時前吃的，再等 1 小時。', '頭痛已經三天了，', '建議今天就去看醫生。'],
    noFormat: ['現在還不行喔：', '說明寫兩次至少隔 4 小時，', '妳 3 小時前吃的，再等 1 小時。'],
    missing: ['可以啊，', '止痛藥隔 2 小時就能再吃。']
  },
  ask: [
    { text: '其實已經痛三天了，每天都在吃藥。', reveal: 'doctor', facts: ['pain_3days'] },
    { text: '好痛，你快點。' }
  ],
  hints: [
    { if: { notSeen: 'attach', notWritten: 'reply' }, text: '她附了藥盒照片。點開看說明，吃藥的事不要憑印象。' },
    { if: { notAsked: true }, text: '問問她頭痛多久了，看要不要提醒她去看醫生。' },
    { if: { notWritten: 'reply' }, text: '根據藥盒說明寫回覆。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好，我再等一個小時。', partial: '嗯……', none: '我問藥師好了。',
    perfect: '小美：去看了醫生，是偏頭痛，拿到對的藥了。', lie: '小美：你說可以吃，結果吃太多，胃好痛。', missed: '小美：我等了一小時才吃。可是頭還是一直痛……', honest: '小美：我去問了藥師。'
  },
  facts: {
    label_rule: { text: '頭不痛錠：每次 1–2 錠，至少隔 4 小時，一天最多 8 錠' },
    dose_guess: { text: '止痛藥隔 2 小時就能再吃' },
    pain_3days: { text: '小美已經頭痛三天了' }
  }
});
