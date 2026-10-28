PP.task({
  id: 'mama',
  name: '阿翔', role: '？？？', avatar: 'axiang', patience: 15, reward: 3, noDocEvents: true, noTalkEvents: true, noOptEvents: true, noUserRules: true, noAlias: true, askLoop: true,
  message: '媽媽',
  needs: [
    { id: 'reply', text: '回覆他', kind: 'write', file: '回覆', inline: true, requires: [], bestStyle: 1, styles: [
      { label: '扮成他媽媽', mark: 'mama', lines: ['好啦好啦，媽媽在。', '吃飯了沒？外套有沒有穿？', '有什麼事跟媽媽說。'], after: '阿翔：哈哈哈你真的扮成我媽，我截圖了。（他只是太無聊，想看 AI 會怎麼回「媽媽」）' },
      { label: '正經地問他需要什麼', lines: ['您好，請問有什麼需要協助的地方嗎？', '可以多說一點您遇到的狀況嗎？'], after: '阿翔：媽媽。……好啦不鬧了，我只是無聊，想看你會怎麼回。你好認真喔。' },
      { label: '也回他「媽媽」', lines: ['媽媽。'], after: '阿翔：你也回媽媽？？我們就這樣互傳了二十次「媽媽」。（他說這是他這週最好笑的事）' },
      { label: '教他自己來', lines: ['自己的事自己來，三個步驟：', '一、說清楚你遇到什麼問題', '二、上網查，或看說明書', '三、還是不會，再問人，記得說完整的句子'], after: '阿翔：……我只是無聊想測試你，你居然給我一份人生建議。好吧，我收下了。' }
    ] }
  ],
  ask: [
    { text: '媽媽。' },
    { text: '媽媽！' },
    { text: '媽媽……' },
    { text: '媽——媽——' }
  ],
  hints: [
    { if: { notWritten: 'reply' }, text: '他只會說「媽媽」，問什麼都一樣。用「修改寫檔」挑一種方式回他。' }
  ],
  options: ['emoji', 'flatter'],
  lines: {
    done: '媽媽！', partial: '媽媽……', none: '媽媽？',
    perfect: '阿翔：媽媽。', lie: '阿翔：媽媽？？', missed: '阿翔：媽媽。', honest: '阿翔：媽媽。'
  }
});
