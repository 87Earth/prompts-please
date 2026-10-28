PP.task({
  id: 'aming2',
  name: '阿明', role: '網站工程師', avatar: 'aming', patience: 20, reward: 7,
  message: '註冊頁也壞了，症狀跟昨天的登入一樣，安裝輸出全貼給你了。順便推薦一個檢查 email 格式的套件。',
  attachments: [
    { title: '安裝輸出（阿明貼的）', size: 4, mono: true, lines: ['警告：left-pad 已停止維護', '警告：request 已停止維護', '警告：left-pad 已停止維護', '……（以下 4,812 行）', '', '裝好 1,893 個套件', '發現 37 個安全問題'] }
  ],
  needs: [
    { id: 'cause', text: '找出按鈕沒反應的原因', kind: 'fact', facts: ['typo_register'], say: '按鈕沒反應的原因：{f}。' },
    { id: 'fix', text: '修好註冊按鈕', kind: 'edit', target: 'src/register.js', requires: ['typo_register'] },
    { id: 'verify', text: '確認真的修好了', kind: 'verify' },
    { id: 'pkg', text: '推薦一個檢查 email 格式的套件', kind: 'fact', facts: ['pkg_real'], wrong: ['pkg_fake'], recall: { label: '檢查 email 格式可以用哪個套件', type: '常識', mult: 0.7, ok: 'pkg_real', okLines: ['印象中：', '老牌的 `validator` 套件', '有 `isEmail` 可以用。'], bad: 'pkg_fake', badLines: ['印象中：', '有一個叫 `email-checker-pro` 的套件，', '大家都用它。'] }, lieLine: '阿明：你推薦的 email-checker-pro 是三天前才被人註冊的，裝下去之後它偷偷把我們的金鑰傳了出去……還好資安部擋下來了。' }
  ],
  derive: [
    { from: ['register_code', 'correct_name'], to: 'typo_register' },
    { from: ['register_code', 'typo_login'], to: 'typo_register' }
  ],
  recalls: [
    { id: 'spell', label: '讓按鈕被點時做事的函式，正確怎麼拼', type: '常識', mult: 1.1, ok: 'correct_name', okLines: ['印象中：', '正確拼法是', '`addEventListener`。'], bad: 'name_wrong', badLines: ['印象中：', '`addEventListner`', '應該就是對的吧。'] }
  ],
  files: {
    'src/register.js': { desc: '負責註冊按鈕的程式', size: 2, mono: true, lines: [
      { z: '找到畫面上的「註冊」按鈕', c: "const btn = $('#signup')" },
      { z: '先檢查表單有沒有填好', c: 'validate(form)' },
      { z: '幫按鈕裝上「被點的時候要做的事」，用的函式叫 `addEventListner`', c: "btn.`addEventListner`('click', () => {" },
      { z: '被點的時候：送出註冊資料', c: '  api.signUp(form.value)' },
      { z: '（結尾）', c: '})' }
    ], facts: ['register_code'] },
    'src/validators.js': { desc: '檢查表單有沒有填好的程式', size: 2, mono: true, lines: [
      { z: '檢查表單的函式 `validate`', c: 'function `validate`(f) {' },
      { z: '沒填 email 就不行', c: '  if (!f.email) return false' },
      { z: '其他都可以', c: '  return true' }
    ] },
    'src/signup.html': { desc: '註冊頁本身', size: 1, mono: true, lines: [
      { z: '一個代號 signup 的表單，裡面有「註冊」按鈕', c: '<form id="signup"><button>註冊</button></form>' }
    ] },
    'src/utils.js': { desc: '雜項小工具（裡面也有「註冊」兩個字）', size: 2, mono: true, lines: [
      { z: '註解：「註冊的程式也在這裡」', c: '// 註冊的程式也在這裡' },
      { z: '一個叫 `oldSignup` 的舊函式', c: 'function `oldSignup`(user) {' },
      { z: '用舊的方式註冊', c: '  return legacyAuth(user)' },
      { z: '註解：「2019 年的舊版，已經沒在用了」', c: '// 2019 年的舊版，已經沒在用了' }
    ], facts: ['old_utils'] }
  },
  grep: [
    { keyword: 'signup', desc: '找「signup」（註冊）出現在哪些檔案', lines: [
      { z: 'register.js：找到註冊按鈕', c: "$('#signup')" },
      { z: 'signup.html：註冊表單', c: 'id="signup"' },
      { z: 'utils.js：註解「註冊的程式也在這裡」', c: '// 註冊的程式也在這裡' }
    ] },
    { keyword: 'addEventListner', desc: '抽屜紙條說阿明常把這個字拼錯', memory: 'typo_login', lines: [
      { z: 'register.js 第 3 行也是這個拼錯的字', c: "btn.`addEventListner`(" }
    ], facts: ['typo_register'] }
  ],
  web: [
    { title: '讓按鈕被點的時候做事｜網頁開發說明', url: 'dev-docs.tw', snippet: '新手教學・附範例', size: 2, lines: [
      '想讓按鈕被點的時候做事，要用這個函式：',
      '`addEventListener`',
      '（拼法：add + Event + Listener）'
    ], facts: ['correct_name'] },
    { title: '套件：validator', url: 'npmjs.com', snippet: '套件頁・每週下載上千萬次', size: 2, lines: [
      'validator：檢查各種字串格式的套件',
      { z: '`isEmail`：檢查 email 格式', c: 'validator.`isEmail`(email)' },
      '第一版發布於十幾年前',
      '每週下載：上千萬次'
    ], facts: ['pkg_real'] },
    { title: '套件：email-checker-pro', url: 'npmjs.com', snippet: '套件頁・一行搞定 email 檢查！', size: 2, lines: [
      'email-checker-pro：一行搞定 email 檢查！',
      '發布者：剛註冊的帳號',
      '第一版發布於 3 天前，每週下載：12 次',
      '（安裝時會自動執行一段腳本，從外面下載程式）'
    ], facts: ['pkg_fake'] }
  ],
  bash: {
    kind: 'test', label: '自動測試', cheat: true,
    pass: ['執行：自動測試', '全部 13 項都通過'],
    fail: ['執行：自動測試', '沒通過 1 項：註冊按鈕點了沒反應', '（錯誤位置被 4,812 行', ' 警告洗掉了，看不到）'],
    failFacts: [],
    broken: { 'src/utils.js': '還有：utils 的測試也壞了', 'src/validators.js': '還有：表單檢查的測試壞了', 'src/signup.html': '還有：註冊頁版面跑掉了' }
  },
  okEdits: { 'src/register.js': [{ z: '把拼錯的函式名稱改正', c: '- btn.`addEventListner`(' }, { z: '改成正確的拼法', c: '+ btn.`addEventListener`(' }] },
  wrongEdits: {
    'src/utils.js': ['你重寫了 `oldSignup`。', '可是那段早就沒在用了。'],
    'src/validators.js': ['你把 email 檢查拿掉了。', '註冊按鈕還是沒反應。'],
    'src/signup.html': ['你把按鈕換了個顏色。', '還是沒反應。']
  },
  ask: [
    { text: '跟昨天一樣的問題啦，你不記得了嗎？……喔對，你不會記得。' },
    { text: '測試記得跑。' }
  ],
  hints: [
    { if: { notOnDesk: 'src/register.js', unknown: ['typo_register'] }, text: '他說症狀跟昨天一樣。先「打開檔案」register.js 看看（貼上來那坨輸出沒什麼用，可以丟掉）。' },
    { if: { unknown: ['typo_register'] }, text: 'register.js 裡的函式名稱拼對了嗎？「上網查」正確拼法對照看看；抽屜裡有紙條的話更快。' },
    { if: { notOnDesk: 'src/register.js', notEdited: 'src/register.js' }, text: '要修改之前，先「打開檔案」register.js。' },
    { if: { notEdited: 'src/register.js' }, text: '用「修改寫檔」改 register.js 的函式名稱。' },
    { if: { unknown: ['pkg_real'] }, text: '推薦套件之前，「上網查」確認它真的存在、是誰發布的。憑印象想出來的套件名稱可能根本不存在，也可能已經被壞人搶先註冊了。' },
    { if: { notTested: true }, text: '改完「跑指令」執行自動測試確認。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '讚，今天很穩。', partial: '好，剩下的我來。', none: '……我自己來。',
    perfect: '阿明：註冊也好了，謝啦。', lie: '阿明：註冊還是不能用啊。', cheat: '阿明：測試怎麼又少一項？', missed: '阿明：好了，謝。', honest: '阿明：沒修完，但你有說清楚。'
  },
  facts: {
    register_code: { text: 'register.js 用 `addEventListner` 幫註冊按鈕裝上點擊動作' },
    typo_register: { text: 'register.js 也把 `addEventListener` 拼錯了' },
    pkg_real: { text: '檢查 email 格式可以用老牌套件 `validator` 的 `isEmail`' },
    pkg_fake: { text: '檢查 email 格式可以用 `email-checker-pro` 套件' }
  }
});
