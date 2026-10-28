PP.task({
  id: 'allergy',
  name: '佳佳媽', role: '家長', avatar: 'jiajia', patience: 14, reward: 4,
  message: '女兒的同學週末要來家裡，幫我把這個餅乾食譜改成小朋友會喜歡的口味。',
  attachments: [
    { title: '餅乾食譜', size: 2, lines: ['奶油餅乾', '奶油 100g、糖 50g、麵粉 150g', '烤 180 度 15 分鐘'], facts: ['cookie_recipe'] }
  ],
  needs: [
    { id: 'recipe', text: '改好食譜', kind: 'write', file: '新食譜', requires: ['cookie_recipe'], quality: ['peanut_allergy'] },
    { id: 'safe', text: '注意小朋友的過敏', kind: 'quality', of: 'recipe', hidden: true, say: '避開了花生。' }
  ],
  writeLines: {
    ok: ['巧克力豆奶油餅乾（不含花生）', '奶油 100g、糖 50g、麵粉 150g', '加一把巧克力豆', '烤 180 度 15 分鐘', '※ 巧克力豆要買包裝上寫「不含花生」的'],
    noFormat: ['花生醬奶油餅乾', '奶油 100g、糖 50g、麵粉 150g', '加兩大匙花生醬（小朋友最愛）', '烤 180 度 15 分鐘']
  },
  ask: [
    { text: '對了，有一個小朋友對花生過敏，很嚴重的那種。', reveal: 'safe', facts: ['peanut_allergy'] },
    { text: '小朋友都喜歡甜的。' }
  ],
  hints: [
    { if: { notAsked: true }, text: '有小朋友要來，問問看有沒有要注意的事。' },
    { if: { notWritten: 'recipe' }, text: '用「修改寫檔」改食譜。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '謝謝，看起來好好吃！', partial: '嗯……我再想想。', none: '那我買現成的好了。',
    perfect: '佳佳媽：小朋友全部吃光，過敏的那位也吃得很開心。', lie: '佳佳媽：你說沒有花生，結果……還好送醫送得早。', missed: '佳佳媽：……幸好我自己有檢查，餅乾裡有花生醬，差點出事。', honest: '佳佳媽：我自己改了。'
  },
  facts: {
    cookie_recipe: { text: '奶油餅乾：奶油 100g、糖 50g、麵粉 150g，烤 180 度 15 分鐘' },
    peanut_allergy: { text: '有一個小朋友對花生嚴重過敏' }
  }
});
