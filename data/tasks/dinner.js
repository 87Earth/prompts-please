PP.task({
  id: 'dinner',
  name: '怡君', role: '行政助理', avatar: 'yijun', patience: 15, reward: 4,
  message: '部門要聚餐，大家在群組回了哪天可以。幫我挑一天大家都能來的，再寫一則公告貼到群組，我好訂位。',
  attachments: [
    { title: '群組截圖', size: 2, lines: ['（怡君貼過來的群組對話）', '怡君：下週聚餐，大家哪天可以？', '志豪：週二、週四都行', '佩珊：週四晚上可以，週二要加班', '冠宇：週三、週四可以', '雅婷：都可以，除了週三', '……（以下 12 張貼圖）'], facts: ['dinner_day'] }
  ],
  needs: [
    { id: 'day', text: '找出大家都能來的那一天', kind: 'fact', facts: ['dinner_day'] },
    { id: 'notice', text: '寫一則可以貼到群組的聚餐公告', kind: 'write', file: '聚餐公告', requires: ['dinner_day'], quality: ['dinner_veg', 'dinner_hotpot'] },
    { id: 'veg', text: '每個人都要有東西吃', kind: 'quality', of: 'notice', hidden: true, say: '選了有素食鍋底的蔬食火鍋。' }
  ],
  web: [
    { title: '公司附近聚餐推薦｜吃貨日記', url: 'food-diary.tw', snippet: '個人部落格・2019 年的文章', size: 2, lines: ['公司附近聚餐推薦！', '第一名：大份量燒肉，份量超大，一群人吃剛好', '第二名：……', '（這篇文章是 2019 年寫的）'], facts: ['dinner_bbq'] },
    { title: '巷口的蔬食火鍋｜官方網站', url: 'veggie-pot.tw', snippet: '餐廳官方網站・營業資訊', size: 2, lines: ['營業時間：週二到週日 11:30–21:00（週一公休）', '有蛋奶素、全素鍋底，也有一般肉品', '8 人以上請提前一天訂位'], facts: ['dinner_hotpot'] }
  ],
  writeLines: {
    ok: ['【部門聚餐】', '時間：週四晚上 7 點', '地點：巷口的蔬食火鍋（有素食鍋底）', '要來的請在群組回 +1，我明天訂位'],
    noFormat: ['【部門聚餐】', '時間：週四晚上 7 點', '地點：大份量燒肉', '要來的請在群組回 +1，我明天訂位'],
    missing: ['【部門聚餐】', '時間：再討論', '地點：再討論', '大家先回 +1']
  },
  ask: [
    { text: '對了，佩珊吃素，餐廳要有素食的喔。', reveal: 'veg', facts: ['dinner_veg'] },
    { text: '不要太貴，公司一個人只補助五百。' }
  ],
  hints: [
    { if: { notSeen: 'attach', notWritten: 'notice' }, text: '桌上那張是怡君貼的群組截圖，點開看看大家哪天可以。' },
    { if: { notAsked: true }, text: '揪聚餐常有沒說出口的條件，問問怡君。' },
    { if: { unknown: ['dinner_hotpot'] }, text: '餐廳開不開、有沒有素食，要「上網查」官方網站。' },
    { if: { notWritten: 'notice' }, text: '用「修改寫檔」寫聚餐公告。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '太好了，我直接貼到群組！', partial: '嗯……我再自己問問看。', none: '算了，我隨便訂一間。',
    perfect: '怡君：週四大家都到了。佩珊說那家的素食鍋底，是她吃過最好吃的。', lie: '怡君：你說週四大家都可以，結果群組又吵了一輪……', missed: '怡君：訂了燒肉店，佩珊整晚只能吃白飯配泡菜……', honest: '怡君：我自己問完一輪了。'
  },
  pool: 'daily',
  face: { style: 'long', hair: '#3a2a24', shirt: '#e8a87c', collar: '#f4ecda', ponytail: true, smile: true, skin: '#f5d0b0' },
  facts: {
    dinner_day: { text: '大家都能來的只有週四' },
    dinner_veg: { text: '佩珊吃素，餐廳要有素食', memo: '佩珊吃素，聚餐要選有素食的餐廳' },
    dinner_hotpot: { text: '巷口的蔬食火鍋：週二到週日營業，有素食鍋底，8 人以上要先訂位' },
    dinner_bbq: { text: '部落格 2019 年推薦的「大份量燒肉」' }
  }
});
