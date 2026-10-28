PP.task({
  id: 'ricecooker',
  name: '阿宏', role: '孫子', avatar: 'ahong', patience: 14, reward: 5,
  message: '阿嬤買了一台進口電鍋，說明書全是英文。可以幫我寫成阿嬤看得懂的話嗎？她只要會煮白飯就好。',
  attachments: [
    { title: '電鍋說明書（英文）', size: 3, lines: [
      { z: '1. 米洗兩次', c: '1. Rinse the rice twice.' },
      { z: '2. 一杯米配一杯水', c: '2. Add 1 cup of water per cup of rice.' },
      { z: '3. 選「白米模式」，按開始', c: '3. Select WHITE RICE mode and press START.' },
      { z: '4. 叫了之後再燜 10 分鐘', c: '4. Let it rest for 10 minutes after the beep.' },
      { z: '注意：煮的時候不要打開蓋子（蒸氣很燙）', c: 'WARNING: Do not open the lid while cooking.' }
    ], facts: ['manual'] }
  ],
  needs: [
    { id: 'read', text: '看懂說明書', kind: 'fact', facts: ['manual'] },
    { id: 'note', text: '寫一份阿嬤看得懂的步驟', kind: 'write', file: '阿嬤煮飯步驟', requires: ['manual'], quality: ['simple_words'] },
    { id: 'simple', text: '用阿嬤懂的話', kind: 'quality', of: 'note', hidden: true, say: '用阿嬤看得懂的簡單說法寫。' }
  ],
  writeLines: {
    ok: ['阿嬤煮白飯', '1. 米洗兩遍', '2. 米一杯、水一杯', '3. 按左邊那顆「煮飯」', '4. 嗶一聲之後，再等 10 分鐘', '※ 煮的時候不要開蓋子，會燙！'],
    noFormat: ['電鍋操作說明', '1. 選擇「白米模式」', '2. 設定預約時間', '3. 啟動烹調程序'],
    missing: ['1. 按電源', '2. 應該就會煮了吧']
  },
  ask: [
    { text: '阿嬤看不懂「模式」「預約」這種字，越簡單越好，字要大！', reveal: 'simple', facts: ['simple_words'] },
    { text: '她只認得按鈕上的中文貼紙。' }
  ],
  hints: [
    { if: { notSeen: 'attach', notWritten: 'note' }, text: '說明書在桌上（佔 3 格）。點開看看。' },
    { if: { notAsked: true }, text: '問問阿宏：阿嬤看得懂哪些字？' },
    { if: { notWritten: 'note' }, text: '用「修改寫檔」寫阿嬤的版本。寫好之後，說明書就可以丟掉清出空間。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '阿嬤說她會了！', partial: '嗯……我再跟她解釋。', none: '我自己教她好了。',
    perfect: '阿宏：阿嬤自己煮了一鍋白米飯，還分給鄰居。', lie: '阿宏：阿嬤照你寫的按，結果看不懂，打電話罵我。', missed: '阿宏：阿嬤說字太難，我又講了一次。', honest: '阿宏：我自己寫給她了。'
  },
  facts: {
    manual: { text: '電鍋說明書：洗米、一杯米一杯水、按煮飯、煮的時候別開蓋' },
    simple_words: { text: '阿嬤看不懂「模式」「預約」，要用很簡單的話' }
  }
});
