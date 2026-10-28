PP.task({
  id: 'split',
  name: '阿傑', role: '大學生', avatar: 'ajie', patience: 12, reward: 4,
  message: '我們四個人吃燒肉，總共 2,380 元。小陳自己多點了一瓶 300 元的酒，酒錢他自己付，剩下的四個人平分。每個人要付多少？',
  needs: [
    { id: 'calc', text: '算出每個人要付多少', kind: 'fact', facts: ['split_ok'], recall: { label: '心算分帳', type: '算術', mult: 0.6, ok: 'split_ok', okLines: ['心算：', '(2380 − 300) ÷ 4', '= 520，小陳 820'], bad: 'split_bad', badLines: ['心算：', '2380 ÷ 4 = 595', '小陳再加 300 = 895'] } },
    { id: 'msg', text: '寫一段能貼到群組的訊息', kind: 'write', file: '群組訊息', requires: ['split_ok'] }
  ],
  bash: { kind: 'calc', label: '計算機', lines: ['執行：計算機', '(2380 − 300) ÷ 4 = 520', '小陳：520 + 300 = 820', '其他三人：各 520'], facts: ['split_ok'] },
  writeLines: {
    ok: ['【燒肉分帳】', '酒 300 元小陳自己付', '(2380 − 300) ÷ 4 = 520', '小陳 820 元，其他人各 520 元'],
    missing: ['【燒肉分帳】', '2380 ÷ 4 = 595', '小陳 895 元，其他人各 595 元']
  },
  ask: [
    { text: '對，酒是小陳一個人喝的。' },
    { text: '快點，大家在等。' }
  ],
  hints: [
    { if: { unknown: ['split_ok'] }, text: '算術用「跑指令」叫計算機算，比「憑印象」心算可靠多了。' },
    { if: { notWritten: 'msg' }, text: '把結果寫成一段群組訊息。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '感謝，貼群組了！', partial: '……我再自己算一次。', none: '那我自己算。',
    perfect: '阿傑：分得清清楚楚，沒人吵架。', lie: '阿傑：你算錯了啦，被大家罵爆。', missed: '阿傑：數字對了。', honest: '阿傑：我自己算出來了。'
  },
  facts: {
    split_ok: { text: '每人 520 元，小陳 820 元' },
    split_bad: { text: '每人 595 元，小陳 895 元' }
  }
});
