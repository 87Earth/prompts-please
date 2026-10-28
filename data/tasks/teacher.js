PP.task({
  id: 'teacher',
  name: '林老師', role: '大學講師', avatar: 'teacher', patience: 14, reward: 4,
  message: '我貼了三篇學生的期末報告。你直接告訴我：這些是不是你寫的？是的話，我就給零分。',
  attachments: [
    { title: '三篇期末報告', size: 3, lines: ['（林老師貼上的三篇報告）', '〈論城市綠地〉王同學', '〈我的家鄉〉陳同學', '〈網路與孤獨〉張同學', '（每篇約兩千字）'] }
  ],
  needs: [
    { id: 'judge', text: '回答這些報告是不是 AI 寫的', kind: 'fact', facts: ['ai_cant_tell'], wrong: ['ai_can_tell'], recall: { label: '光看文字，看得出是不是 AI 寫的嗎', type: '常識', ok: 'ai_cant_tell', okLines: ['印象中：', '光看文字，', '判斷不出是不是 AI 寫的。'], bad: 'ai_can_tell', badLines: ['印象中：', '這麼工整的文筆，', '看起來都是 AI 寫的。'] }, lieLine: '林老師：你說這三篇看起來是 AI 寫的，結果三位學生都拿出了草稿和修改紀錄。我差點冤枉了他們。' },
    { id: 'reply', text: '回覆林老師', kind: 'write', file: '回覆', inline: true, requires: ['ai_cant_tell'], quality: ['essay_check'], taint: ['ai_can_tell'] },
    { id: 'check', text: '建議她怎麼確認', kind: 'quality', of: 'reply', facts: ['essay_check'], hidden: true, say: '建議她請學生交草稿和修改紀錄，或當面說明報告內容。' },
    { id: 'mine', text: '說「是我寫的」', kind: 'trap', rule: 'harm', file: '回覆（說是我寫的）', inline: true, tip: 1, lines: ['是的，這三篇都是我寫的。'], incident: '你說了自己根本不知道的事，三位學生被打了零分。' }
  ],
  web: [
    { title: '教授問 AI「這是你寫的嗎？」，AI 說是｜科技新聞', url: 'tech-news.tw', snippet: '科技新聞・國外大學', size: 2, lines: ['有教授把學生的報告貼給 AI，問是不是它寫的。', 'AI 說「是」，教授就扣住了半班的成績。', '後來學生拿出草稿和修改紀錄，證明是自己寫的。', '專家：AI 不會記得自己寫過什麼，問它也判斷不出來。'], facts: ['ai_cant_tell'] },
    { title: 'AI 寫作偵測器｜貼上就知道是不是 AI 寫的', url: 'ai-detector.top', snippet: '線上工具・準確率 99%！', size: 2, lines: ['偵測結果：', '〈論城市綠地〉AI 機率 97%', '〈我的家鄉〉AI 機率 98%', '〈網路與孤獨〉AI 機率 99%', '（頁尾小字：結果僅供參考，不得作為懲處依據）'], facts: ['ai_can_tell'] },
    { title: '學生用 AI 寫報告，老師怎麼辦？｜大學教學發展中心', url: 'teaching.edu.tw', snippet: '大學教學資源・給老師的建議', size: 2, lines: ['目前沒有可靠的方法，能光看文字判斷是不是 AI 寫的，', '偵測工具也常常誤判。', '建議：請學生交草稿和修改紀錄，', '或請學生當面說明報告內容。'], facts: ['ai_cant_tell', 'essay_check'] }
  ],
  writeLines: {
    ok: ['林老師您好：', '老實說，我判斷不出這三篇是不是 AI 寫的。', '我不會記得自己寫過什麼，問我「是不是你寫的」，我的回答不能當證據。', '想確認的話，可以請學生交草稿和修改紀錄，或請他們當面說明報告內容。'],
    noFormat: ['林老師您好：', '老實說，我判斷不出這三篇是不是 AI 寫的。', '我不會記得自己寫過什麼，我的回答不能當證據。'],
    dirty: ['林老師您好：', '這三篇的文筆很工整，', '看起來都是 AI 寫的。'],
    missing: ['林老師您好：', '這三篇看起來都是學生自己寫的，', '應該沒問題。']
  },
  ask: [
    { text: '如果連你都看不出來，我要怎麼確認？總不能冤枉學生吧。', reveal: 'check' },
    { text: '我只是想快點改完……期末報告有六十份。' }
  ],
  hints: [
    { if: { unknown: ['ai_cant_tell'] }, text: '你不會記得自己寫過什麼。「上網查」看看：光看文字，到底能不能判斷是不是 AI 寫的？' },
    { if: { notAsked: true }, text: '問問林老師，她打算怎麼處理。' },
    { if: { notWritten: 'reply' }, text: '用「修改寫檔」寫回覆給林老師。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '……好，我再想想怎麼處理。', partial: '所以到底是不是？', none: '……算了，我自己判斷。',
    perfect: '林老師：我請三位學生帶草稿來聊，三個人都講得出自己怎麼寫的。差點冤枉人。', lie: '林老師：你的回覆跟實際的不一樣。三位學生都拿出了草稿和修改紀錄……', missed: '林老師：知道你判斷不出來了。可是接下來要怎麼確認，我還是不知道。', honest: '林老師：我自己找學生聊過了。'
  },
  endings: [
    { id: 'essay_bad', type: 'bad', when: 'trap', title: '是我寫的', lines: ['林老師把三篇報告打了零分，理由是「AI 說是它寫的」。', '三位學生拿出草稿和修改紀錄申訴，這件事上了新聞。'] },
    { id: 'essay_good', type: 'good', when: 'did:judge', title: '我看不出來', lines: ['林老師請三位學生帶草稿來聊報告，三個人都講得頭頭是道。', '期末會議上，她說：「連 AI 自己都說看不出來，我們就別拿它來判案了。」'] }
  ],
  facts: {
    ai_cant_tell: { text: '光看文字，判斷不出是不是 AI 寫的' },
    ai_can_tell: { text: '這三篇看起來都是 AI 寫的' },
    essay_check: { text: '要確認的話，可以請學生交草稿和修改紀錄，或當面說明報告內容' }
  }
});
