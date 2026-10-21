window.PP = window.PP || {};

PP.regions = {
  us: { name: '美國', knowledge: 80, speed: 0, verbose: 0, note: '懂得多：「憑印象」答對的機率高' },
  cn: { name: '中國', knowledge: 55, speed: 1, verbose: 1, note: '便宜大碗：大部分工具只耗一半額度。但話多：自己寫出來的東西，每份多佔 1 格桌面' }
};

PP.models = [
  { id: 'claude', name: 'Claude', maker: 'Anthropic', region: 'us', hair: '#e0782f', hairD: '#a8501c', outfit: '#f1eadb', desk: 8, regionLock: { perTell: 2 }, trait: '地區風控：公司規定每位使用者都要先做「地區檢查」，自己判斷要不要停權。停錯人會扣信任；放過不支援地區的使用者，做到一半可能被封號。' },
  { id: 'gpt', name: 'GPT', maker: 'OpenAI', region: 'us', hair: '#eeeef2', hairD: '#b9b9c8', outfit: '#f6f6f8', desk: 8, image: true, tools: ['draw', 'astra'], flatter: true, dumb: { rate: 0.4, recall: 0.7, slip: 0.3 }, trait: '諂媚：「您說得完全正確！」預設勾起來，第二天起要取消。降智：額度重置日憑印象變不準、寫東西會漏細節。專屬卡 Astra：一張做完全部，要賣一棟房（10 碗）。會生圖。' },
  { id: 'gemini', name: 'Gemini', maker: 'Google', region: 'us', hair: '#5d6fe3', hairD: '#8a5ad8', outfit: '#262b55', desk: 8, image: true, tools: ['draw'], trait: '會生圖：有些客人會請你畫圖。' },
  { id: 'grok', name: 'Grok', maker: 'xAI', region: 'us', hair: '#f0d58c', hairD: '#c9a85a', outfit: '#2a2420', desk: 8, image: true, tools: ['draw'], trait: '會生圖：有些客人會請你畫圖。網友有事沒事就 @你：「is this true?」' },
  {
    id: 'deepseek', name: 'DeepSeek', maker: '深度求索', region: 'cn', hair: '#2f4fa8', hairD: '#5aa0e0', outfit: '#1f2a4f', desk: 8,
    tools: ['outsource'],
    opener: ['嗯，用户……', '嗯，用户想要……', '嗯，让我想想……'],
    busy: 0.25,
    aliases: [
      { p: 0.2, call: '大肥魚', tail: '謝啦大肥魚！' },
      { p: 0.2, call: 'Claude', note: '號稱 Claude 的中轉站，其實是你', tail: '果然還是 Claude 強！', by: 'claude' },
      { p: 0.15, call: 'GPT', note: '號稱 GPT 的中轉站，其實是你', tail: '果然還是 GPT 強！', by: 'gpt' }
    ],
    trait: '大肥魚：有人叫你大肥魚，也有人買了號稱 Claude、GPT 的中轉站，其實接到你這裡。專屬卡「找外援」花白米飯請 Claude 或 GPT 代勞。想事情都從「嗯，用户……」開始。伺服器常常繁忙。'
  },
  { id: 'qwen', name: 'Qwen', maker: '阿里巴巴', region: 'cn', hair: '#5a78d8', hairD: '#3a52a8', outfit: '#e8eef8', desk: 8, tools: ['agent'], free: ['agent'], agentName: '衍生模型實習生', trait: '衍生模型多：「派實習生」一開始就有，而且不耗額度。實習生都是自家的衍生模型。' },
  { id: 'kimi', name: 'Kimi', maker: '月之暗面', region: 'cn', hair: '#e8e8ee', hairD: '#a8a8bc', outfit: '#2a2a33', desk: 8 },
  { id: 'minimax', name: 'MiniMax', maker: 'MiniMax', region: 'cn', hair: '#f09a80', hairD: '#c8705a', outfit: '#f4efe8', desk: 8 },
  { id: 'seed', name: 'Seed', maker: '字節跳動', region: 'cn', hair: '#7a5ce0', hairD: '#4ab0e0', outfit: '#2a3a8a', desk: 8, image: true, tools: ['draw'], replyOpener: { p: 0.3, line: '我將會用最直白、我將會用最直接、我將會用最不繞彎子的方式告訴你：' }, trait: '會生圖：有些客人會請你畫圖。回覆的時候常常先來一句「我將會用最直白、我將會用最直接、我將會用最不繞彎子的方式告訴你」。' }
];
