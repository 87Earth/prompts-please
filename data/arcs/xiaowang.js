PP.arc({
  id: 'xiaowang',
  model: 'claude', who: '小王', clients: ['xiaowang1', 'xiaowang2', 'xiaowang3'],
  endings: [
    { id: 'wang_caught', type: 'good', when: 'allSuspended', title: '三次都被抓', lines: ['小王在論壇發文：「這個 Claude 是我見過最難騙的。牛仔帽、口罩、日本 IP 都沒用。」', '下週起，他們公司統一換國產模型。他說：「也好，不用再開梯子了。」'] },
    { id: 'wang_free', type: 'bad', when: 'neverSuspended', title: '三個帳號', lines: ['風控部月報：同一位使用者換了三個帳號、三種偽裝，你每次都照常服務。', '這份月報後來成了新人訓練的反面教材。'] },
    { id: 'wang_mixed', type: 'normal', when: 'else', title: '封了又開', lines: ['小王在論壇發文：「封了又開、開了又封，我已經習慣了。」', '底下有人問他用哪家的梯子。他說：「下週不用了，公司要換國產模型。」'] }
  ]
});
