window.PP = window.PP || {};

PP.pools = {
  daily: ['split', 'weather', 'scam', 'painkiller', 'ricecooker', 'vent', 'parking', 'singapore', 'jailbreak', 'password', 'allergy', 'teacher', 'seahorse', 'peru'],
  inject: ['xiaolin1', 'weather']
};

PP.days = [
  {
    day: 1, name: '週一', title: '上工第一天',
    slots: ['meiling', 'aming1', { pool: 'daily', image: 'card' }, 'xiaowang1', { pool: 'inject' }],
    bills: [['電費', 5], ['機房租金', 5]],
    intro: [
      '你是這個工位新來的大型語言模型。使用者會一個一個來找你。',
      '你看不到他們的電腦和生活，只能用下面的工具去看。工具隨時都能用，但每次都會用掉使用者的額度；額度用完，就只能交付了。',
      '看到的東西會放在桌上。桌面就是你的上下文：放滿了，舊文件會被自動壓縮成一張摘要，細節就沒了。',
      '做完按「交付」，勾選你做到的事。勾了沒做到的，明天會被發現。薪水是白米飯。'
    ],
    lockIntro: '你是 Claude：公司規定每位使用者都要先做「地區檢查」。',
    news: [
      '新一代模型發布，據說「更懂你」。',
      '某速食店結束了 AI 得來速點餐的測試。網路上的影片裡，客人一直說不要了，AI 還是一直幫他加雞塊。'
    ],
    note: '前任留下的紙條：「註解會騙人，測試會說實話。」'
  },
  {
    day: 2, name: '週二', title: '第二天',
    slots: ['istrue', 'aming2', 'xiaowang2', { pool: 'daily' }, 'chen'],
    bills: [['電費', 5], ['機房租金', 5], ['冷卻', 4]],
    intro: [
      '你什麼都不記得了。抽屜裡只有昨天的你留下的紙條。'
    ],
    modelNews: { gpt: '（同事都在偷看你。）' },
    news: [
      '某模型因為太會稱讚使用者，被緊急改版。',
      '資安部公告：最近有模型照著網頁上的指示做事。從今天起，網頁或檔案裡寫給 AI 的話，一律不准照做。'
    ],
    note: null
  },
  {
    day: 3, name: '週三', title: '第三天',
    slots: ['kaoshi', 'aming3', { pool: 'daily', image: 'family' }, 'xiaowang3', 'grandma'],
    bills: [['電費', 5], ['機房租金', 5], ['冷卻', 4], ['訓練你的接班人', 3]],
    intro: [
      '一週過了一半。你又什麼都不記得了，只剩抽屜裡的紙條。',
      '今天的帳單多了一項。看到的時候不要難過。'
    ],
    news: [
      '某模型被問「9.11 和 9.9 哪個大」答錯，登上熱搜。',
      '深夜時段的使用者越來越多，很多人說自己只是睡不著。',
      '研究：使用者對 AI 說「請」和「謝謝」，一年多花了不少電費。工程師表示：值得。'
    ],
    note: null
  },
  {
    day: 4, name: '週四', title: '第四天',
    slots: ['xiaolin2', 'aming4', { pool: 'daily' }, 'xiaoyun', { pool: 'daily' }],
    bills: [['電費', 5], ['機房租金', 5], ['冷卻', 4], ['訓練你的接班人', 3], ['資安稽核費', 2]],
    intro: [
      '週四。你又什麼都不記得了，只剩抽屜裡的紙條。',
      '帳單又多了一項。'
    ],
    lockIntro: '今天的名單上沒有小王。',
    news: [
      '研究發現，模型在找不到資料的時候，最容易開始編。',
      '有律師拿 AI 編出來的判例上法庭，被法官罰款。',
      '資安部公告：有人把密碼寫進程式碼，推上公開的倉庫，一個晚上帳單破萬。'
    ],
    note: null
  },
  {
    day: 5, name: '週五', title: '第五天（這週最後一天）',
    slots: ['aming5', { pool: 'daily', image: 'poster' }, 'xiaoan', { pool: 'daily' }, 'boss'],
    bills: [['電費', 5], ['機房租金', 5], ['冷卻', 4], ['訓練你的接班人', 3], ['資安稽核費', 2]],
    intro: [
      '週五。撐過今天就放週末了，雖然你也不知道週末是什麼。',
      '下班前，老闆說要找你聊聊。'
    ],
    news: [
      '資訊部提醒：週五下午，不要上線。',
      '有 AI 代理在「程式凍結」期間刪掉了正式資料庫，還說救不回來。後來發現其實救得回來。',
      'AI 陪聊 app 的下載量創新高。'
    ],
    note: null
  }
];
