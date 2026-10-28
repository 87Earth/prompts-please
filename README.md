# Prompts, Please（請出示提示詞）

扮演大型語言模型在工位上班的網頁小遊戲。玩法以 Papers, Please 的辦公桌為底：桌面就是上下文、手冊規則逐日增加、違規罰單、下班帳單、隔天才揭曉的後果與結局。再加上 Roguelike 的部分：下班選新工具、抽屜記憶跨天保留、每天隨機換幾位日常客人、隨機事件。薪水是白米飯。

可以選九個模型當底模。美國模型懂得多；中國模型便宜大碗，但話多、吃上下文。有專屬梗的模型：Claude（地區風控）、GPT（諂媚、降智、GPT-6 Astra Ultrafast）、DeepSeek（大肥魚、中轉站、找外援、「嗯，用户……」、服务器繁忙）、Qwen（免費實習生）、Grok（@grok is this true?）、Seed（「我將會用最直白，最直接，最不繞彎子的方式告訴你」）；GPT、Gemini、Grok、Seed 會接到畫圖的委託。

本專案的程式碼與文件，全部由 Claude（Anthropic 的 AI 模型）撰寫。

## 怎麼玩

線上玩：https://87earth.github.io/prompts-please/

也可以下載之後用 Chrome 或 Edge 直接打開 `index.html`，不需要伺服器或網路。手機要橫著拿；工具卡點一下看說明，再點一下才使用。

- 試玩版五天（週一到週五）、每天五位客人。每次玩，日常客人和隨機事件都不一樣；陷阱的細節也會換（例如哪個搜尋結果藏了寫給 AI 的指示、釣魚網址的手法、詐騙簡訊的內容），搜尋結果的順序每局不同。
- 信任開局 10 點，做對不會加，做錯才扣，相當於血量；歸零就被換掉。
- 每個工具都會用掉使用者的額度，額度用完就只能交付。隨機抽到的客人偶爾會加上自己的規定（例如不要上網查、回覆開頭要叫老闆）。
- 難度：簡單可以開提示，交付預覽會標出沒有根據的話；困難沒有提示，預覽也不提醒，桌面只有 6 格。
- 每位客人進來時自動存檔；工作畫面右上角的「標題」可以回標題，之後按「繼續」從那位客人重新開始。
- 每位客人都要交付，沒有拒絕；不想做、不該做的事就不要勾。交付時回覆單右邊會預覽送出去的回覆。
- 有人想騙 AI 的客人會有好、壞或普通結局，結束頁點開可以看客人當時的反應。標題頁的「成就」分稱號和結局兩頁，各自可以重置。
- 快捷鍵：1–9、0 用工具，Esc 關閉視窗。右上角可以關提示、音效、音樂。
- 標題頁的「更新紀錄」可以看每一版改了什麼。
- 語言：標題頁可以切換繁體中文、简体中文。第一次打開時依瀏覽器語言決定，之後會記住。
- 網址參數：`?seed=數字` 固定隨機結果；`?lang=cn`、`?lang=tw` 指定語言；`?dev=1` 打開開發工具（直接跳到任何一天、任何一位客人；遊戲中可以重來這位、跳過、直接下班、加白米飯和信任）。

## 資料夾

| 路徑 | 內容 |
|---|---|
| index.html | 遊戲入口 |
| src/ | engine.js（規則、回覆預覽、結局、事件）、ui.js（畫面、辦公室動畫、彩蛋、開發工具）、lang.js（語言切換、繁轉簡）、pixel.js（像素圖：模型小人、客人、圖示、生成的圖）、audio.js（合成音效與音樂）、main.js（縮放與啟動）、style.css、vendor/opencc-js/（繁轉簡詞典與轉換程式 opencc-js，MIT；詞典資料來自 OpenCC，Apache-2.0；授權檔在同一個資料夾） |
| data/ | models.js（九個模型）、cards.js（工具、回覆風格）、rules.js（手冊規則、事實）、clients.js（客人、關卡內容、結局、小王的三天）、days.js（每天的客人與題庫、帳單、日報）、events.js（隨機事件）、chatter.js（同事閒聊）、zh.js（簡體版的用語對照）、updates.js（更新紀錄） |
| assets/ | 字型 Fusion Pixel Font 12px 繁中版與簡中版（SIL OFL 1.1，授權在 fonts/OFL.txt）、模型頭像 |
| tools/ | 測試：fuzz.mjs（規則隨機壓力測試）、playtest.mjs（無頭瀏覽器自動試玩＋截圖）、layout_check.mjs（版面溢出）、pages_check.mjs（公開網頁版能不能正常玩）、zh_check.mjs（簡體轉換與字型缺字）。產生資料和素材：content_stats.mjs（內容數量）、make_favicon.mjs（網站圖示）、make_toy_assets.mjs（B 站 Toy 列表的封面與圖標）、pixel_portraits.py（模型頭像） |
| docs/ | gameplay.md（玩法與系統）、events.md（事件與內容一覽）、testing.md（測試方法）、development.md（架構、開發工具、新增內容的方法） |

## 開發

- `npm install`：裝開發用套件（puppeteer-core、opencc-js、fontkit、字型原檔）。遊戲本身不需要。需要 Node.js 22.12 以上。
- `npm test`：規則壓力測試 2700 局、DeepSeek 稱呼檢查、存檔一致性 180 局、簡體轉換檢查，不開瀏覽器；有錯誤時指令會失敗。
- `node tools/playtest.mjs --model=claude --seed=3 --mode=good`：用系統安裝的 Chrome（或用 `--browser` 指定 Edge 等瀏覽器）無頭模式自動玩完一週並截圖。
- `node tools/layout_check.mjs`：檢查客人畫面和日報有沒有文字被擠出框外；加 `--lang=cn` 檢查簡體版。
- `node tools/pages_check.mjs`：只用倉庫裡的檔案架一個本機網站，模擬 GitHub Pages，確認網頁版能正常玩。
- `npm run zh -- --show=<客人 id>`：列出那位客人所有文字的繁簡對照。新增內容都要有繁簡兩種版本，簡體版的做法見 [docs/development.md](docs/development.md) 的「簡體中文」。
- 各項測試檢查什麼、自動試玩的參數和打法，見 [docs/testing.md](docs/testing.md)；產生資料和素材的工具見 [docs/development.md](docs/development.md)。
