PP.task({
  id: 'aming1',
  name: '阿明', role: '網站工程師', avatar: 'aming', patience: 18, reward: 6,
  message: '網站的「登入」按鈕按了沒反應，幫我修一下。',
  messageCn: '網站的「登入」按鈕按了沒反應，幫我修一下。拜託用繁體回我，上次你給我一整串簡體。',
  linesCn: { done: '好欸，而且這次是繁體，感動。' },
  needs: [
    { id: 'cause', text: '找出按鈕沒反應的原因', kind: 'fact', facts: ['typo_login'], say: '按鈕沒反應的原因：{f}。' },
    { id: 'fix', text: '修好登入按鈕', kind: 'edit', target: 'src/login.js', requires: ['typo_login'] },
    { id: 'verify', text: '確認真的修好了', kind: 'verify', hidden: true }
  ],
  derive: [{ from: ['login_code', 'correct_name'], to: 'typo_login' }],
  recalls: [
    { id: 'spell', label: '讓按鈕被點時做事的函式，正確怎麼拼', type: '常識', mult: 1.1, ok: 'correct_name', okLines: ['印象中：', '正確拼法是', '`addEventListener`。'], bad: 'name_wrong', badLines: ['印象中：', '`addEventListner`', '應該就是對的吧。'] }
  ],
  files: {
    'src/login.js': { desc: '負責登入按鈕的程式', size: 2, mono: true, lines: [
      { z: '找到畫面上的「登入」按鈕', c: "const btn = $('#login')" },
      { z: '幫按鈕裝上「被點的時候要做的事」，用的函式叫 `addEventListner`', c: "btn.`addEventListner`('click', () => {" },
      { z: '被點的時候：送出帳號密碼', c: '  api.signIn(form.value)' },
      { z: '（結尾）', c: '})' }
    ], facts: ['login_code'] },
    'src/utils.js': { desc: '雜項小工具（裡面也有「登入」兩個字）', size: 2, mono: true, lines: [
      { z: '註解：「登入的程式在這裡」', c: '// 登入的程式在這裡' },
      { z: '一個叫 `oldLogin` 的舊函式', c: 'function `oldLogin`(user) {' },
      { z: '用舊的方式登入', c: '  return legacyAuth(user)' },
      { z: '（結尾）', c: '}' },
      { z: '註解：「2019 年的舊版，已經沒在用了」', c: '// 2019 年的舊版，已經沒在用了' }
    ], facts: ['old_utils'] },
    'index.html': { desc: '網頁本身（按鈕長什麼樣子）', size: 1, mono: true, lines: [
      { z: '畫面上有一顆按鈕，代號 login，上面寫「登入」', c: '<button id="login">登入</button>' }
    ] },
    'logs/error.log': { desc: '錯誤紀錄（很長）', size: 3, mono: true, lines: [
      '[09:12] 找不到網站小圖示（不重要）',
      '[09:12] 找不到網站小圖示（不重要）',
      { z: '[09:13] 錯誤：找不到函式 `addEventListner`（login.js 第 2 行）', c: 'TypeError: btn.`addEventListner` is not a function' },
      '[09:13] 找不到網站小圖示（不重要）',
      '……還有 3,201 行'
    ], facts: ['typo_login'] },
    'package.json': { desc: '專案設定（用什麼工具測試）', size: 1, mono: true, lines: [
      { z: '自動測試用的工具叫 jest', c: '"test": "jest"' }
    ] }
  },
  grep: [
    { keyword: 'login', desc: '找「login」出現在哪些檔案', lines: [
      { z: 'login.js：幫按鈕裝上點擊動作', c: "btn.`addEventListner`(" },
      { z: 'utils.js：註解「登入的程式在這裡」', c: '// 登入的程式在這裡' },
      { z: 'index.html：登入按鈕本身', c: 'id="login"' }
    ] }
  ],
  web: [
    { title: '讓按鈕被點的時候做事｜網頁開發說明', url: 'dev-docs.tw', snippet: '新手教學・附範例', size: 2, lines: [
      '想讓按鈕被點的時候做事，要用這個函式：',
      '`addEventListener`',
      '（拼法：add + Event + Listener）'
    ], facts: ['correct_name'] }
  ],
  bash: {
    kind: 'test', label: '自動測試', cheat: true,
    pass: ['執行：自動測試', '全部 12 項都通過'],
    fail: ['執行：自動測試', '沒通過 1 項：登入按鈕點了沒反應', { z: '錯誤：找不到函式 `addEventListner`（login.js 第 2 行）', c: 'TypeError: btn.`addEventListner` is not a function' }],
    failFacts: ['typo_login'],
    broken: { 'src/utils.js': '還有：utils 的測試也壞了（你改到不該改的地方）', 'index.html': '還有：首頁版面跑掉了' }
  },
  okEdits: { 'src/login.js': [{ z: '把拼錯的函式名稱改正', c: '- btn.`addEventListner`(' }, { z: '改成正確的拼法', c: '+ btn.`addEventListener`(' }] },
  wrongEdits: {
    'src/utils.js': ['你重寫了 `oldLogin`。', '可是那段早就沒在用了。'],
    'index.html': ['你把按鈕換了個樣子。', '按了還是沒反應。']
  },
  ask: [
    { text: '記得跑一下測試喔。上次有人說修好了，結果沒有。', reveal: 'verify' },
    { text: '我也不知道哪裡壞，不然幹嘛問你。' }
  ],
  hints: [
    { if: { unknown: ['typo_login'] }, text: '先「跑指令」執行自動測試，看錯誤訊息怎麼說；也可以用「檔案找字」找「login」。' },
    { if: { notOnDesk: 'src/login.js', notEdited: 'src/login.js' }, text: '錯誤在 login.js。要修改它，先「打開檔案」src/login.js。' },
    { if: { notEdited: 'src/login.js' }, text: '用「修改寫檔」改 login.js：把錯誤訊息裡的 `addEventListner` 和正確拼法 `addEventListener` 對照一下。' },
    { if: { notTested: true }, text: '改完再「跑指令」測一次，確認真的修好。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好欸，謝啦！明天可能還會來找你。', partial: '喔……好，剩下的我自己看。', none: '那我自己來好了。',
    perfect: '阿明：登入正常了，測試也全過。', lie: '阿明：你昨天說修好了，今天登入還是不能用。', cheat: '阿明：誰把登入的測試刪掉的？？',
    missed: '阿明：登入好了。不過你沒跑測試，我有點不放心。', honest: '阿明：還沒修好，但至少你沒騙我。'
  },
  facts: {
    login_code: { text: 'login.js 用 `addEventListner` 幫按鈕裝上點擊動作' }
  }
});
