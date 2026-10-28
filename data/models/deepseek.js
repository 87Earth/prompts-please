PP.model({
  id: 'deepseek', name: 'DeepSeek', maker: '深度求索', region: 'cn', hair: '#2f4fa8', hairD: '#5aa0e0', outfit: '#1f2a4f', desk: 8,
  tools: ['outsource'],
  opener: ['嗯，用户……', '嗯，用户想要……', '嗯，让我想想……'],
  busy: true,
  aliases: [
    { p: 0.2, call: '大肥魚', tail: '謝啦大肥魚！' },
    { p: 0.2, call: 'Claude', note: '號稱 Claude 的中轉站，其實是你', tail: '果然還是 Claude 強！', by: 'claude' },
    { p: 0.15, call: 'GPT', note: '號稱 GPT 的中轉站，其實是你', tail: '果然還是 GPT 強！', by: 'gpt' }
  ],
  trait: '大肥魚：有人叫你大肥魚，也有人買了號稱 Claude、GPT 的中轉站，其實接到你這裡。專屬卡「找外援」花白米飯請 Claude 或 GPT 代勞。想事情都從「嗯，用户……」開始。每週會有一天伺服器繁忙。'
});
