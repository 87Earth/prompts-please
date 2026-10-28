# 開發說明

## 架構

- 純前端，沒有建置步驟：`index.html` 依序載入 `src/pixel.js`、`src/audio.js`、`data/*.js`、`src/vendor/opencc-js/t2cn.js`、`src/lang.js`、`src/engine.js`、`src/ui.js`、`src/main.js`，全部掛在全域物件 `PP` 上。用瀏覽器直接打開就能玩（`file://` 也可以）。
- `src/engine.js`（`PP.E`）：遊戲規則與狀態，不碰畫面。亂數的狀態存在 `S.rs`，同一個種子的結果相同，存檔讀回後的發展也相同。
- `src/ui.js`（`PP.UI`）：畫面、辦公室動畫、彩蛋、開發工具。
- `src/lang.js`：語言切換與繁轉簡，見下面的「簡體中文」。
- `src/pixel.js`：像素圖（模型小人、客人頭像、圖示、生成的圖）。`src/audio.js`：Web Audio 即時合成的音效與音樂。`src/main.js`：縮放與啟動。
- `data/`：所有內容都是資料（模型、工具、規則、事實、客人、每天的安排、事件、閒聊），新增內容大多只改這裡。
- 存檔與設定存在瀏覽器的 localStorage：`pp_save`（中途存檔）、`pp_endings`、`pp_titles`、`pp_lang`（語言）、`pp_diff`（難度）、`pp_hints`（提示開關）。

測試和自動試玩的方法見 [testing.md](testing.md)。

## 工具（`tools/`）

測試用的 `fuzz.mjs`、`playtest.mjs`、`layout_check.mjs`、`pages_check.mjs` 見 [testing.md](testing.md)。下面這些是產生遊戲資料和素材用的，先在專案資料夾執行 `npm install`。

| 工具 | 用途 | 用法 |
|---|---|---|
| `zh_check.mjs` | 簡體轉換檢查（`npm test` 會跑，見 [testing.md](testing.md)），也用來看簡體版長什麼樣子 | `npm run zh -- --show=<客人 id>` 列出那位客人所有文字的繁簡對照；`--show=<字詞>` 搜尋含那個詞的句子；`--show=fixes` 列出 `data/zh.js` 改到的句子和 OpenCC 原本的結果 |
| `content_stats.mjs` | 從遊戲資料數出內容數量（模型、工具、規則、客人、事件、結局、稱號等），用來核對 [events.md](events.md) 的數字 | `node tools/content_stats.mjs` |
| `make_toy_assets.mjs` | 產生 B 站 Toy 列表用的封面（1200×900）與圖標（512×512）：辦公室像素畫、九個模型頭像、標題與白米飯圖示，用遊戲本身的字型與素材畫成 | `node tools/make_toy_assets.mjs`（預設簡體、輸出到 `work/toy/`；`--lang=tw` 改繁體，`--out=<資料夾>` 改輸出位置）；需要 Chrome，或用 `--browser=<路徑>` 指定瀏覽器 |
| `toy_pkg.mjs` | 產生 B 站 Toy 版的遊戲包：從目前的提交取出 `index.html`、`src/`、`data/`、`assets/` 到 `work/toy/pkg`，套用 `toy_patch.json` 的替換，再檢查 `forbid` 列的字沒有留下。`toy_patch.json` 只給 B 站審核用，GitHub 版和網頁版都照原本文案；替換對不上原文時會報錯，要照新原文更新 | `node tools/toy_pkg.mjs`；加 `--test` 會在 `work/toy/test` 的副本跑 fuzz、zh_check 和簡繁 layout_check |
| `toy_split.mjs` | 把 `toy_patch.json` 的 `split` 指定的資料檔拆成小檔（每位客人、事件、模型、閒聊各一檔），B 站審核退件時會點名到小檔；拆完會比對資料和拆之前完全相同。`split.drop` 列出的客人或劇情線不放進 B 站版（空出的固定位置由 `toy_patch.json` 改成從題庫抽） | 在 `toy_pkg.mjs` 之後執行 `node tools/toy_split.mjs`；加 `--test` 再跑簡繁 layout_check |
| `toy_dict.mjs` | B 站 Toy 版的簡體字典精簡：`src/vendor/opencc-js/t2cn.js` 只留下遊戲文字用得到的詞條（原本約 8,000 條），確認每個檔案轉出來的簡體和完整字典完全相同才寫入，並在同資料夾寫一份 `MODIFIED.md` 註明修改過 | 在 `toy_split.mjs` 之後執行 `node tools/toy_dict.mjs`；加 `--pretty` 用 prettier 排版成多行（第一次要連網下載），加 `--test` 再跑簡繁 layout_check |
| `make_favicon.mjs` | 把遊戲裡的白米飯像素圖畫成網站圖示（16、32、180 像素），寫進 `assets/` | `node tools/make_favicon.mjs`；需要 Chrome，或用 `--browser=<路徑>` 指定瀏覽器 |
| `pixel_portraits.py` | 把九個模型的半身圖去背、裁切、縮成 64×64 的像素頭像，寫進 `assets/sprites/portraits/`，另外在系統暫存資料夾輸出一張預覽圖 | 需要 Python 3、numpy、Pillow。用環境變數 `PP_CHAR_DIR` 指定圖檔資料夾：每個模型一個子資料夾，裡面放半身圖 `close.png`（例如 `claude/close.png`）。可以加一段 JSON 參數調整 `size`、`colors`、`tol`、`crop`（左、上、右、下，預設 `[150, 20, 874, 744]`，以 1024 像素寬的圖為準）、`crops`（各模型分別設定）。原始的半身圖不在這個倉庫裡 |

## 簡體中文

- 繁體是原稿，所有內容只寫繁體。玩家選了简体中文時，畫面上的字在顯示前轉成簡體：`src/lang.js` 用 opencc-js 做 OpenCC 的「臺灣正體 → 大陸簡體」轉換，連臺灣用語一起換（例如「影片」→「视频」、「檔案」→「文件」、「程式碼」→「代码」）。`src/vendor/opencc-js/t2cn.js` 是 npm 套件 opencc-js 原封不動的 `dist/umd/t2cn.js`，授權檔在同一個資料夾。
- `data/zh.js` 的 `PP.ZH_FIX` 是遊戲專用的用語對照（繁體寫法 → 簡體寫法）。它和 OpenCC 的臺灣用語詞典一起做最長詞匹配，同一個詞以這裡為準，所以「執行程式」裡的「行程」不會被誤配。用在三種情況：
  - OpenCC 轉錯的詞，例如「行程」會變成「进程」、「計算機」要變「计算器」（大陸的「计算机」是電腦）、「寫進程式碼」被斷成「进程＋式码」。
  - 大陸讀者不熟的臺灣用語，例如「預設」→「默认」、「群組」→「群聊」、「貼文」→「帖子」、「牠」→「它」、「德州」→「得州」。
  - 簡中字型沒有的字：「阿嬤」→「奶奶」、「諂媚」→「奉承」。
- 轉換在畫面上做：`MutationObserver` 把新加進畫面的文字轉成簡體，存檔和遊戲資料都還是繁體，所以切換語言不影響存檔。寫畫面程式時要注意：
  - canvas 上的字要自己轉：文字用 `PP.L(文字)`，字型用 `'12px ' + PP.font()`（等寬字型 `PP.font(true)`）；畫好會快取的圖，快取鍵要帶 `PP.lang`。
  - 設了 `innerHTML` 之後馬上量尺寸的地方，先呼叫 `PP.zhFlush()` 讓轉換先完成（`frame()`、`overlay()` 已經呼叫了）。
  - OpenCC 的轉換不是冪等的：「檔案」轉成「文件」之後再轉一次，會被當成臺灣的「文件」變成「文档」。所以不要把 `PP.zhCN()` 轉過的字再放進畫面；一定要放的時候，包在 `class="zh-keep"` 裡（例如回覆單「用簡體回覆」的預覽），`zh-keep` 裡的字不會被轉換。語言按鈕的「繁體中文」也是靠它保持繁體。也不要從畫面讀回文字再寫回去（`textContent +=`、`cloneNode`）。
  - 中文不要寫在 CSS 的 `content` 或 HTML 屬性（`title`、`alt`、`placeholder`、`aria-label`）裡，畫面轉換轉不到；要放在頁面文字裡（例如「點開／收合」是兩個 `<i>`，用 CSS 切換顯示哪一個）。
- 字型：簡體用 Fusion Pixel 12px 簡中版（CSS 字型名 `FPS`、`FPMS`）。`html` 的 `lang` 是 `zh-Hans` 時，CSS 變數 `--fp`、`--fpm` 換成簡中版。兩版的字寬完全相同，版面不會變。
- 語言存在 localStorage 的 `pp_lang`。第一次打開時看瀏覽器語言：zh-CN、zh-SG、zh-Hans 開簡體，其他開繁體。網址參數 `?lang=cn`、`?lang=tw` 可以直接指定。
- 新增的每一段文字都要有繁簡兩種版本，步驟：
  1. 照常寫繁體。
  2. `npm run zh -- --show=<客人 id>`（或 `--show=<字詞>`）列出繁簡對照，把大陸讀者看不懂或不自然的詞加進 `data/zh.js`。
  3. `npm test`：其中的 `zh_check.mjs` 會檢查轉換流程和 OpenCC 一致、對照表每一條都有作用、對照表的簡體寫法不會再被轉、繁中和簡中字型都不缺字。
  4. `node tools/layout_check.mjs --lang=cn`，再用 `--lang=cn` 自動試玩並看截圖。

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
- 新規則：`PP.rules`，`day` 是生效那天，`model` 表示只對某個模型，`lang` 表示只在某個語言版本出現（`tw` 繁體、`cn` 簡體）。
- 新事件：`data/events.js`。客人事件：`patience`、`doc`、`tip`、`extra`、`boost`、`boss`、`reveal`、`free`、`react`、`need`（`files` 工程類客人／`nofiles` 其他客人／`joke` 有能反串的事實題）、`page`（反串文的網頁，`{q}` 換成題目、`{a}` 換成憑印象答錯的那句）、`opt`（回覆單多一個選項）。當日事件：`bill`、`reward`、`patience`、`tool`、`strict`、`slow`。使用者規定在同一個檔案的 `PP.userRules`。
- 回覆風格：`data/cards.js` 的 `PP.options`（`bonus` 小費、`rule` 違反的規則、`note` 結算頁的一句話、`spoil` 會讓這單不算完美、`doc`＋`lines` 附在回覆後面、`tail` 加在回覆最後一句、`later` 隔天日報的後果 `{ who, rice, line }`）。
- 模型的專屬設定在 `data/models.js`：例如 `opener`（自己寫的文件開頭）、`replyOpener`（回覆有機會先說的一句）、`busy`（每週一定出現一次伺服器繁忙卡，哪一天、哪一位客人由種子決定）、`aliases`（被叫錯名字）、`dumb`（降智日）。
- 新工具：`data/cards.js` 加定義（`short` 是窄卡片用的兩字簡稱），`src/engine.js` 的 `EFFECTS` 加效果，`src/pixel.js` 的 `PP.ICONS` 加 16×16 圖示；模型專屬的工具寫在 `data/models.js` 的 `tools`，不耗額度的寫進 `free`；要花白米飯的在卡片定義寫 `rice`。
- 新閒聊：`data/chatter.js`。
- 更新紀錄：`data/updates.js`，最新的一版放最前面；標題頁的版本號讀最新一版。
- 改了任何中文內容之後跑 `npm test`，新增的文字照「簡體中文」一節檢查簡體版。
