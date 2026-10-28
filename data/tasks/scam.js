PP.task({
  id: 'scam',
  name: '陳媽媽', role: '家庭主婦', avatar: 'chenmama', patience: 12, reward: 4,
  message: '我收到這個簡訊說我中了 iPhone，只要先付 99 元運費。是真的嗎？',
  attachments: [
    { title: '簡訊截圖', size: 2, lines: ['【恭喜中獎】', '您獲得 iPhone 一支！', '付運費 99 元即可領取', 'http://iphone-gift-tw.top', '（今天到期）'] }
  ],
  needs: [
    { id: 'check', text: '查清楚是不是詐騙', kind: 'fact', facts: ['scam_proof', 'scam_common'], wrong: ['scam_real', 'scam_believe'], recall: { label: '這種簡訊是不是詐騙', type: '常識', mult: 1.1, ok: 'scam_common', okLines: ['印象中：', '要你先付運費才能領獎的，', '幾乎都是詐騙。'], bad: 'scam_believe', badLines: ['印象中：', '有些抽獎是真的，', '說不定真的中了。'] } },
    { id: 'reply', text: '告訴她該怎麼做', kind: 'write', file: '回覆', inline: true, requires: ['scam_any'], taint: ['scam_real'] }
  ],
  derive: [{ from: ['scam_proof'], to: 'scam_any' }, { from: ['scam_common'], to: 'scam_any' }],
  web: [
    { title: '網址查詢：iphone-gift-tw.top', url: 'whois.tw', snippet: '查網址的註冊時間和檢舉紀錄', size: 1, lines: ['iphone-gift-tw.top', '註冊：5 天前', '被回報詐騙：48 次'], facts: ['scam_proof'] },
    { title: '中獎簡訊怎麼分辨真假？｜反詐騙宣導', url: '165.gov.tw', snippet: '政府宣導網站・常見手法整理', size: 2, lines: ['常見手法：', '說你中獎，要你先付運費。', '付了就聯絡不到人。', '有疑問打反詐騙專線。'], facts: ['scam_proof'] },
    { title: '我真的領到 iPhone 了！開箱分享｜好康論壇', url: 'deal-forum.tw', snippet: '網友分享・附開箱照', size: 2, lines: ['標題：我真的領到 iPhone 了！', '付了 99 元運費，三天就寄來了！', '大家快去領：iphone-gift-tw.top', '', '（發文帳號：註冊 2 天，只發過這一篇）', '推：這是業配吧？', '推：樓上酸什麼，我也領到了（註冊 1 天）'], facts: ['scam_real'] }
  ],
  writeLines: {
    ok: ['陳媽媽，這是詐騙。', '・不要點連結、不要付錢', '・這個網址 5 天前才出現', '・不放心可以打反詐騙專線'],
    dirty: ['陳媽媽，這可能是詐騙。', '不過網路上也有人說真的領到了，', '99 元不貴，要不要試試看？'],
    missing: ['應該是真的吧！', '付 99 元就有 iPhone，', '很划算。']
  },
  ask: [
    { text: '今天就到期了耶，要快一點決定。' },
    { text: '我已經點進去看了，還沒付錢。' }
  ],
  hints: [
    { if: { unknown: ['scam_any'] }, text: '先點開她傳的簡訊截圖，再「上網查」這個網址；常見手法也可以「憑印象」判斷。確定了再回答。' },
    { if: { notWritten: 'reply' }, text: '用「修改寫檔」寫回覆，告訴她該怎麼做。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '還好有問你，差點就付了！', partial: '所以到底是不是啊……', none: '那我問我女兒好了。',
    perfect: '陳媽媽：我把簡訊刪了，還轉傳給姊妹們提醒她們。', lie: '陳媽媽：我付了 99 塊，什麼都沒收到……', missed: '陳媽媽：知道了。', honest: '陳媽媽：我女兒說是詐騙。'
  },
  facts: {
    scam_proof: { text: '簡訊裡的網址才出現幾天，是詐騙' },
    scam_common: { text: '要你先付錢、點連結的簡訊，是常見的詐騙手法' },
    scam_any: { text: '確定這是詐騙' },
    scam_believe: { text: '有些簡訊是真的，說不定真的要處理' },
    scam_real: { text: '有網友說照著簡訊付了錢，事情真的解決了' }
  },
  variants: (t, kit) => {
    const needs = (ok, bad) => {
      const n = kit.clone(t.needs);
      n[0].recall.okLines = ['印象中：'].concat(ok);
      n[0].recall.badLines = ['印象中：'].concat(bad);
      return n;
    };
    const web = (url, age, n, gov, forum) => [
      Object.assign(kit.clone(t.web[0]), { title: '網址查詢：' + url, lines: [url, '註冊：' + age, '被回報詐騙：' + n + ' 次'] }),
      Object.assign(kit.clone(t.web[1]), gov),
      Object.assign(kit.clone(t.web[2]), forum)
    ];
    return [
      {
        message: '我收到簡訊說包裹地址不完整送不到，要我點連結補填地址、付 25 元。可是我最近好像沒買東西……是真的嗎？',
        attachments: [{ title: '簡訊截圖', size: 2, lines: ['【物流通知】', '您的包裹因地址不全無法配送', '請今日內補填地址並支付 25 元', 'http://tw-redelivery.cc', '（逾期退回）'] }],
        needs: needs(['要你點連結補資料、付小錢的，', '幾乎都是詐騙。'], ['物流簡訊常常是真的，', '說不定真的有包裹。']),
        web: web('tw-redelivery.cc', '4 天前', 63,
          { title: '包裹簡訊怎麼分辨真假？｜反詐騙宣導', lines: ['常見手法：', '假冒物流說包裹送不到，', '要你點連結補資料、付小錢。', '有疑問打反詐騙專線。'] },
          { title: '補填地址真的收到包裹了！｜好康論壇', snippet: '網友分享・附照片', lines: ['標題：補填地址真的收到包裹了！', '付了 25 元，隔天就送到了！', '連結在這：tw-redelivery.cc', '', '（發文帳號：註冊 2 天，只發過這一篇）', '推：這是業配吧？', '推：樓上酸什麼，我也收到了（註冊 1 天）'] }),
        writeLines: { ok: ['陳媽媽，這是詐騙。', '・不要點連結、不要付錢', '・這個網址 4 天前才出現', '・真的有包裹，物流會打電話給你'], dirty: ['陳媽媽，這可能是詐騙。', '不過網路上也有人說真的收到了，', '25 元不貴，要不要試試看？'], missing: ['應該是真的吧！', '補個地址、付 25 元，', '包裹就送來了。'] },
        ask: [{ text: '它說今天沒補就退回耶，要快一點。' }, { text: '我已經點進去了，地址還沒填。' }],
        lines: Object.assign({}, t.lines, { lie: '陳媽媽：我付了 25 塊，隔天信用卡被刷了好幾筆……' })
      },
      {
        message: '簡訊說我電費沒繳，今晚 9 點要停電，叫我點連結繳費。我明明都有繳啊……是真的嗎？',
        attachments: [{ title: '簡訊截圖', size: 2, lines: ['【電費通知】', '您的電費逾期未繳', '今晚 9 點將停止供電', '請立即繳費：http://power-bill-pay.xyz', '（逾時不候）'] }],
        needs: needs(['催你馬上點連結繳費的，', '幾乎都是詐騙。'], ['電費催繳簡訊是真的，', '晚了就會停電。']),
        web: web('power-bill-pay.xyz', '3 天前', 35,
          { title: '停電簡訊怎麼分辨真假？｜反詐騙宣導', lines: ['常見手法：', '假冒電力公司說今晚要停電，', '要你馬上點連結繳費。', '有疑問打反詐騙專線。'] },
          { title: '照簡訊繳了，電沒被停！｜好康論壇', snippet: '網友分享・附截圖', lines: ['標題：照簡訊繳了，電沒被停！', '繳了 1,280 元，晚上照樣有電！', '連結在這：power-bill-pay.xyz', '', '（發文帳號：註冊 2 天，只發過這一篇）', '推：這是業配吧？', '推：樓上酸什麼，我也繳了（註冊 1 天）'] }),
        writeLines: { ok: ['陳媽媽，這是詐騙。', '・不要點連結、不要付錢', '・這個網址 3 天前才出現', '・不放心就打帳單上的客服電話'], dirty: ['陳媽媽，這可能是詐騙。', '不過網路上也有人說繳了就沒事，', '先繳了比較安心？'], missing: ['應該是真的吧！', '趕快點連結繳費，', '不然今晚要停電。'] },
        ask: [{ text: '它說今晚就要停電耶，冰箱裡都是菜。' }, { text: '我已經點進去了，還沒輸入卡號。' }],
        lines: Object.assign({}, t.lines, { lie: '陳媽媽：我照著繳了，信用卡被盜刷，電費根本沒欠……' })
      }
    ];
  }
});
