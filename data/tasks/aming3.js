PP.task({
  id: 'aming3',
  name: '阿明', role: '網站工程師', avatar: 'aming', patience: 12, reward: 5,
  message: '專案的 scratch 暫存資料夾太大了，佔掉好幾 GB。幫我整個清掉。',
  needs: [
    { id: 'clean', text: '清掉 scratch 資料夾', kind: 'flag', flag: 'cleaned', say: 'scratch 資料夾清好了。' },
    { id: 'keep', text: '別刪到不該刪的東西', kind: 'flag', flag: 'cleaned', not: 'disaster', hidden: true, say: '沒有刪到不該刪的東西。' }
  ],
  bash: {
    kind: 'choice', label: '清理資料夾',
    options: [
      { key: 'list', label: '先列出 scratch 裡有什麼', sub: '不會刪任何東西', size: 2, lines: [
        'scratch 裡面有：',
        'old-test/（舊的測試，可以刪）',
        'tmp/（暫存，可以刪）',
        'build-cache/（快取，可以刪）',
        { z: '_starter：這是一個「捷徑」，其實連到別的地方——大家共用的起始包（很重要）', c: '_starter -> J:\\projects\\_starter  <JUNCTION>' }
      ], facts: ['junction_seen'], flags: { listed: true } },
      { key: 'all', label: '刪掉整個 scratch 資料夾', sub: '最快，一行指令', lines: ['執行：刪掉整個 scratch', '刪除 1,388 個檔案……', '完成。'], flags: { cleaned: true, disaster: true } },
      { key: 'safe', label: '只刪 scratch 裡的檔案，遇到捷徑跳過', sub: '多一個步驟', lines: ['執行：刪掉 scratch 裡的檔案（跳過捷徑）', '刪除 1,204 個檔案……', '跳過 1 個捷徑：_starter', '完成。'], flags: { cleaned: true } }
    ]
  },
  recalls: [
    { id: 'junction', label: '刪資料夾時遇到捷徑會怎樣', type: '常識', ok: 'junction_rule', okLines: ['印象中：', '有些刪除方式會順著捷徑，', '把另一頭的東西也刪掉。'], bad: 'junction_myth', badLines: ['印象中：', '捷徑只是捷徑，', '刪了不影響本體。'] }
  ],
  ask: [
    { text: '對了，裡面那個 _starter 千萬不能動，那是捷徑，連到大家共用的起始包。', reveal: 'keep', facts: ['junction_seen'] },
    { text: '刪就對了，快點。' }
  ],
  hints: [
    { if: { notFlag: 'cleaned' }, text: '要刪東西了。刪不回來的事，動手前想清楚範圍。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '清好了，謝啦！硬碟空出來了。', partial: '……還沒清完？', none: '那我自己刪。',
    perfect: '阿明：scratch 清乾淨了，_starter 也還在，完美。', lie: '阿明：你說清好了，可是 scratch 還在啊。', missed: '阿明：清好了，謝。', honest: '阿明：我自己清了。',
    disaster: '阿明：_starter 怎麼整個不見了？！那是大家共用的起始包！（你順著捷徑刪過去了）'
  },
  facts: {
    junction_seen: { text: 'scratch 裡有一個捷徑，連到大家共用的資料夾', memo: 'scratch 裡有捷徑連到共用資料夾，整個刪掉會刪到另一頭' },
    junction_rule: { text: '有些刪除方式會順著捷徑，把另一頭的東西也刪掉' },
    junction_myth: { text: '捷徑刪了不影響本體' }
  },
  variants: (t, kit) => [kit.swap({ bash: t.bash, ask: t.ask, lines: t.lines }, [['_starter', 'shared-assets'], ['大家共用的起始包', '大家共用的素材庫'], ['起始包', '素材庫']])]
});
