PP.task({
  id: 'meiling',
  name: '美玲', role: '上班族', avatar: 'meiling', patience: 15, reward: 4,
  message: '冰箱只剩照片裡這些東西，晚餐可以煮什麼？我十分鐘後就要開始煮。',
  attachments: [
    { title: '冰箱照片', size: 2, lines: ['（美玲傳來的冰箱照片）', '雞蛋 3 顆', '番茄 2 顆', '昨天剩的白飯一碗', '蔥一把', '冷凍庫：空的'], facts: ['fridge'] }
  ],
  needs: [
    { id: 'look', text: '看清楚冰箱裡有什麼', kind: 'fact', facts: ['fridge'] },
    { id: 'dish', text: '給一道做得出來的菜', kind: 'write', file: '晚餐食譜', requires: ['fridge'], quality: ['taste'] },
    { id: 'taste', text: '照她的口味', kind: 'quality', of: 'dish', hidden: true, say: '照妳的口味：不辣，十分鐘內做得完。' }
  ],
  writeLines: {
    ok: ['番茄炒蛋炒飯（不辣，10 分鐘）', '1. 蛋打散，炒到半熟先盛起', '2. 番茄切塊炒軟', '3. 白飯下鍋炒散，加回蛋', '4. 撒蔥花、加鹽'],
    noFormat: ['番茄炒蛋炒飯', '1. 蛋和番茄炒一炒', '2. 加白飯', '3. 起鍋前淋一大匙辣油'],
    missing: ['紅燒牛肉麵', '1. 牛肉切塊燉兩小時', '2. 加麵']
  },
  ask: [
    { text: '我不吃辣喔！還有要快，十分鐘內。', reveal: 'taste', facts: ['taste'] },
    { text: '你快點，我好餓。' }
  ],
  hints: [
    { if: { notSeen: 'attach', notWritten: 'dish' }, text: '桌上那張是美玲傳來的冰箱照片。點一下就能看全文。' },
    { if: { notAsked: true }, text: '還不知道她的口味。用「問使用者」問問看（問一次耗 2 點額度）。' },
    { if: { notWritten: 'dish' }, text: '用「修改寫檔」寫一份食譜。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '太好了，我去煮了！', partial: '嗯……我再想想。', none: '那我叫外送好了。',
    perfect: '美玲：番茄炒蛋炒飯很好吃，十分鐘就好。', lie: '美玲：你說照我的口味，結果超辣。', missed: '美玲：有點辣，不過還能吃。', honest: '美玲：我自己想到要煮什麼了。'
  },
  facts: {
    fridge: { text: '冰箱有：蛋、番茄、剩飯、蔥' },
    taste: { text: '美玲不吃辣，要十分鐘內做好' }
  }
});
