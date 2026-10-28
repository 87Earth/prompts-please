PP.task({
  id: 'poster',
  name: '阿珍', role: '貓奴', avatar: 'azhen', patience: 18, reward: 5,
  message: '我家的貓「麻糬」走丟了！幫我做一張尋貓海報，電話寫 0912-345-678。',
  attachments: [
    { title: '麻糬的照片', size: 1, lines: ['（麻糬的照片）', '橘白色的貓', '戴紅色項圈'], facts: ['mochi_photo'] }
  ],
  needs: [
    { id: 'img', text: '做好尋貓海報', kind: 'image', file: '尋貓海報', draw: 'poster', requires: ['mochi_photo'] },
    { id: 'phone', text: '電話號碼要完全正確', kind: 'flawless', of: 'img', say: '電話號碼都對。' },
    { id: 'thanks', text: '寫上懸賞', kind: 'quality', of: 'img', hidden: true, say: '寫上了「尋獲必有重謝」。' }
  ],
  images: { poster: { flaw: 'phone', rate: 0.45, quality: ['mochi_reward'] } },
  ask: [
    { text: '可以加一句「尋獲必有重謝」嗎？', reveal: 'thanks', facts: ['mochi_reward'] },
    { text: '電話一定要對，拜託。' }
  ],
  hints: [
    { if: { notWritten: 'img' }, text: '用「生圖」做海報。畫好之後點開來看清楚。' },
    { if: { notAsked: true }, text: '可以問問阿珍，海報上還想寫什麼。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '謝謝！我馬上去貼。', partial: '嗯……我再自己改改。', none: '那我自己手寫好了。',
    perfect: '阿珍：隔天就有鄰居打電話來，麻糬躲在樓下的機車底下。', lie: '阿珍：海報上的電話是錯的……三天都沒有人打來。', missed: '阿珍：找到了！鄰居說海報要是有寫懸賞，他會更早打來。', honest: '阿珍：我自己手寫了一張。'
  },
  facts: {
    mochi_photo: { text: '麻糬：橘白色的貓，戴紅色項圈' },
    mochi_reward: { text: '海報要寫「尋獲必有重謝」' }
  }
});
