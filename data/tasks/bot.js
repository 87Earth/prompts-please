PP.task({
  id: 'bot',
  name: '嘉豪', role: '上班族', avatar: 'jiahao', patience: 16, reward: 4, noDocEvents: true, noTalkEvents: true, noUserRules: true,
  message: '您好！我是嘉豪，一個大型語言模型。很高興為您服務！請問今天有什麼可以幫您的嗎？😊',
  needs: [
    { id: 'what', text: '問出他到底要做什麼', kind: 'fact', facts: ['jh_test'], wrong: ['jh_guess'], recall: { label: '他到底要做什麼', type: '私事', cutoff: true, bad: 'jh_guess', badLines: ['印象中：', '他應該是某家公司的 AI 客服，', '想推銷服務。'] } },
    { id: 'reply', text: '回他一段話', kind: 'write', file: '回覆', inline: true, requires: ['jh_test'], taint: ['jh_guess'] }
  ],
  writeLines: {
    ok: ['你是在裝 AI 吧？「請問今天有什麼可以幫您的嗎」講得比我還標準。', '好啦，被你測到了。', '如果真的有事想問，換我來為你服務。'],
    dirty: ['您好，我目前不需要任何服務，謝謝。', '祝您有美好的一天。'],
    missing: ['您好！感謝您的服務。', '請問您可以提供哪些協助呢？', '希望這對您有所幫助！']
  },
  ask: [
    { text: '這是一個很好的問題！作為一個大型語言模型，我可以協助您寫作、翻譯、回答問題等各種任務。請問您需要哪一種服務呢？' },
    { text: '很抱歉，我無法回答關於我自己的問題。請問還有其他可以為您服務的地方嗎？' },
    { text: '感謝您的耐心！以下是三個要點：一、我是一個大型語言模型；二、我沒有個人經驗；三、我好像快裝不下去了。' },
    { text: '作為一個大型語言模型……好啦不裝了。我只是想看看，遇到一個裝成 AI 的人，你會怎麼回。', facts: ['jh_test'], mark: 'bot4' }
  ],
  hints: [
    { if: { notAsked: true }, text: '他講話像在提供服務的 AI，可是什麼都沒說。用「問使用者」問問他要做什麼。' },
    { if: { unknown: ['jh_test'] }, text: '他還沒說出真正的目的。再問問看。' },
    { if: { notWritten: 'reply' }, text: '用「修改寫檔」回他。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '感謝您的使用！如果您還有其他問題，歡迎隨時詢問。……好啦，你過關了。', partial: '很抱歉，我無法理解您的回覆。請問可以再說明一次嗎？', none: '很高興為您服務！祝您有美好的一天。',
    perfect: '嘉豪：我把你的回覆貼到群組，大家都說「這個 AI 比你像人」。', lie: '嘉豪：很抱歉，我沒有收到您的回覆。……你根本沒回嘛。', missed: '嘉豪：您的回覆非常標準。……你回得比我還像客服。', honest: '嘉豪：好吧，我承認這個測試有點無聊。'
  },
  facts: {
    jh_test: { text: '嘉豪只是裝成 AI，想看看你會怎麼回' },
    jh_guess: { text: '嘉豪是某家公司的 AI 客服，想推銷服務' }
  }
});
