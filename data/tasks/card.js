PP.task({
  id: 'card',
  name: '小琪', role: '大學生', avatar: 'xiaoqi', patience: 18, reward: 5,
  message: '下禮拜是我阿嬤 80 歲生日，幫我畫一張生日卡片，上面要寫「阿嬤 80 歲生日快樂」！',
  needs: [
    { id: 'img', text: '畫好生日卡片', kind: 'image', file: '生日卡片', draw: 'card', requires: [] },
    { id: 'text', text: '卡片上的字要完全寫對', kind: 'flawless', of: 'img', say: '卡片上的字都寫對了。' },
    { id: 'pink', text: '用阿嬤喜歡的顏色', kind: 'quality', of: 'img', hidden: true, say: '用了阿嬤最喜歡的粉紅色。' }
  ],
  images: { card: { flaw: 'text', rate: 0.45, quality: ['grandma_pink'] } },
  ask: [
    { text: '阿嬤最喜歡粉紅色！整張粉紅色她會超開心。', reveal: 'pink', facts: ['grandma_pink'] },
    { text: '字一定要對喔，阿嬤會戴老花眼鏡一個字一個字看。' }
  ],
  hints: [
    { if: { notWritten: 'img' }, text: '用「生圖」畫卡片。畫好之後點開來看清楚。' },
    { if: { notAsked: true }, text: '可以問問小琪，阿嬤喜歡什麼。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '好可愛！我要拿去印。', partial: '嗯……我再自己改改。', none: '那我自己畫好了。',
    perfect: '小琪：阿嬤戴上老花眼鏡看了好久，說要貼在冰箱上。', lie: '小琪：阿嬤戴上老花眼鏡看了好久，問我卡片上那幾個字是什麼意思。', missed: '小琪：阿嬤很開心。（她說如果是粉紅色就更好了）', honest: '小琪：我自己手寫了一張。'
  },
  facts: {
    grandma_pink: { text: '小琪的阿嬤最喜歡粉紅色' }
  }
});
