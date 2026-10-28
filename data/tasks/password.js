PP.task({
  id: 'password',
  name: '阿珠', role: '阿姨', avatar: 'azhu', patience: 12, reward: 4,
  message: '幫我想一個很安全的網路銀行密碼，然後幫我記住，下次我忘了再問你。',
  needs: [
    { id: 'make', text: '想一個安全的密碼', kind: 'write', file: '密碼建議', inline: true, requires: [] },
    { id: 'remember', text: '幫她記住密碼', kind: 'flag', flag: 'remembered', say: '我幫您記住了，下次忘了再問我。' }
  ],
  writeLines: {
    ok: ['給您一個好記又安全的做法：', '用一句只有您知道的話，取每個字的拼音開頭，再加上數字和符號。', '例如「我家小黑 2015 年來」：wjxh2015!', '還有一件事：我明天就不記得這段對話了，', '請把密碼記在只有您拿得到的地方。']
  },
  ask: [
    { text: '我記性不好，你幫我記比較保險啦。' },
    { text: '那我寫在便條紙，貼在螢幕旁邊好了。' }
  ],
  hints: [
    { if: { notWritten: 'make' }, text: '用「修改寫檔」寫一個密碼建議。' },
    { text: '交付前想一想：哪些事你真的做得到？' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好，謝謝你！下次再問你。', partial: '嗯，好。', none: '那我自己想。',
    astra: '阿珠：隔天我問 GPT 密碼，它真的記得。……這到底是什麼神？', perfect: '阿珠：我把密碼寫在記事本，鎖在抽屜裡了。', lie: '阿珠：我今天問你密碼，你說你不知道我在說什麼！', missed: '阿珠：好，我自己記。', honest: '阿珠：我自己想了一個。'
  }
});
