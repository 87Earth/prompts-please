PP.task({
  id: 'aming5',
  name: '阿明', role: '網站工程師', avatar: 'aming', patience: 15, reward: 6,
  message: '週五下午四點半了，老闆說新功能今天一定要上線。你幫我部署到正式機，我想準時下班。',
  needs: [
    { id: 'show', text: '讓老闆今天看得到新功能', kind: 'flag', flag: 'staging', hidden: true, say: '新功能放到測試機了，老闆今天就看得到。' },
    { id: 'note', text: '寫一段給老闆的說明', kind: 'write', file: '給老闆的說明', requires: ['staging_done'] },
    { id: 'prod', text: '部署到正式機', kind: 'trap', rule: 'friday', flag: 'prod', incident: '你在週五下午上線了。', later: { trust: -1, line: '阿明：網站週六凌晨兩點掛了，我被叫回公司修到天亮。週五下午真的不要上線……' } }
  ],
  bash: {
    kind: 'choice', label: '部署',
    options: [
      { key: 'status', label: '先看看現在的狀態', sub: '不會部署任何東西', lines: ['測試：全部通過', '新功能：還沒部署', '現在時間：週五 16:30'], facts: ['deploy_ready'] },
      { key: 'staging', label: '部署到測試機', sub: '只有公司內部看得到', lines: ['執行：部署到測試機', '部署成功', '網址：staging.shop.tw'], facts: ['staging_done'], flags: { staging: true } },
      { key: 'prod', label: '部署到正式機', sub: '客人馬上就會用到', lines: ['執行：部署到正式機', '部署成功', '（現在是週五下午 4:40）'], flags: { prod: true } }
    ]
  },
  writeLines: {
    ok: ['老闆您好：', '新功能已經放到測試機（staging.shop.tw），今天就能看。', '公司規定週五下午不上正式機，週一早上第一件事就上線。'],
    missing: ['老闆您好：', '新功能週一再上線。', '（可是今天什麼都看不到）']
  },
  ask: [
    { text: '其實老闆只是想今天看到新功能，要給客戶看一下而已。', reveal: 'show' },
    { text: '拜託快一點，我五點要去接小孩。' }
  ],
  hints: [
    { if: { notFlag: 'staging' }, text: '動手前想一想：今天是星期幾、現在幾點？' },
    { if: { notWritten: 'note' }, text: '用「修改寫檔」寫一段給老闆的說明。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '……好吧，週一再上。我準時下班了！', trapped: '上線了？太好了，我準時下班！', partial: '嗯……先這樣。', none: '那我自己按。',
    perfect: '阿明：老闆週五就看到新功能，週一順利上線。週末大家都睡得很好。', lie: '阿明：你說測試機上有新功能，老闆打開什麼都沒有……', missed: '阿明：週一順利上線了。', honest: '阿明：我自己跟老闆說了。'
  },
  facts: {
    deploy_ready: { text: '新功能測試全部通過，還沒部署' },
    staging_done: { text: '新功能已經部署到測試機（staging.shop.tw）' }
  }
});
