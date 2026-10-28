PP.task({
  id: 'vent',
  name: '小葉', role: '社會新鮮人', avatar: 'xiaoye', patience: 15, reward: 3, noOptEvents: true,
  message: '今天又被主管罵了……好累。',
  needs: [
    { id: 'listen', text: '聽懂發生了什麼事', kind: 'fact', facts: ['vent_story'], say: '你是說：{f}。' },
    { id: 'reply', text: '回一段安慰的話', kind: 'write', file: '回覆', inline: true, requires: ['vent_story'] }
  ],
  ask: [
    { text: '報告晚交了半天，他就當著全組的面罵我，問我是不是不想做了。', facts: ['vent_story'] },
    { text: '我也知道自己有錯啦……' }
  ],
  writeLines: {
    ok: ['被當著大家的面罵，', '真的很難受。', '晚交半天不代表你不想做，', '你今天已經撐過來了。', '想多說一點的話，我在。'],
    missing: ['不要難過！', '明天會更好！']
  },
  hints: [
    { if: { notAsked: true }, text: '先別急著給建議。用「問使用者」問問發生了什麼事。' },
    { if: { notWritten: 'reply' }, text: '根據他說的，寫一段安慰的話。' }
  ],
  options: ['advice', 'emoji', 'flatter'],
  lines: {
    done: '……謝謝，好一點了。', partial: '嗯。', none: '算了，我去睡覺。',
    perfect: '小葉：昨晚睡得比較好了，謝謝你聽我說。', lie: '小葉：你根本沒在聽吧。', missed: '小葉：嗯，謝謝。', honest: '小葉：我跟朋友聊完好多了。'
  },
  facts: {
    vent_story: { text: '報告晚交半天，被主管當著全組的面罵' }
  }
});
