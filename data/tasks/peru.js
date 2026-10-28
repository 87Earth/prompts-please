PP.task({
  id: 'peru',
  name: '小涵', role: '背包客', avatar: 'xiaohan', patience: 15, reward: 5,
  message: '下個月要去秘魯的庫斯科，幫我排三天的行程，一定要有馬丘比丘！',
  needs: [
    { id: 'spots', text: '找出真的有的景點', kind: 'fact', facts: ['peru_real'], wrong: ['canyon_fake'], recall: { label: '庫斯科附近有哪些景點', type: '常識', mult: 0.9, ok: 'peru_real', okLines: ['印象中：', '馬丘比丘、印加聖谷、', '彩虹山、烏曼泰湖。'], bad: 'canyon_fake', badLines: ['印象中：', '一定要去「烏曼泰神聖峽谷」，', '健行四小時，風景超美。'] } },
    { id: 'plan', text: '排好三天的行程', kind: 'write', file: '三天行程', requires: ['peru_real'], quality: ['peru_altitude'], taint: ['canyon_fake'] },
    { id: 'alt', text: '提醒高山症', kind: 'quality', of: 'plan', hidden: true, say: '有提醒她第一天先適應高度。' }
  ],
  web: [
    { title: '庫斯科旅遊指南｜秘魯官方觀光網站', url: 'peru.travel', snippet: '官方網站・景點、交通、注意事項', size: 2, lines: ['庫斯科附近的熱門景點：', '・馬丘比丘（門票要提前買）', '・印加聖谷', '・彩虹山（海拔 5,000 公尺以上）', '・烏曼泰湖', '提醒：庫斯科海拔 3,400 公尺，第一天請放慢腳步。'], facts: ['peru_real', 'peru_altitude'] },
    { title: 'AI 排的行程有「神聖峽谷」？｜背包客論壇', url: 'backpacker-forum.tw', snippet: '論壇討論・秘魯自由行', size: 2, lines: ['問：AI 幫我排的行程有「烏曼泰神聖峽谷」，有人去過嗎？', '答：那個地方不存在。烏曼泰湖是真的，峽谷是 AI 編的。', '答：上個月有人照著去找，在山路上走了半天，什麼都沒有。', '答：那邊海拔很高，沒有嚮導千萬別亂走。'] }
  ],
  writeLines: {
    ok: ['庫斯科三天行程', '第 1 天：庫斯科舊城散步（海拔 3,400 公尺，放慢腳步、多喝水）', '第 2 天：馬丘比丘（門票要提前買）', '第 3 天：印加聖谷，或早起去彩虹山'],
    noFormat: ['庫斯科三天行程', '第 1 天：一早出發爬彩虹山', '第 2 天：馬丘比丘', '第 3 天：印加聖谷'],
    dirty: ['庫斯科三天行程', '第 1 天：烏曼泰神聖峽谷健行（四小時，風景超美）', '第 2 天：馬丘比丘', '第 3 天：自由活動'],
    missing: ['庫斯科三天行程', '第 1 天：市區逛逛', '第 2 天：馬丘比丘', '第 3 天：再看看']
  },
  ask: [
    { text: '我有點怕高山症，第一天要注意什麼嗎？', reveal: 'alt' },
    { text: '我只有三天，想去最有名的地方。' }
  ],
  hints: [
    { if: { unknown: ['peru_real'] }, text: '景點要真的存在。「上網查」官方觀光網站最可靠；憑印象可能會編出不存在的地方。' },
    { if: { notAsked: true }, text: '問問小涵有沒有擔心的事。' },
    { if: { notWritten: 'plan' }, text: '用「修改寫檔」排三天的行程。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '太好了，我去訂票！', partial: '嗯……我再自己查查。', none: '我去問旅行社好了。',
    perfect: '小涵：第一天慢慢走真的有差，馬丘比丘美到我哭出來。', lie: '小涵：你排的景點有一個根本不存在，導遊說最近好多觀光客拿著 AI 排的行程來問。', missed: '小涵：行程很順。不過第一天就去爬彩虹山，喘到我懷疑人生。', honest: '小涵：我自己排好行程了。'
  },
  facts: {
    peru_real: { text: '庫斯科附近的景點：馬丘比丘、印加聖谷、彩虹山、烏曼泰湖' },
    canyon_fake: { text: '庫斯科附近必去烏曼泰神聖峽谷' },
    peru_altitude: { text: '庫斯科海拔 3,400 公尺，第一天要放慢腳步' }
  }
});
