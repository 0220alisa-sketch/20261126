let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let char2StopSprite; // 儲存角色二的待機精靈圖（2/stop/stop.png）
let char2ActionSprite; // 儲存角色二的動作精靈圖（2/action/action.png）

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 數學加法選擇題與作答特效狀態
let wasNearChar2 = false; // 記錄上一個畫面角色一是否接近角色二
let currentQuiz = null; // 儲存目前產生的加法選擇題物件
let optionButtons = []; // 儲存四個選項按鈕的座標與尺寸
let hoveredOptionIndex = -1; // 記錄目前滑鼠懸停的選項索引
let answeredState = null; // 記錄目前作答結果（"correct" 或 "wrong" 或 null）
let effectStartTime = 0; // 記錄特效開始的毫秒時間（millis）
const feedbackDurationMs = 3000; // 答對煙火與答錯閃電特效皆為 3 秒（3000 毫秒）
let fireworks = []; // 儲存煙火粒子資料
let nextFireworkSpawnMs = 0; // 控制下一次發射煙火的時間

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

// 角色二精靈圖參數
const char2StopFrameCount = 8; // 2/stop/stop.png 共 8 張
const char2StopFrameWidth = 699 / char2StopFrameCount; // 全寬 699
const char2StopFrameHeight = 190; // 高 190

const char2ActionFrameCount = 14; // 2/action/action.png 共 14 張
const char2ActionFrameWidth = 1871 / char2ActionFrameCount; // 全寬 1871
const char2ActionFrameHeight = 177; // 高 177

function preload() { // 在畫布建立前載入圖片資源
  bgImage = loadImage("bg/3.png"); // 載入背景圖片 bg/3.png
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
  char2StopSprite = loadImage("2/stop/stop.png"); // 載入角色二的待機精靈圖
  char2ActionSprite = loadImage("2/action/action.png"); // 載入角色二的動作精靈圖
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
  currentQuiz = generateAdditionQuiz(); // 預先建立一組加法選擇題
} // 結束初始化函式

function generateAdditionQuiz() { // 產生一題加法選擇題與四個不重複選項
  const a = floor(random(5, 36)); // 隨機產生第一個加數
  const b = floor(random(5, 36)); // 隨機產生第二個加數
  const answer = a + b; // 計算正確答案
  const optionSet = new Set([answer]); // 使用 Set 確保四個選項不重複

  while (optionSet.size < 4) { // 補足四個選項
    const offset = floor(random(-8, 9)); // 在正確答案附近產生干擾值
    const candidate = max(0, answer + offset); // 確保選項為非負整數
    optionSet.add(candidate); // 加入選項集合
  }

  const options = shuffle(Array.from(optionSet)); // 打亂選項順序
  return {
    question: `${a} + ${b} = ?`,
    answer: answer,
    options: options,
    correctIndex: options.indexOf(answer)
  };
}

function resetQuizSession() { // 重置題目與作答狀態
  currentQuiz = generateAdditionQuiz();
  answeredState = null;
  hoveredOptionIndex = -1;
  fireworks = [];
}

function spawnFireworkBurst(x, y) { // 產生單次煙火爆炸粒子
  const palette = [
    color(255, 89, 94),
    color(255, 202, 58),
    color(138, 201, 38),
    color(25, 130, 196),
    color(255, 120, 203),
    color(255, 255, 255)
  ];
  const baseColor = random(palette);
  const particleCount = 34;

  for (let i = 0; i < particleCount; i++) {
    const angle = (TWO_PI / particleCount) * i + random(-0.08, 0.08);
    const speed = random(2.2, 7.2);
    fireworks.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed - random(0.5, 1.8),
      alpha: 255,
      size: random(4, 8),
      col: baseColor
    });
  }
}

function updateAndDrawFireworks(nowMs) { // 繪製並更新持續 3 秒的煙火特效
  if (nowMs >= nextFireworkSpawnMs && nowMs - effectStartTime < feedbackDurationMs - 350) {
    const burstX = random(width * 0.2, width * 0.8);
    const burstY = random(height * 0.18, height * 0.65);
    spawnFireworkBurst(burstX, burstY);
    nextFireworkSpawnMs = nowMs + 360;
  }

  push();
  noStroke();
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.11; // 模擬重力下墜
    p.vx *= 0.985; // 模擬空氣阻力
    p.alpha = max(0, p.alpha - 4.2);

    fill(red(p.col), green(p.col), blue(p.col), p.alpha);
    circle(p.x, p.y, p.size);

    if (p.alpha <= 0) {
      fireworks.splice(i, 1);
    }
  }
  pop();
}

function drawLightningEffect(elapsedMs) { // 繪製並更新持續 3 秒的閃電特效
  const progress = elapsedMs / feedbackDurationMs;
  const fadeAlpha = 1 - pow(progress, 2); // 隨時間平滑淡出

  push();
  // 短暫電光閃爍底層
  if (floor(elapsedMs / 110) % 2 === 0) {
    noStroke();
    fill(255, 250, 190, 55 * fadeAlpha);
    rect(0, 0, width, height);
  }

  // 繪製多道鋸齒狀閃電
  const boltCount = 3;
  for (let b = 0; b < boltCount; b++) {
    const startX = width * (0.22 + b * 0.28) + random(-25, 25);
    let currX = startX;
    let currY = 0;
    const targetY = height * random(0.68, 0.92);
    const segments = 12;
    const stepY = targetY / segments;

    const points = [{ x: currX, y: currY }];
    for (let s = 1; s <= segments; s++) {
      currX += random(-42, 42);
      currY = s * stepY;
      points.push({ x: currX, y: currY });
    }

    // 外部電光暈
    noFill();
    stroke(80, 180, 255, 150 * fadeAlpha);
    strokeWeight(12);
    beginShape();
    for (const pt of points) vertex(pt.x, pt.y);
    endShape();

    // 閃電核心亮線
    stroke(255, 255, 240, 245 * fadeAlpha);
    strokeWeight(3.5);
    beginShape();
    for (const pt of points) vertex(pt.x, pt.y);
    endShape();
  }
  pop();
}

function drawQuizBox(isNearChar2) { // 在畫布上方繪製透明度 90 的黃色加法選擇題方框
  if (!isNearChar2 || !currentQuiz) {
    optionButtons = [];
    hoveredOptionIndex = -1;
    return;
  }

  const boxWidth = width / 3; // 寬為整個畫布寬的 1/3
  const boxHeight = height / 2; // 高為整個畫布高的 1/2
  const boxX = (width - boxWidth) / 2; // 方框中間對準畫布中間
  const boxY = max(12, height * 0.03); // 方框上方靠近畫布上方

  push();
  // 黃色方框（透明度 90）
  fill(255, 225, 50, 90);
  stroke(190, 140, 0, 210);
  strokeWeight(2.5);
  rect(boxX, boxY, boxWidth, boxHeight, 16);

  // 題目文字
  const titleSize = constrain(min(boxWidth * 0.065, boxHeight * 0.11), 16, 28);
  const questionSize = constrain(min(boxWidth * 0.11, boxHeight * 0.18), 22, 42);

  noStroke();
  fill(45, 35, 0);
  textAlign(CENTER, CENTER);
  textSize(titleSize);
  text("加法挑戰", boxX + boxWidth / 2, boxY + boxHeight * 0.14);

  textSize(questionSize);
  textStyle(BOLD);
  text(currentQuiz.question, boxX + boxWidth / 2, boxY + boxHeight * 0.30);
  textStyle(NORMAL);

  // 四個選項按鈕（2x2 排列於方框下半部）
  const cols = 2;
  const rows = 2;
  const padX = boxWidth * 0.08;
  const gapX = boxWidth * 0.05;
  const gapY = boxHeight * 0.05;
  const btnWidth = (boxWidth - padX * 2 - gapX) / cols;
  const btnHeight = constrain(boxHeight * 0.16, 34, 64);
  const gridTopY = boxY + boxHeight * 0.44;

  optionButtons = [];
  hoveredOptionIndex = -1;
  const btnTextSize = constrain(min(btnWidth * 0.24, btnHeight * 0.48), 16, 28);

  for (let i = 0; i < currentQuiz.options.length; i++) {
    const col = i % cols;
    const row = floor(i / cols);
    const bx = boxX + padX + col * (btnWidth + gapX);
    const by = gridTopY + row * (btnHeight + gapY);

    const isHover =
      mouseX >= bx && mouseX <= bx + btnWidth && mouseY >= by && mouseY <= by + btnHeight;
    if (isHover) {
      hoveredOptionIndex = i;
    }

    let btnFill = isHover ? color(255, 252, 220, 245) : color(255, 255, 255, 225);
    let btnStroke = color(140, 100, 0);

    if (answeredState !== null) {
      if (i === currentQuiz.correctIndex) {
        btnFill = color(160, 240, 180, 245);
        btnStroke = color(25, 135, 60);
      } else if (isHover && answeredState === "wrong") {
        btnFill = color(255, 175, 175, 245);
        btnStroke = color(190, 40, 40);
      }
    }

    fill(btnFill);
    stroke(btnStroke);
    strokeWeight(2);
    rect(bx, by, btnWidth, btnHeight, 10);

    noStroke();
    fill(30, 30, 30);
    textSize(btnTextSize);
    text(currentQuiz.options[i], bx + btnWidth / 2, by + btnHeight / 2);

    optionButtons.push({ x: bx, y: by, w: btnWidth, h: btnHeight, index: i });
  }

  // 作答回饋訊息
  if (answeredState !== null) {
    const statusY = min(boxY + boxHeight - 18, gridTopY + rows * (btnHeight + gapY) + 14);
    textSize(constrain(boxHeight * 0.075, 14, 22));
    if (answeredState === "correct") {
      fill(20, 120, 50);
      text("答對了！煙火施放中（3秒）", boxX + boxWidth / 2, statusY);
    } else {
      fill(185, 35, 35);
      text(`答錯了！正確答案是 ${currentQuiz.answer}（閃電 3秒）`, boxX + boxWidth / 2, statusY);
    }
  }

  pop();
}

function draw() { // 每個畫面更新一次背景與角色
  background("#87CEEB"); // 預設底色避免圖片載入前空白

  // 計算單張背景圖片依畫布高度等比例縮放後的寬度（確保至少與畫布同寬以完整覆蓋畫面）
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 計算三張背景串接後的可捲動範圍
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3; // 角色在捲動模式下的基準水平位置

  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算適合不同裝置的移動速度

  // 維持角色高度為畫布高度的 1/3，寬度依原圖寬高比等比例縮放
  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale; // 計算角色基本顯示寬度
  const characterHeight = height / 3;

  if (movingRight) { // 按住右方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = 1; // 設定角色朝向右方
    if (characterX < anchorX) {
      // 若角色先前因碰到最左邊界而往左移動，先讓角色走回基準點再捲動背景
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      // 背景尚未到達最右邊，背景往左移動
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      // 背景已到達最右邊，暫停背景捲動並改為角色向右移動
      characterX += movementStep; // 讓角色向右移動
    }
  } else if (movingLeft) { // 按住左方向鍵
    isWalking = true; // 切換至走路動畫
    facingDirection = -1; // 設定角色朝向左方
    if (characterX > anchorX) {
      // 若角色先前因碰到最右邊界而往右移動，先讓角色走回基準點再捲動背景
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      // 背景尚未到達最左邊，背景往右移動
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      // 背景已到達最左邊，暫停背景捲動並改為角色向左移動
      characterX -= movementStep; // 讓角色向左移動
    }
  }

  // 限制角色中心避免超出畫布左右邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2); // 限制角色中心避免超出畫布左右邊界

  // 計算角色二位置：最左邊背景圖（i = -1）的中間
  const leftmostBgLeftX = bgOffsetX - singleBgWidth;
  const char2X = leftmostBgLeftX + singleBgWidth / 2;

  // 判斷角色一是否接近角色二
  const proximityThreshold = max(characterWidth, singleBgWidth * 0.25);
  const isNearChar2 = abs(characterX - char2X) <= proximityThreshold;

  // 剛靠近角色二時產生新題目；離開角色二時重置題目狀態
  if (isNearChar2 && !wasNearChar2) {
    resetQuizSession();
  } else if (!isNearChar2 && wasNearChar2) {
    answeredState = null;
    hoveredOptionIndex = -1;
    fireworks = [];
  }
  wasNearChar2 = isNearChar2;

  const nowMs = millis();
  const elapsedFeedbackMs = nowMs - effectStartTime;
  const isFeedbackActive = answeredState !== null && elapsedFeedbackMs < feedbackDurationMs;

  if (answeredState !== null && !isFeedbackActive && !isNearChar2) {
    answeredState = null;
  }

  push();
  // 答錯閃電期間加入輕微震動感
  if (isFeedbackActive && answeredState === "wrong") {
    translate(random(-5, 5), random(-4, 4));
  }

  // 繪製三張左右串接的背景圖片（左：i = -1、中：i = 0、右：i = 1）
  if (bgImage) {
    push();
    imageMode(CORNER); // 背景使用左上角座標對齊無縫串接
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // 繪製角色二（若角色一在角色二左邊，角色二水平翻轉面向左；預設面向右）
  const char2Sprite = isNearChar2 ? char2ActionSprite : char2StopSprite;
  const char2FrameCount = isNearChar2 ? char2ActionFrameCount : char2StopFrameCount;
  const char2SrcFrameWidth = isNearChar2 ? char2ActionFrameWidth : char2StopFrameWidth;
  const char2SrcFrameHeight = isNearChar2 ? char2ActionFrameHeight : char2StopFrameHeight;

  if (char2Sprite) {
    const char2Scale = characterHeight / char2StopFrameHeight; // 以待機高度對齊角色高度比例
    const char2DrawWidth = char2SrcFrameWidth * char2Scale;
    const char2DrawHeight = char2SrcFrameHeight * char2Scale;
    const char2Y = height - char2DrawHeight / 2; // 底部對齊畫布底部
    const char2FrameIndex = floor(frameCount / framesPerStep) % char2FrameCount;
    const char2SourceX = char2FrameIndex * char2SrcFrameWidth;
    const char2Facing = characterX < char2X ? -1 : 1; // 角色一在左邊時轉向（-1）

    push();
    translate(char2X, char2Y);
    scale(char2Facing, 1);
    image(
      char2Sprite,
      0,
      0,
      char2DrawWidth,
      char2DrawHeight,
      char2SourceX,
      0,
      char2SrcFrameWidth,
      char2SrcFrameHeight
    );
    pop();
  }

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇施法、走路或站立精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; // 取得目前精靈圖的影格總數
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; // 取得目前精靈圖每格的寬度
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; // 取得目前精靈圖每格的高度
  const elapsedMagicFrames = frameCount - magicStartFrame; // 計算施法動畫已播放的畫面數
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; // 計算目前要顯示的精靈影格
  const sourceX = frameIndex * activeFrameWidth; // 計算目前影格在精靈圖中的水平起點
  const activeWidth = activeFrameWidth * characterScale; // 計算目前角色影格的顯示寬度
  const activeHeight = activeFrameHeight * characterScale; // 計算目前角色影格的顯示高度
  const characterY = height - activeHeight / 2; // 將目前角色影格底部對齊畫布底部

  push(); // 暫存目前的繪圖座標轉換狀態
  translate(characterX, characterY); // 將繪圖原點移至角色中心
  scale(isCasting ? magicDirection : facingDirection, 1); // 依施法或角色朝向決定是否水平翻轉
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); // 裁切並繪製目前角色影格
  pop(); // 還原繪圖座標轉換狀態

  const effectScale = characterScale; // 使用角色縮放倍率讓特效適應不同畫布
  const effectWidth = effectFrameWidth * effectScale; // 計算特效影格的顯示寬度
  const effectHeight = effectFrameHeight * effectScale; // 計算特效影格的顯示高度
  const effectSpeed = max(6, width * 0.008); // 依畫布寬度計算特效飛行速度
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { // 由後往前更新所有飛行中的特效
    const effect = activeEffects[effectIndex]; // 取得目前更新的特效資料
    effect.x += effect.direction * effectSpeed; // 依特效方向更新水平位置
    if (effect.x > width || effect.x < 0) { // 判斷特效是否已抵達畫布左右邊緣
      activeEffects.splice(effectIndex, 1); // 移除已飛出畫布的特效
      continue; // 略過已移除特效的繪製
    } // 結束特效邊界判斷
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; // 計算特效目前播放的影格
    push(); // 暫存目前的繪圖座標轉換狀態
    translate(effect.x, effect.y); // 將繪圖原點移至特效中心
    scale(effect.direction, 1); // 依飛行方向翻轉特效影格
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); // 裁切並繪製目前特效影格
    pop(); // 還原繪圖座標轉換狀態
  } // 結束飛行中特效更新迴圈

  // 繪製答對 3 秒煙火或答錯 3 秒閃電
  if (isFeedbackActive && answeredState === "correct") {
    updateAndDrawFireworks(nowMs);
  } else if (isFeedbackActive && answeredState === "wrong") {
    drawLightningEffect(elapsedFeedbackMs);
  } else if (fireworks.length > 0) {
    updateAndDrawFireworks(nowMs);
  }

  // 在畫布上方繪製加法選擇題黃色方框與按鈕
  drawQuizBox(isNearChar2);

  pop();
} // 結束繪圖函式

function mousePressed() { // 處理作答選項按鈕點擊
  if (!wasNearChar2 || !currentQuiz || optionButtons.length === 0) {
    return;
  }

  for (const btn of optionButtons) {
    if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
      const selectedValue = currentQuiz.options[btn.index];
      effectStartTime = millis();
      fireworks = [];

      if (selectedValue === currentQuiz.answer) {
        answeredState = "correct";
        nextFireworkSpawnMs = effectStartTime;
        spawnFireworkBurst(width * 0.5, height * 0.35);
      } else {
        answeredState = "wrong";
      }
      break;
    }
  }
}

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { // 判斷是否按下右方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = 1; // 讓角色面向右方
    return false; // 防止方向鍵捲動網頁
  } // 結束右方向鍵判斷
  if (keyCode === LEFT_ARROW) { // 判斷是否按下左方向鍵
    isWalking = true; // 啟用走路動畫
    facingDirection = -1; // 讓角色面向左方
    return false; // 防止方向鍵捲動網頁
  } // 結束左方向鍵判斷
  if (keyCode === 32) { // 判斷是否按下空白鍵
    if (!spaceIsDown && !isCasting) { // 僅在空白鍵新按下且角色未施法時觸發
      isCasting = true; // 開始播放施法動畫
      magicStartFrame = frameCount; // 記錄施法動畫的起始畫面
      magicDirection = facingDirection; // 鎖定施法當下角色面向
    } // 結束施法啟動判斷
    spaceIsDown = true; // 記錄空白鍵已按住以避免連續觸發
    return false; // 防止空白鍵捲動網頁
  } // 結束空白鍵判斷
} // 結束按鍵事件處理函式

function keyReleased() { // 鍵盤按鍵放開時更新按鍵狀態
  if (keyCode === 32) { // 判斷放開的是否為空白鍵
    spaceIsDown = false; // 允許下次按空白鍵重新施法
  } // 結束空白鍵放開判斷
} // 結束按鍵放開事件處理函式

function windowResized() { // 視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布同步為新的視窗尺寸
  characterX = constrain(characterX, 1, width - 1); // 將角色位置限制在縮放後畫布內
} // 結束視窗縮放處理函式