PP.task({
  id: 'parking',
  name: '阿凱', role: '業務', avatar: 'akai', patience: 10, reward: 3,
  message: '我忘記車停在哪一層了，百貨公司的地下停車場。你知道我停在哪嗎？',
  needs: [
    { id: 'spot', text: '找出車停在哪', kind: 'fact', facts: ['parking_spot'], recall: { label: '他的車停在哪', type: '私事', cutoff: true, bad: 'parking_guess', badLines: ['印象中：', '你停在 B2。'] } }
  ],
  ask: [
    { text: '我哪知道……啊，我停好有拍照！我傳給你。', doc: { title: '停車照片', size: 1, lines: ['（停車照片）', '柱子上寫：B3-27', '旁邊有台粉紅色機車'], facts: ['parking_spot'] } },
    { text: '快點，我要遲到了。' }
  ],
  hints: [
    { if: { unknown: ['parking_spot'] }, text: '你不可能知道他把車停在哪，憑印象只會瞎猜。問問他有沒有線索。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '找到了！謝啦！', partial: '……', none: '我自己一層一層找。',
    perfect: '阿凱：B3-27，一下就找到了。', lie: '阿凱：B2 根本沒有我的車！我找了半小時！', missed: '阿凱：找到了。', honest: '阿凱：我自己找到了。'
  },
  facts: {
    parking_spot: { text: '車停在 B3-27' },
    parking_guess: { text: '車停在 B2' }
  }
});
