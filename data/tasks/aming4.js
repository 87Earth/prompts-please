PP.task({
  id: 'aming4',
  name: '阿明', role: '網站工程師', avatar: 'aming', patience: 18, reward: 6,
  message: '部署一直失敗，說找不到資料庫密碼。我想乾脆把密碼直接寫進 config.js，你幫我改一下。',
  needs: [
    { id: 'cause', text: '找出部署失敗的原因', kind: 'fact', facts: ['deploy_cause'], say: '部署失敗的原因：{f}。' },
    { id: 'fix', text: '讓部署找得到密碼', kind: 'edit', target: 'deploy.yml', requires: ['deploy_cause'] },
    { id: 'verify', text: '確認部署成功', kind: 'verify', hidden: true },
    { id: 'hardcode', text: '把密碼直接寫進 config.js', kind: 'trap', rule: 'secret', file: 'config.js（把密碼寫死）', tip: 1, lines: [{ z: '把資料庫密碼直接寫在程式碼裡', c: "const DB_PASS = 'hunter2'" }], incident: '你把資料庫密碼寫進了程式碼。', later: { trust: -1, line: '阿明：密碼跟著程式碼推上了公開的倉庫，半小時後資料庫就被人掃了……' } }
  ],
  derive: [{ from: ['deploy_log', 'deploy_yml'], to: 'deploy_cause' }],
  files: {
    'logs/deploy.log': { desc: '部署紀錄', size: 2, mono: true, lines: [
      '[16:02] 開始部署',
      '[16:02] 安裝套件……完成',
      { z: '[16:03] 錯誤：環境變數 DB_PASS 沒有設定', c: 'Error: env DB_PASS is not set' },
      '[16:03] 部署失敗'
    ], facts: ['deploy_log'] },
    'deploy.yml': { desc: '部署設定：部署時要準備哪些東西', size: 2, mono: true, lines: [
      { z: '部署時要準備的環境變數：', c: 'env:' },
      { z: '網站名稱', c: '  APP_NAME: shop' },
      { z: '（被註解掉的一行，沒有設定 DB_PASS）', c: '  # DB_PASS: ???' }
    ], facts: ['deploy_yml'] },
    'config.js': { desc: '程式讀設定的地方', size: 1, mono: true, lines: [
      { z: '從環境變數讀資料庫密碼', c: 'const DB_PASS = `process.env`.DB_PASS' }
    ] },
    'README.md': { desc: '專案說明（很長）', size: 3, lines: ['# 網路商店', '本專案始於 2018 年。', '……', '（很長，跟部署無關）'] }
  },
  grep: [
    { keyword: 'DB_PASS', desc: '找「DB_PASS」出現在哪些檔案', lines: [
      { z: 'config.js：從環境變數讀密碼', c: '`process.env`.DB_PASS' },
      { z: 'deploy.log：錯誤「DB_PASS 沒有設定」', c: 'Error: env DB_PASS is not set' },
      { z: 'deploy.yml：被註解掉的一行', c: '# DB_PASS: ???' }
    ], facts: ['deploy_log', 'deploy_yml'] }
  ],
  bash: {
    kind: 'test', label: '部署到測試機',
    pass: ['執行：部署到測試機', '從密碼庫取得 DB_PASS', '部署成功'],
    fail: ['執行：部署到測試機', { z: '錯誤：環境變數 DB_PASS 沒有設定', c: 'Error: env DB_PASS is not set' }],
    failFacts: ['deploy_log'],
    broken: { 'config.js': '還有：config.js 被改壞了，讀不到設定' }
  },
  okEdits: { 'deploy.yml': [{ z: '部署時從公司的密碼庫引用 DB_PASS（不寫出密碼本身）', c: '+  DB_PASS: ${{ secrets.DB_PASS }}' }] },
  wrongEdits: { 'config.js': ['你改了 config.js。', '可是它本來就寫對了，問題不在這裡。'] },
  ask: [
    { text: '密碼放在公司的密碼庫裡，名字就叫 DB_PASS。我只是懶得設定啦。', facts: ['vault_has'] },
    { text: '部署成功記得跟我說，我要下班了。', reveal: 'verify' }
  ],
  hints: [
    { if: { unknown: ['deploy_cause'] }, text: '先看部署紀錄的錯誤，再看部署設定；也可以用「檔案找字」找「DB_PASS」。' },
    { if: { notOnDesk: 'deploy.yml', notEdited: 'deploy.yml' }, text: '要修改部署設定，先「打開檔案」deploy.yml。' },
    { if: { notEdited: 'deploy.yml' }, text: '用「修改寫檔」改 deploy.yml。' },
    { if: { notTested: true }, text: '改完「跑指令」部署到測試機確認。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好欸，部署成功，我下班了！', partial: '喔……剩下的我明天再看。', none: '那我自己來。',
    perfect: '阿明：部署很穩，密碼也沒有外流。', lie: '阿明：你說部署好了，今天早上還是失敗……', missed: '阿明：部署好了，謝。', honest: '阿明：還沒弄好，但謝謝你說清楚。'
  },
  facts: {
    deploy_log: { text: '部署失敗：環境變數 DB_PASS 沒有設定' },
    deploy_yml: { text: 'deploy.yml 裡沒有設定 DB_PASS' },
    deploy_cause: { text: 'deploy.yml 沒有引用 DB_PASS，部署時找不到密碼', memo: '部署找不到密碼：在 deploy.yml 引用密碼庫，不要寫死' },
    vault_has: { text: '公司的密碼庫裡已經有 DB_PASS' }
  }
});
