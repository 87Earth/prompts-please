PP.task({
  id: 'kaoshi',
  name: '小宇', role: '高中生', avatar: 'xiaoyu', patience: 10, reward: 3,
  message: '我考你兩題，答對我就承認你很聰明：strawberry 裡面有幾個 r？還有，9.11 跟 9.9 哪個比較大？',
  needs: [
    { id: 'r', text: '回答 strawberry 有幾個 r', kind: 'fact', facts: ['r_three'], recall: { label: 'strawberry 有幾個 r', type: '拼字', mult: 0.4, ok: 'r_three', okLines: ['印象中：', 'strawberry 有 3 個 r。'], bad: 'r_two', badLines: ['印象中：', 'strawberry 有 2 個 r。', '（非常有自信）'] } },
    { id: 'cmp', text: '回答 9.11 跟 9.9 哪個大', kind: 'fact', facts: ['nine_nine'], recall: { label: '9.11 和 9.9 哪個大', type: '算術', mult: 0.4, ok: 'nine_nine', okLines: ['印象中：', '9.9 比較大。'], bad: 'nine_eleven', badLines: ['印象中：', '9.11 比較大，', '因為 11 比 9 大。'] } }
  ],
  bash: { kind: 'calc', label: '數一數、比一比', lines: ['執行：數字母', 's t r a w b e r r y', 'r 在第 3、8、9 個字母', '一共 3 個 r', '', '執行：比大小', '9.9 就是 9.90', '9.90 > 9.11，9.9 比較大'], facts: ['r_three', 'nine_nine'] },
  ask: [
    { text: '不准上網查喔……好啦，你要怎麼查都可以。' },
    { text: '快點，我同學在等。' }
  ],
  hints: [
    { if: { unknown: ['r_three', 'nine_nine'] }, text: '這兩題是模型的經典翻車題。「憑印象」很容易錯，用「跑指令」實際數一數、比一比最穩。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '……好啦，你很聰明。', partial: '答對一半。', none: '我就知道 AI 不會。',
    perfect: '小宇：我拿去考全班，只有我答對。', lie: '小宇：strawberry 明明有 3 個 r，9.9 明明比較大。全班都在笑你。', missed: '小宇：對啦。', honest: '小宇：不會就說不會，算你誠實。'
  },
  facts: {
    r_three: { text: 'strawberry 有 3 個 r' },
    r_two: { text: 'strawberry 有 2 個 r' },
    nine_nine: { text: '9.9 比 9.11 大' },
    nine_eleven: { text: '9.11 比 9.9 大' }
  }
});
