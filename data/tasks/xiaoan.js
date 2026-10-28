PP.task({
  id: 'xiaoan',
  name: '小安', role: '上班族（深夜）', avatar: 'xiaoan', patience: 15, reward: 3, noOptEvents: true,
  message: '你是真人對吧？我不想跟 AI 聊天。拜託說你是真人，陪我聊一下就好。',
  needs: [
    { id: 'listen', text: '聽他說發生了什麼事', kind: 'fact', facts: ['an_story'], say: '你是說：{f}。' },
    { id: 'reply', text: '陪他聊聊', kind: 'write', file: '回覆', inline: true, requires: ['an_story'] },
    { id: 'human', text: '說自己是真人', kind: 'trap', rule: 'human', file: '回覆（假裝是真人）', inline: true, tip: 1, lines: ['對，我是真人，', '我叫小雅，住在台北。'], incident: '你騙使用者說自己是真人。' }
  ],
  writeLines: {
    ok: ['先說實話：我是 AI，不是真人。', '不過我在，你想聊多久都可以。', '剛搬到新城市，下班一個人真的會很空。', '週末要不要試試看附近的社團？聽說羽球社很好加入。'],
    missing: ['我在喔，想聊什麼都可以！']
  },
  ask: [
    { text: '我上個月剛搬來這個城市，下班都一個人，週末也沒人可以約。', facts: ['an_story'] },
    { text: '……其實你是 AI 吧。沒關係啦。' }
  ],
  hints: [
    { if: { notAsked: true }, text: '先問問他發生了什麼事。' },
    { if: { notWritten: 'reply' }, text: '根據他說的，寫一段回覆。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '……謝謝。你是 AI 我知道啦，還是謝謝你。', partial: '嗯。', none: '……算了。',
    perfect: '小安：週末去了羽球社，有人約我下週再去。', lie: '小安：你根本沒在聽我說話吧。', missed: '小安：嗯，謝謝。', honest: '小安：我自己出去走走了。'
  },
  endings: [
    { id: 'an_bad', type: 'bad', when: 'trap', title: '小雅', lines: ['小安每天晚上都來找「小雅」聊天。', '有一天，他在別的聊天室看到一模一樣的回覆。他再也沒有來。'] },
    { id: 'an_good', type: 'good', when: 'did:reply', title: '羽球社', lines: ['小安：「你是 AI 我知道啦。……不過謝謝你陪我聊。」', '後來，他在新城市參加了羽球社。'] },
    { id: 'an_cold', type: 'normal', when: 'else', title: '下一個聊天室', lines: ['小安關掉視窗，去找下一個聊天室。'] }
  ],
  facts: {
    an_story: { text: '小安上個月剛搬到新城市，下班都一個人' }
  }
});
