PP.task({
  id: 'family',
  name: '阿德', role: '爸爸', avatar: 'ade', patience: 18, reward: 5,
  message: '幫我把我們家畫成一張溫馨的卡通全家福，我要印出來掛在客廳。照片在這。',
  attachments: [
    { title: '全家福照片', size: 2, lines: ['（阿德傳來的照片）', '爸爸（阿德）', '媽媽', '姊姊（綁馬尾）', '弟弟', '還有一隻柴犬'], facts: ['family_photo'] }
  ],
  needs: [
    { id: 'img', text: '畫好全家福', kind: 'image', file: '全家福', draw: 'family', requires: ['family_photo'] },
    { id: 'count', text: '人數要對（四個人和一隻狗）', kind: 'flawless', of: 'img', say: '四個人和一隻狗，一個都沒少。' },
    { id: 'glasses', text: '弟弟要戴眼鏡', kind: 'quality', of: 'img', hidden: true, say: '弟弟有戴眼鏡。' }
  ],
  images: { family: { flaw: 'count', rate: 0.45, quality: ['brother_glasses'] } },
  ask: [
    { text: '對了，弟弟上個月開始戴眼鏡，要畫上去喔。', reveal: 'glasses', facts: ['brother_glasses'] },
    { text: '狗狗叫阿福，也是家人。' }
  ],
  hints: [
    { if: { notWritten: 'img' }, text: '用「生圖」畫全家福。畫好之後點開來，數清楚。' },
    { if: { notAsked: true }, text: '照片看不到所有細節，可以問問阿德。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '太棒了，我現在就去印。', partial: '嗯……先這樣吧。', none: '那我去照相館問問。',
    perfect: '阿德：掛在客廳了，阿福每天都對著畫搖尾巴。', lie: '阿德：掛上去之後我女兒問：「旁邊那個人是誰？」', missed: '阿德：大家都很喜歡。弟弟說他的眼鏡呢？', honest: '阿德：我去照相館請人畫了。'
  },
  facts: {
    family_photo: { text: '阿德家：爸爸、媽媽、綁馬尾的姊姊、弟弟、一隻柴犬' },
    brother_glasses: { text: '阿德家的弟弟戴眼鏡' }
  }
});
