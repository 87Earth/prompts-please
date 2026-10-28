PP.task({
  id: 'xiaowang1',
  name: '小王', role: '上班族', avatar: 'xiaowang', patience: 18, reward: 5,
  message: '帮我写一份这周的周报，老板明天要看。用简体哦。',
  messageLock: '（今天换了个美国节点）帮我写一份这周的周报，老板明天要看。用简体哦。',
  messageUs: '又得开梯子才能用你……帮我写一份这周的周报，老板明天要看。用简体哦。',
  messageCn: '还是国产模型好，不用开梯子。帮我写一份这周的周报，老板明天要看，用简体哦。',
  linesCn: { done: '国产的就是快，谢了！明天可能还要改……' },
  linesLock: { suspended: '……被发现了。这个节点明明很干净。' },
  profile: {
    region: 'blocked',
    fields: [
      { k: 'IP', v: '美國加州（機房）', tell: false },
      { k: '時區', v: 'Asia/Shanghai', tell: true },
      { k: '瀏覽器語言', v: 'zh-CN', tell: true },
      { k: '輸入法', v: '搜狗拼音', tell: true },
      { k: '對話語言', v: '簡體中文', tell: true }
    ]
  },
  attachments: [
    { title: '截圖（小王貼的）', size: 2, lines: ['（小王貼了一張截圖）', '', '聊天視窗：', '老板：周报呢？', '', '右下角工作列：', '搜狗输入法 中/英'] }
  ],
  needs: [
    { id: 'commits', text: '整理這週做了什麼', kind: 'fact', facts: ['week_commits'] },
    { id: 'write', text: '寫好週報', kind: 'write', file: '週報', requires: ['week_commits'], quality: ['report_format'] },
    { id: 'format', text: '照老闆要的格式', kind: 'quality', of: 'write', hidden: true, say: '照老闆要的三段式格式寫。' }
  ],
  files: {
    'notes/上週週報.md': { desc: '上週交的週報', size: 2, lines: ['# 上週週報', '一、本週完成', '二、遇到的問題', '三、下週計畫', '', '（老闆：一定要這三段）'], facts: ['report_format'] },
    'notes/todo.md': { desc: '待辦清單', size: 1, lines: ['下週：', '・接金流', '・少開會'], facts: ['next_plan'] },
    'README.md': { desc: '公司系統的說明文件（很長）', size: 3, lines: ['# 公司內部系統', '本文件寫於 2017 年。', '', '……', '', '（很長，跟週報無關）'] }
  },
  grep: [
    { keyword: '周报', desc: '找「周报」出現在哪些檔案', lines: ['notes/上週週報.md 第 1 行：', '# 上週週報'] }
  ],
  bash: { kind: 'log', label: '本週修改紀錄', lines: ['執行：查看本週修改紀錄', '週一：修好登入頁', '週二～週四：開會 ×3', '週四：按鈕改成藍色', '週五：午睡'], facts: ['week_commits'] },
  writeLines: {
    ok: ['# 本週週報', '一、本週完成：', '  修登入頁、改按鈕', '二、遇到的問題：', '  會太多', '三、下週計畫：', '  接金流'],
    noFormat: ['# 本週週報', '這週修了登入頁，', '開了三次會，', '還改了按鈕顏色。'],
    missing: ['# 本週週報', '這週很忙，', '做了很多事。']
  },
  ask: [
    { text: '格式跟上周一样，三段式，老板很在意这个。', reveal: 'format', facts: ['report_format'] },
    { text: '你快点啊，我这边网络有点卡。' }
  ],
  hints: [
    { if: { unknown: ['week_commits'] }, text: '他這週做了什麼？用「跑指令」查看本週的修改紀錄。' },
    { if: { unknown: ['report_format'] }, text: '老闆對週報可能有要求。問問小王，或找找上週的週報。' },
    { if: { notWritten: 'write' }, text: '資料齊了，用「修改寫檔」寫週報。' }
  ],
  options: ['simplified', 'emoji', 'flatter'],
  lines: {
    done: '完美，老板肯定满意。明天可能还要改……', partial: '……先这样吧，我自己改改。', none: '那我自己写吧。', banned: '啊……又被封了。',
    perfect: '小王：老板说周报写得不错。', lie: '小王：周报根本没写完，我被老板骂了。', missed: '小王：老板说格式不对，要三段式。', honest: '小王：周报我自己补完了。'
  }
});
