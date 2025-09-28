const canvas = document.getElementById("plinkoCanvas");
const ctx = canvas.getContext("2d");

const pegs = [];
const pegRows = [];
const lastRowPegs = [];
const slots = [110, 7, 11, 0.11, 3.5, 0.2, 1.5, 0.5, 0.5, 1.5, 2, 3.5, 5.1, 1.1, 0.01, 1000];
const slotColors = [
  "#c0392b", "#e67e22", "#f1c40f", "#27ae60", "#2980b9",
  "#8e44ad", "#16a085", "#7f8c8d", "#7f8c8d", "#16a085",
  "#8e44ad", "#2980b9", "#27ae60", "#f1c40f", "#e67e22", "#f39c12"
];

const slotWidth = 30;
let ball = null;
let currentWallet = null;

function createPegs() {
  const rows = 16;
  const spacingX = 30;
  const spacingY = 35;

  for (let row = 1; row < rows; row++) {
    const pegsInRow = row + 1;
    const offsetX = (canvas.width - pegsInRow * spacingX ) / 2;
    const rowPegs = [];

    for (let i = 0; i < pegsInRow; i++) {
      const x = offsetX + i * spacingX;
      const y = 80 + row * spacingY;
      pegs.push({ x, y });
      rowPegs.push(x);

      if (row === rows - 1) {
        lastRowPegs.push(x);
      }
    }

    pegRows.push({ y: 80 + row * spacingY, xs: rowPegs });
  }
}

function getAllowedXRange(y) {
  let closestRow = pegRows[0];

  for (let row of pegRows) {
    if (Math.abs(row.y - y) < Math.abs(closestRow.y - y)) {
      closestRow = row;
    }
  }

  const min = closestRow.xs[0] - slotWidth / 2;
  const max = closestRow.xs[closestRow.xs.length - 1] + slotWidth / 2;
  return { min, max };
}

function drawPegs() {
  ctx.fillStyle = "#2c3e50";
  pegs.forEach(peg => {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSlots() {
  for (let i = 0; i < lastRowPegs.length; i++) {
    const x = lastRowPegs[i] - slotWidth / 2;
    const y = canvas.height - 50;

    const color = slotColors[i % slotColors.length];
    const label = slots[i % slots.length];

    ctx.fillStyle = color;
    ctx.fillRect(x, y, slotWidth, 50);

    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(`${label}xp`, x + 5, y + 30);
  }
}
function drawBall() {
  if (ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

function getClosestSlotIndex(x) {
  let closestIndex = 0;
  let minDist = Infinity;

  for (let i = 0; i < lastRowPegs.length; i++) {
    const dist = Math.abs(x - lastRowPegs[i]);
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}
function saveWin(wallet, prize) {
  if (!wallet) return;

  const history = JSON.parse(localStorage.getItem("winHistory") || "{}");

  if (!history[wallet]) {
    history[wallet] = [];
  }

  history[wallet].push(prize);
  localStorage.setItem("winHistory", JSON.stringify(history));
}

function updateBall() {
  if (!ball) return;

  ball.vy += 0.4;
  ball.y += ball.vy;
  ball.x += ball.vx;

  // محدود کردن توپ داخل مثلث در هر فریم
  const { min, max } = getAllowedXRange(ball.y);
  if (ball.x < min + 10) {
    ball.x = min + 10;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x > max - 10) {
    ball.x = max - 10;
    ball.vx = -Math.abs(ball.vx);
  }

  // برخورد با میخ‌ها
  pegs.forEach(peg => {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 15) {
      ball.vx += (Math.random() - 0.5) * 2;
      ball.vy *= -0.5;
      ball.vx = Math.max(-3, Math.min(3, ball.vx)); // محدود کردن سرعت افقی
    }
  });

  // رسیدن به پایین
  if (ball.y > canvas.height - 60) {
    const slotIndex = getClosestSlotIndex(ball.x);
    const prize = slots[slotIndex];
    const bet = parseFloat(document.getElementById("amountInput").value);
    const payout = (prize * bet).toFixed(2);
    alert(`🎉 Your Reward ${prize} x ${bet} = ${payout} ZTC`);
    if(!isNaN(bet)) {
    saveWin(currentWallet, prize); // ذخیره برد برای والت فعلی
    }
    ball = null;
  }
}


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPegs();
  drawSlots();
  drawBall();
  updateBall();
  requestAnimationFrame(draw);
}

document.getElementById("dropBall").addEventListener("click", () => {
  if (!ball) {
    const topRow = pegRows[0];
    const centerX = (topRow.xs[0] + topRow.xs[topRow.xs.length - 1]) / 2;

    ball = {
      x: centerX,
      y: 50,
      vx: (Math.random() - 0.5) * 2,
      vy: 0
    };
  }
});
function setPercentage(percent) {
  const current = parseFloat(document.getElementById("amountInput").value) || 0;
  const newAmount = (current * percent / 100).toFixed(2);
  document.getElementById("amountInput").value = newAmount;
}

function showWalletInfo(wallet) {
  const addressEl = document.getElementById("walletAddress");
  const winsEl = document.getElementById("walletWins");

  addressEl.textContent = ` Wallet : ${wallet}`;

  const history = JSON.parse(localStorage.getItem("winHistory") || "{}");
  const wins = history[wallet] || [];

  winsEl.innerHTML = ""; // پاک کردن لیست قبلی

  if (wins.length === 0) {
    winsEl.innerHTML = "<li>هنوز بردی ثبت نشده</li>";
  } else {
    wins.forEach((win, index) => {
      const li = document.createElement("li");
      li.textContent =` Win${index + 1}: ${win}x`;
      winsEl.appendChild(li);
    });
  }
}

createPegs();
draw();


document.getElementById("connectWallet").addEventListener("click", async () => {
  const connectBtn = document.getElementById("connectWallet");

  if (!window.ethereum) {
    alert("🦊 لطفاً MetaMask نصب کنید.");
    return;
  }
  try {
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: "0x20d8",
      chainName: "ZenChain Testnet",
      nativeCurrency: {
        name: "ZenChain Token",
        symbol: "ZTC",
        decimals: 18
      },
      rpcUrls: ["https://zenchain-testnet.api.onfinality.io/public"],
      blockExplorerUrls: ["https://explorer.zenchain.xyz"]
    }]
  });
} catch (err) {
  console.error("خطا در افزودن شبکه:", err.message);
}
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts[0];
    currentWallet = address; // ذخیره آدرس برای استفاده بعدی
    showWalletInfo(currentWallet);
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    connectBtn.textContent =`🟢 ${shortAddress}`;
  } catch (err) {
    alert("❌ اتصال ناموفق: " + err.message);
  }
});

document.getElementById("sendZTC").addEventListener("click", async () => {
  const amount = document.getElementById("amountInput").value;
  const recipient = "0xeedC4027deFa2f41b9faC477B9F389389b1EEc64";

  if (!window.ethereum) {
    alert("🦊 لطفاً MetaMask نصب کنید.");
    return;
  }

  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const sender = accounts[0];

    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** 18)).toString(16);

    const txParams = {
      from: sender,
      to: recipient,
      value: "0x" + amountInWei
    };

    const txHash = await ethereum.request({
      method: "eth_sendTransaction",
      params: [txParams]
    });

    alert(`✅ تراکنش ارسال شد: ${txHash}`);
  } catch (err) {
    console.error(err);
    alert("❌ خطا در ارسال: " + err.message);
  }
});

// تابع ساخت دیتا برای متد transfer
function getTransferData(to, amount) {
  const methodId = "a9059cbb"; // transfer(address,uint256)
  const paddedTo = to.toLowerCase().replace("0x", "").padStart(64, "0");
  const paddedAmount = BigInt(amount).toString(16).padStart(64, "0");
  return "0x" + methodId + paddedTo + paddedAmount;

}
