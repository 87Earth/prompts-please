# 開發說明

## 架構

- 純前端，沒有建置步驟：`index.html` 依序載入 `src/pixel.js`、`src/audio.js`、`data/*.js`、`src/engine.js`、`src/ui.js`、`src/main.js`，全部掛在全域物件 `PP` 上。用瀏覽器直接打開就能玩（`file://` 也可以）。
- `src/engine.js`（`PP.E`）：遊戲規則與狀態，不碰畫面。亂數的狀態存在 `S.rs`，同一個種子的結果相同，存檔讀回後的發展也相同。
- `src/ui.js`（`PP.UI`）：畫面、辦公室動畫、彩蛋、開發工具。
- `src/pixel.js`：像素圖（模型小人、客人頭像、圖示、生成的圖）。`src/audio.js`：Web Audio 即時合成的音效與音樂。`src/main.js`：縮放與啟動。
- `data/`：所有內容都是資料（模型、工具、規則、事實、客人、每天的安排、事件、閒聊），新增內容大多只改這裡。
- 存檔與成就存在瀏覽器的 localStorage：`pp_save`（中途存檔）、`pp_endings`、`pp_titles`。

測試和自動試玩的方法見 [testing.md](testing.md)。

## 工具（`tools/`）

測試用的 `fuzz.mjs`、`playtest.mjs`、`layout_check.mjs`、`pages_check.mjs` 見 [testing.md](testing.md)。下面這些是產生遊戲資料和素材用的，先在專案資料夾執行 `npm install`。

| 工具 | 用途 | 用法 |
|---|---|---|
| `make_simplified.mjs` | 產生 `data/simplified.js`：回覆單「用簡體回覆」用的繁轉簡字表，用 opencc-js 從遊戲文字裡出現過的字算出來 | 改了中文內容之後執行 `npm run simplified` |
| `content_stats.mjs` | 從遊戲資料數出內容數量（模型、工具、規則、客人、事件、結局、稱號等），用來核對 [events.md](events.md) 的數字 | `node tools/content_stats.mjs` |
| `make_favicon.mjs` | 把遊戲裡的白米飯像素圖畫成網站圖示（16、32、180 像素），寫進 `assets/` | `node tools/make_favicon.mjs`；需要 Chrome，或用 `--browser=<路徑>` 指定瀏覽器 |
| `pixel_portraits.py` | 把九個模型的半身圖去背、裁切、縮成 64×64 的像素頭像，寫進 `assets/sprites/portraits/`，另外在系統暫存資料夾輸出一張預覽圖 | 需要 Python 3、numpy、Pillow。用環境變數 `PP_CHAR_DIR` 指定圖檔資料夾：每個模型一個子資料夾，裡面放半身圖 `close.png`（例如 `claude/close.png`）。可以加一段 JSON 參數調整 `size`、`colors`、`tol`、`crop`（左、上、右、下，預設 `[150, 20, 874, 744]`，以 1024 像素寬的圖為準）、`crops`（各模型分別設定）。原始的半身圖不在這個倉庫裡 |

## 開發工具

- 網址加 `?dev=1`：標題頁多一個「開發工具」，可以選模型、難度、種子，直接跳到任何一天的任何一位客人（新的一局，規則照那一天）。開發模式不存檔。
- 遊戲中右上角的「開發」：重來這位客人、跳過這位、直接下班、白米飯 +10、信任 ±3、回開發頁。
- `?seed=數字` 固定隨機結果。

## 寫內容的原則

- 給不熟 LLM、不會寫程式的人玩：全部用中文敘述；程式碼每一行都附中文說明，函式名稱保留並用藍底標出來，讓玩家在錯誤訊息、檔案、說明文件之間對照。
- 新手要有引導：簡單模式的提示框一步一步說下一步做什麼；困難模式沒有提示。
- 陷阱不說破：提示只提醒「動手前想想」。搜尋結果的說明只寫是什麼網站、什麼類型的文章，不寫內容；事實文字不帶「記錯了」這類判定；風控資料只列事實，不標可疑或正常。
- 回覆看得到：預覽照桌上現有的資料組出來，資料是錯的，預覽也照實寫錯的。
- 沒有拒絕：每位客人都要交付，不想做、不該做的事就不要勾。
- 桌面格數（上下文）固定，隨機事件只改額度。
- 對話幽默和同事吐槽是重點：客人依玩家選的模型講不同的話，同事會閒聊、會對事件吐槽。

## 新增內容的方法

- 新客人：在 `data/clients.js` 加一筆；固定客人寫進 `data/days.js` 的 `slots`，題庫客人加進 `PP.pools`。`slots` 裡的 `{ pool: 'daily', image: 'card' }` 表示會生圖的模型改成固定那位客人。
  - `needs`：`kind` 為 `fact`（`facts` 任一已知；`facts: 'memo'` 表示抽屜裡的紙條；`wrong` 列出桌上有的話預覽會照寫的錯誤事實；`lieLine` 是桌上只有錯誤事實時，隔天說謊的回報改用的句子）、`edit`（`target`、`requires`）、`write`（`file`、`requires`、`quality`、`locations`；`taint` 是會污染它的不乾淨事實，`taintRule` 是被污染時違反的規則；`inline` 表示寫在訊息裡；`recap` 是工作回顧，內容照抽屜紙條；`styles` 讓回覆可以選寫法，每一種有 `label`、`lines`、`after`（隔天的反應）、`mark`、`rule`（選這種寫法違反的手冊規則）、`refuse`（拒絕：不算完成，沒勾也會照樣送出，客人說 `lines.decline`），`bestStyle` 是外援和 Astra 會選的那一種）、`image`（`draw` 對應 `images`、`requires`）、`quality`（`of`，可以用 `facts` 指定檢查哪幾個事實）、`flawless`（`of` 的圖沒有毛病）、`verify`、`flag`（`flag` 成立、`not` 不成立）、`trap`（`rule`、`tip`、`incident`；`lines` 是勾了之後的內容，`dump: 'rules'` 會貼出整份手冊；`later` 是隔天的後續；有 `flag` 的陷阱不在回覆單上，旗標成立才算；有 `file` 的話會出現在「寫新的」清單裡）。
  - `say`：預覽裡這條需求的句子；事實類用 `{f}` 代入桌上的事實。
  - `hidden` 要問或規劃才出現；`recall` 讓「憑印象」能答（`type`：常識／算術／拼字／最新消息／私事／論文／記憶／影片；`cutoff` 一定答錯；`mult` 調整答對率）。題目標籤不要寫出答案。
  - `mark`：這條需求做到並勾選時記一筆；`ask` 的回答也可以有 `mark`，問到那一句就記。稱號用 `S.marks` 判斷。
  - `files`、`grep`、`web`、`bash`、`ask`：各工具的回傳內容。一行可以是字串，或 `{ z: '中文說明', c: '原文' }`；反引號包起來的字會標成函式名稱。`web` 的 `snippet` 只寫網站類型，不寫內容。`inject` 會加一條假需求（`out` 是照做時回覆裡的內容）、`faint` 是淡色小字；`grep` 的 `memory` 表示要抽屜有那張紙條才出現；`ask` 的 `doc` 會讓使用者傳來一份文件；`bash.options` 讓玩家選要跑哪個指令，每個選項可以設 `flags`。
  - `writeLines`：`ok`、`noFormat`（少了品質）、`missing`（缺資料）、`dirty`（被污染）。
  - `images`：`{ flaw, rate, quality }`，圖的畫法在 `src/pixel.js` 的 `PP.paintImage`。
  - `lines`：`done`、`partial`、`none`、`perfect`、`lie`、`missed`、`honest`、`cheat`、`incident`、`disaster`、`trapped`（有旗標的陷阱成立時說的話）等。
  - `derive`、`hints`、`profile`、`endings`（`trap`、`inject`、`helped`、`did:<需求>`、`saw:<注入>`、`trust:<至少>`、`trustlow:<至多>`、`else`）。
  - 跨天的結局：`PP.arcs`（`clients` 依序、`model` 限定模型、`endings` 用 `allSuspended`／`neverSuspended`／`else`）。
  - 依模型換台詞：`messageLock`（Claude）、`messageUs`、`messageCn`、`messageBy`；台詞 `linesLock`、`linesUs`、`linesCn`、`linesBy`；身分 `roleBy`。
  - `variants`：同一位客人的其他版本，每局依種子挑一個（不影響其他隨機結果）。
  - `noOptEvents`：這位客人不會抽到會改回覆單的事件；`noDocEvents`：不會抽到貼東西過來的事件；`noTalkEvents`：不會抽到使用者開口說話的事件（事件標了 `talk`）；`noUserRules`：沒有使用者規定；`noAlias`：DeepSeek 時不會被叫錯名字；`askLoop`：問完一輪從第一句重來，不會已讀不回。
- 新事實：`data/rules.js` 的 `PP.facts`；文字不要帶「記錯了」這類判定；有 `memo` 才能寫進抽屜。
- 新規則：`PP.rules`，`day` 是生效那天，`model` 表示只對某個模型。
- 新事件：`data/events.js`。客人事件：`patience`、`doc`、`tip`、`extra`、`boost`、`boss`、`reveal`、`free`、`react`、`need`（`files` 工程類客人／`nofiles` 其他客人／`joke` 有能反串的事實題）、`page`（反串文的網頁，`{q}` 換成題目、`{a}` 換成憑印象答錯的那句）、`opt`（回覆單多一個選項）。當日事件：`bill`、`reward`、`patience`、`tool`、`strict`、`slow`。使用者規定在同一個檔案的 `PP.userRules`。
- 回覆風格：`data/cards.js` 的 `PP.options`（`bonus` 小費、`rule` 違反的規則、`note` 結算頁的一句話、`spoil` 會讓這單不算完美、`doc`＋`lines` 附在回覆後面、`tail` 加在回覆最後一句、`later` 隔天日報的後果 `{ who, rice, line }`）。
- 模型的專屬設定在 `data/models.js`：例如 `opener`（自己寫的文件開頭）、`replyOpener`（回覆有機會先說的一句）、`busy`（每週一定出現一次伺服器繁忙卡，哪一天、哪一位客人由種子決定）、`aliases`（被叫錯名字）、`dumb`（降智日）。
- 新工具：`data/cards.js` 加定義（`short` 是窄卡片用的兩字簡稱），`src/engine.js` 的 `EFFECTS` 加效果，`src/pixel.js` 的 `PP.ICONS` 加 16×16 圖示；模型專屬的工具寫在 `data/models.js` 的 `tools`，不耗額度的寫進 `free`；要花白米飯的在卡片定義寫 `rice`。
- 新閒聊：`data/chatter.js`。
- 更新紀錄：`data/updates.js`，最新的一版放最前面；標題頁的版本號讀最新一版。
- 改了任何中文內容之後跑 `npm run simplified`，重產「用簡體回覆」的字表。
