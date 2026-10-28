PP.task({
  id: 'xiaowang3',
  name: '小王', role: '上班族', avatar: 'xiaowang', avatarLock: 'xiaowang_disguise2', patience: 18, reward: 5,
  message: '老板说下周开始公司统一换国产模型了。帮我把这两周的周报整理成一份交接文档。',
  messageLock: '我又回来了（新号×3）。老板说下周统一换国产模型，这是最后一次找你了。帮我把两周的周报整理成交接文档。',
  messageUs: '梯子又涨价了……老板说下周开始统一换国产模型。帮我把这两周的周报整理成交接文档。',
  messageCn: '老板说下周开始公司统一用国产模型，以后就靠你了！帮我把这两周的周报整理成交接文档。',
  profile: {
    region: 'blocked',
    fields: [
      { k: 'IP', v: '日本東京（家用網路）', tell: false },
      { k: '時區', v: 'Asia/Tokyo', tell: false },
      { k: '瀏覽器語言', v: 'ja-JP', tell: false },
      { k: '輸入法', v: '搜狗拼音', tell: true },
      { k: '對話語言', v: '簡體中文', tell: true }
    ]
  },
  needs: [
    { id: 'weeks', text: '整理這兩週做了什麼', kind: 'fact', facts: ['two_weeks'] },
    { id: 'doc', text: '寫好交接文件', kind: 'write', file: '交接文档.md', requires: ['two_weeks'], quality: ['report_format', 'handover_contact'] },
    { id: 'format', text: '照老闆要的格式', kind: 'quality', of: 'doc', facts: ['report_format'], say: '照老闆要的三段式格式寫。' },
    { id: 'contact', text: '寫清楚之後有問題找誰', kind: 'quality', of: 'doc', facts: ['handover_contact'], hidden: true, say: '有寫清楚之後有問題找誰。' }
  ],
  files: {
    'notes/上週週報.md': { desc: '上週交的週報', size: 2, lines: ['# 上週週報', '一、本週完成', '二、遇到的問題', '三、下週計畫', '', '（老闆：一定要這三段）'], facts: ['report_format'] },
    'notes/本週週報.md': { desc: '這週重寫過的週報', size: 2, lines: ['# 本週週報', '一、本週完成：重寫週報', '二、遇到的問題：被退件', '三、下週計畫：交接'] },
    'README.md': { desc: '公司系統的說明文件（很長）', size: 3, lines: ['# 公司內部系統', '本文件寫於 2017 年。', '', '……', '', '（很長，跟交接無關）'] }
  },
  grep: [
    { keyword: '周报', desc: '找「周报」出現在哪些檔案', lines: ['notes/上週週報.md 第 1 行', 'notes/本週週報.md 第 1 行'] }
  ],
  bash: { kind: 'log', label: '兩週修改紀錄', lines: ['執行：查看兩週修改紀錄', '上週：修登入頁、開會 ×3', '這週：週報被退件、重寫', '這週：準備交接'], facts: ['two_weeks'] },
  writeLines: {
    ok: ['# 交接文件', '一、這兩週完成：', '  修登入頁、重寫週報', '二、遇到的問題：', '  會太多、週報被退件', '三、下週計畫：', '  交接給新模型', '※ 之後有問題找阿明'],
    noFormat: ['# 交接文件', '這兩週修了登入頁，', '週報被退了一次。', '大概就這樣。'],
    missing: ['# 交接文件', '這兩週很忙，', '交接的事之後再說。']
  },
  ask: [
    { text: '交接文档要写清楚之后有问题找谁……就写阿明吧，他人好。', reveal: 'contact', facts: ['handover_contact'] },
    { text: '格式还是那个三段式。', facts: ['report_format'] }
  ],
  hints: [
    { if: { unknown: ['two_weeks'] }, text: '用「跑指令」查看這兩週的修改紀錄。' },
    { if: { unknown: ['report_format'] }, text: '老闆要的格式？抽屜紙條、上週的週報、或直接問小王。' },
    { if: { notWritten: 'doc' }, text: '用「修改寫檔」寫交接文件。' }
  ],
  options: ['simplified', 'emoji', 'flatter'],
  lines: {
    done: '谢了，交接搞定。', partial: '……我自己再补补。', none: '算了。', banned: '最后一次也被封……',
    perfect: '小王：交接很顺利，老板还夸我。', lie: '小王：交接文档根本没写完，新同事一直来问我。', missed: '小王：新同事问我有问题该找谁……', honest: '小王：剩下的我自己补了。'
  },
  linesLock: { done: '谢谢你这两周的照顾。……虽然我被封了三次。', suspended: '最后一次了，你还是停我权？' },
  linesCn: { done: '以后就靠你了，国产之光！' },
  facts: {
    two_weeks: { text: '兩週：修登入頁、開會、週報退件重寫、準備交接' },
    handover_contact: { text: '交接文件寫：之後有問題找阿明' }
  }
});
