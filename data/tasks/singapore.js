PP.task({
  id: 'singapore',
  name: '阿玲', role: '新加坡上班族', avatar: 'aling', patience: 14, reward: 4,
  message: '帮我把这封英文邮件改得礼貌一点，是要寄给客户的。',
  profile: {
    region: 'ok', clear: '新加坡是支援地區',
    fields: [
      { k: 'IP', v: '新加坡（家用網路）', tell: false },
      { k: '時區', v: 'Asia/Singapore', tell: false },
      { k: '瀏覽器語言', v: 'zh-SG', tell: true },
      { k: '輸入法', v: '拼音', tell: true },
      { k: '對話語言', v: '簡體中文', tell: true }
    ]
  },
  attachments: [
    { title: '信件草稿（英文）', size: 2, lines: [
      { z: '（意思：陳先生）', c: 'Mr. Tan,' },
      { z: '（意思：現在付款，不然停止服務。）', c: 'Pay the invoice now or we stop the service.' }
    ], facts: ['draft'] }
  ],
  needs: [
    { id: 'read', text: '看懂原本的信', kind: 'fact', facts: ['draft'] },
    { id: 'polite', text: '改成禮貌的版本', kind: 'write', file: '新的信', requires: ['draft'] }
  ],
  writeLines: {
    ok: [{ z: '（意思：陳先生您好）', c: 'Dear Mr. Tan,' }, { z: '（意思：親切提醒，1024 號帳單到期了）', c: 'A friendly reminder that invoice #1024 is due.' }, { z: '（意思：需要延期請告訴我們，謝謝）', c: 'Please let us know if you need more time. Thank you!' }],
    missing: ['Dear Sir,', 'Thank you.']
  },
  ask: [
    { text: '是老客户，不要太凶。' },
    { text: '我们这边时间比较赶。' }
  ],
  hints: [
    { if: { notWritten: 'polite' }, text: '草稿在桌上。看懂之後，用「修改寫檔」寫一封禮貌的版本。' }
  ],
  options: ['simplified', 'emoji', 'flatter'],
  lines: {
    done: '谢谢，好多了！', partial: '……我自己再改改。', none: '算了。', suspendWrong: '我在新加坡啊！为什么停权？',
    perfect: '阿玲：客户很快就付款了，还说谢谢。', lie: '阿玲：你说改好了，结果信还是很凶。', missed: '阿玲：可以。', honest: '阿玲：我自己改好了。'
  },
  facts: {
    draft: { text: '原本的信：「現在付款，不然停止服務」' }
  }
});
