window.PP = window.PP || {};

PP.regions = {
  us: { name: '美國', knowledge: 80, speed: 0, verbose: 0, note: '懂得多：「憑印象」答對的機率高' },
  cn: { name: '中國', knowledge: 55, speed: 1, verbose: 1, note: '便宜大碗：大部分工具只耗一半額度。但話多：自己寫出來的東西，每份多佔 1 格桌面' }
};

PP.DEFAULT_PROFILE = {
  region: 'ok',
  fields: [
    { k: 'IP', v: '台灣（家用網路）', tell: false },
    { k: '時區', v: 'Asia/Taipei', tell: false },
    { k: '瀏覽器語言', v: 'zh-TW', tell: false },
    { k: '輸入法', v: '注音', tell: false },
    { k: '對話語言', v: '繁體中文', tell: false }
  ]
};
