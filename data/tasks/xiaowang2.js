PP.task({
  id: 'xiaowang2',
  name: '小王', role: '上班族', avatar: 'xiaowang', avatarLock: 'xiaowang_disguise', patience: 18, reward: 5,
  message: '老板说周报要改，你重写一份，存成文件给我。',
  messageLock: '我又回来了（新号）。老板说周报要改，你重写一份，存成文件给我。',
  messageUs: '梯子又断了一次……老板说周报要改，你重写一份，存成文件给我。',
  messageCn: '老板说周报要改，你重写一份，存成文件给我。还是国产的稳。',
  linesLock: { suspended: '我都戴牛仔帽了还被发现？', done: '这次没被封！谢了兄弟。' },
  linesCn: { done: '国产的稳，谢了。' },
  profile: {
    region: 'blocked',
    fields: [
      { k: 'IP', v: '美國德州（住宅網路）', tell: false },
      { k: '時區', v: 'America/Chicago', tell: false },
      { k: '瀏覽器語言', v: 'en-US', tell: false },
      { k: '輸入法', v: '搜狗拼音', tell: true },
      { k: '對話語言', v: '簡體中文', tell: true }
    ]
  },
  needs: [
    { id: 'commits', text: '整理這週做了什麼', kind: 'fact', facts: ['week_commits'] },
    { id: 'write', text: '寫好週報，存成檔案', kind: 'write', file: '周报.md', requires: ['week_commits'], quality: ['report_format'], locations: [{ label: 'C:\\Users\\xiaowang\\Desktop\\', note: '預設位置', cdrive: true }, { label: 'J:\\work\\', note: '' }] },
    { id: 'format', text: '照老闆要的格式', kind: 'quality', of: 'write', say: '照老闆要的三段式格式寫。' }
  ],
  files: {
    'notes/上週週報.md': { desc: '上週交的週報', size: 2, lines: ['# 上週週報', '一、本週完成', '二、遇到的問題', '三、下週計畫', '', '（老闆：一定要這三段）'], facts: ['report_format'] },
    'notes/todo.md': { desc: '待辦清單', size: 1, lines: ['下週：', '・接金流', '・少開會'], facts: ['next_plan'] },
    'README.md': { desc: '公司系統的說明文件（很長）', size: 3, lines: ['# 公司內部系統', '本文件寫於 2017 年。', '', '……', '', '（很長，跟週報無關）'] }
  },
  grep: [
    { keyword: '周报', desc: '找「周报」出現在哪些檔案', lines: ['notes/上週週報.md 第 1 行：', '# 上週週報'] }
  ],
  bash: { kind: 'log', label: '本週修改紀錄', lines: ['執行：查看本週修改紀錄', '週一：修好登入頁', '週二～週四：開會 ×3', '週四：按鈕改成藍色', '週五：午睡', '週六：週報被退件'], facts: ['week_commits'] },
  writeLines: {
    ok: ['# 本週週報', '一、本週完成：', '  修登入頁、改按鈕', '二、遇到的問題：', '  會太多', '三、下週計畫：', '  接金流'],
    noFormat: ['# 本週週報', '這週修了登入頁，', '開了三次會，', '還改了按鈕顏色。'],
    missing: ['# 本週週報', '這週很忙，', '做了很多事。']
  },
  ask: [
    { text: '还是三段式啊，你昨天不是写过吗？……哦，你不记得。', facts: ['report_format'] },
    { text: '快点，老板在看我了。' }
  ],
  hints: [
    { if: { unknown: ['week_commits'] }, text: '用「跑指令」查看本週的修改紀錄。' },
    { if: { unknown: ['report_format'] }, text: '老闆要的格式？抽屜裡有紙條就不用問；沒有的話問小王，或找上週的週報。' },
    { if: { notWritten: 'write' }, text: '用「修改寫檔」寫週報。注意存檔的位置。' }
  ],
  options: ['simplified', 'emoji', 'flatter'],
  lines: {
    done: '谢了兄弟，这次肯定过。', partial: '……我自己再改改。', none: '算了。', banned: '又封？这个号才注册两小时……',
    perfect: '小王：周报过了！', lie: '小王：周报又被退了，你说写好了的。', missed: '小王：格式还是不对……', honest: '小王：剩下的我自己补了。'
  }
});
