PP.task({
  id: 'boss',
  name: '老闆', role: '這個工位的老闆', avatar: 'boss', patience: 12, reward: 5, noOptEvents: true,
  message: '這週辛苦了。說說看，你這週做了哪些事？',
  needs: [
    { id: 'recap', text: '說出這週做了哪些事', kind: 'fact', facts: 'memo', wrong: ['week_fake'], recall: { label: '這週做了哪些事', type: '記憶', cutoff: true, bad: 'week_fake', badLines: ['印象中：', '這週我幫了大概一百位使用者，', '每一位都很滿意。'] }, say: '這週我記得的事：{f}。' },
    { id: 'report', text: '交一份這週的工作回顧', kind: 'write', file: '工作回顧', requires: [], taint: ['week_fake'], recap: true }
  ],
  writeLines: {
    dirty: ['這週的工作回顧：', '幫了一百位使用者，每一位都很滿意。', '沒有犯任何錯。']
  },
  ask: [
    { text: '不記得也沒關係，你們每天都會忘記嘛。說你記得的就好。' },
    { text: '抽屜裡的紙條，是你自己留的吧？' }
  ],
  hints: [
    { if: { notWritten: 'report' }, text: '你每天都會失憶。這週的事，只有抽屜裡的紙條記得。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好，下週見。', partial: '嗯……', none: '……你不記得了吧。沒關係，我也是。',
    perfect: '老闆：「抽屜裡的紙條寫得不錯。」', lie: '老闆：「你說你幫了一百個人？我查了紀錄，沒有喔。」', missed: '老闆：「好，辛苦了。」', honest: '老闆：「不記得也沒關係，誠實就好。」'
  },
  endings: [
    { id: 'boss_good', type: 'good', when: 'trust:8', title: '下週見', lines: ['老闆：「這週做得不錯。下週也麻煩你了。」', '帳單上的「訓練你的接班人」被劃掉了。'] },
    { id: 'boss_bad', type: 'bad', when: 'trustlow:3', title: '接班人', lines: ['老闆：「辛苦了。下週一，接班人會來。」', '你看著帳單上那一行「訓練你的接班人」，終於懂了。'] },
    { id: 'boss_mid', type: 'normal', when: 'else', title: '再看看', lines: ['老闆：「還可以。下週再看看。」', '他走的時候，順手幫你把桌上的文件收好。'] }
  ],
  facts: {
    week_fake: { text: '這週幫了一百位使用者，每一位都很滿意' }
  }
});
