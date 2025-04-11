import "dotenv/config";
import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import axios from "axios";

const RPC_URL = process.env.RPC_URL || "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const WMON_ADDRESS = process.env.WMON_ADDRESS || "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || WMON_ADDRESS;
const RUBIC_API_URL = process.env.RUBIC_API_URL || "https://testnet-api.rubic.exchange/api/v2/trades/onchain/new_extended";
const RUBIC_COOKIE = process.env.RUBIC_COOKIE || "";
const RUBIC_REWARD_URL = "https://testnet-api.rubic.exchange/api/v2/rewards/tmp_onchain_reward_amount_for_user?address=";
const HEDGEMONY_BEARER = process.env.HEDGEMONY_BEARER;
const USDC_ADDRESS = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea";
const WETH_ADDRESS = "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37";
const TAYA_SWAP_CONTRACT = "0x4ba4bE2FB69E2aa059A551Ce5d609Ef5818Dd72F";
const TOKENS = [USDC_ADDRESS, WETH_ADDRESS];
const HEDGEMONY_SWAP_CONTRACT = "0xfB06ac672944099E33Ad7F27f0Aa9B1bc43e65F8";
const HEDGE_ADDRESS = process.env.HEDGE_ADDRESS || "0x04a9d9D4AEa93F512A4c7b71993915004325ed38";
const MONDA_ROUTER_ADDRESS = "0xc80585f78A6e44fb46e1445006f820448840386e";
const USDT_ADDRESS_MONDA = "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D";
const TOKEN_MLDK = "0xe9f4c0093B4e94800487cad93FBBF7C3729ccf5c";
const TOKEN_MYK  = "0x59897686b2Dd2059b09642797EBeA3d21E6cE2d1";
const TOKEN_PEPE = "0xab1fA5cc0a7dB885BC691b60eBeEbDF59354434b";
const BUBBLEFI_ROUTER_ADDRESS = "0x6c4f91880654a4F4414f50e002f361048433051B";
const BUBBLEFI_COOKIE = process.env.BUBBLEFI_COOKIE || "";
const MON_TO_HEDGE_CONVERSION_FACTOR = ethers.parseUnits("15.40493695", 18);
const HEDGE_TO_MON_CONVERSION_FACTOR = ethers.parseUnits("0.06493", 18);
const WEI_PER_ETHER = ethers.parseUnits("1", 18);
const MAX_RPC_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const bubbleFiTokens = [
  { address: TOKEN_PEPE, name: "PEPE" },
  { address: TOKEN_MLDK, name: "MLDK" },
  { address: TOKEN_MYK,  name: "MYK" }
];

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const ROUTER_ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];
const ERC20_ABI_APPROVE = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
const TAYA_SWAP_ABI = [
  "function WETH() view returns (address)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) nonpayable"
];
const MONDA_ROUTER_ABI = [
  {"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"}
];

const BUBBLEFI_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "_amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "_path", "type": "address[]" },
      { "internalType": "address", "name": "_receiver", "type": "address" },
      { "internalType": "uint256", "name": "_deadline", "type": "uint256" },
      {
        "components": [
          { "internalType": "bool", "name": "enter", "type": "bool" },
          {
            "components": [
              { "internalType": "uint256", "name": "numerator", "type": "uint256" },
              { "internalType": "uint256", "name": "denominator", "type": "uint256" }
            ],
            "internalType": "struct MonadexV1Types.Fraction",
            "name": "fractionOfSwapAmount",
            "type": "tuple"
          },
          { "internalType": "address", "name": "raffleNftReceiver", "type": "address" }
        ],
        "internalType": "struct MonadexV1Types.Raffle",
        "name": "_raffle",
        "type": "tuple"
      }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "_path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let walletInfo = {
  address: "",
  balanceMON: "0.00",
  balanceWMON: "0.00",
  balanceHEDGE: "0.00",
  balanceWETH: "0.00",
  balanceUSDC: "0.00",
  balanceUSDT: "0.00",
  network: "Mạng thử nghiệm Monad",
  status: "Đang khởi tạo"
};
let transactionLogs = [];
let autoSwapRunning = false;
let autoSwapCancelled = false;
let tayaSwapRunning = false;
let tayaSwapCancelled = false;
let hedgemonySwapRunning = false;
let hedgemonySwapCancelled = false;
let mondaSwapRunning = false;
let mondaSwapCancelled = false;
let bubbleFiSwapRunning = false;
let bubbleFiSwapCancelled = false;
let globalWallet = null;
let transactionQueue = Promise.resolve();
let transactionQueueList = [];
let transactionIdCounter = 0;
let nextNonce = null;

process.on("unhandledRejection", (reason, promise) => {
  addLog(`Lỗi chưa được xử lý: ${reason}`, "hệ thống");
});

process.on("uncaughtException", (error) => {
  addLog(`Lỗi chưa được bắt: ${error.message}`, "hệ thống");
});

function getShortAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}
function getShortHash(hash) {
  return hash.slice(0, 6) + "..." + hash.slice(-4);
}
function getTokenSymbol(address) {
  if (address.toLowerCase() === WMON_ADDRESS.toLowerCase()) return "WMON";
  if (address.toLowerCase() === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (address.toLowerCase() === WETH_ADDRESS.toLowerCase()) return "WETH";
  return address;
}

// Thiết lập độ trễ giữa các giao dịch
function getRandomDelay() {
  return Math.random() * (60000 - 30000) + 30000;
}

// Số lượng ngẫu nhiên cho Rubic 
function getRandomAmount() {
  const min = 0.005, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}

// Số lượng ngẫu nhiên cho Taya 
function getRandomAmountTaya() {
  const min = 0.005, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}

// Số lượng ngẫu nhiên cho Hedgemony Mon - Wmon
function getRandomAmountHedgemony() {
  const min = 0.003, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}

// Số lượng ngẫu nhiên $MON (Hedgemony)
function getRandomAmountMonToHedge() {
  const min = 0.01, max = 0.05;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Số lượng ngẫu nhiên $HEDGE (Hedgemony)
function getRandomAmountHedgeToMon() {
  const min = 400, max = 1000;
  const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
  return ethers.parseUnits(randomInt.toString(), 18);
}

// Số lượng ngẫu nhiên Monda cho Dak -> Mon
function getRandomAmountDakForSwap() {
  const min = 0.3, max = 4;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Số lượng ngẫu nhiên Monda cho Mon -> Dak
function getRandomAmountMonForSwap() {
  const min = 0.1, max = 1;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Số lượng ngẫu nhiên Monda cho Mon -> USDC/USDT 
function getRandomAmountMonForUsdcUsdt() {
  const min = 1, max = 4;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6)); 
}

// Số lượng ngẫu nhiên Monda cho USDC -> Mon
function getRandomAmountUsdcForSwap() {
  const min = 10, max = 43;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 6);
}

// Số lượng ngẫu nhiên Monda cho USDT -> Mon
function getRandomAmountUsdtForSwap() {
  const min = 11, max = 43;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 6); 
}

// Số lượng ngẫu nhiên BubbleFi PEPE - MLDK - MYK
function getRandomAmountBubbleFi() {
  const min = 5;
  const max = 15;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}
  
function addLog(message, type) {
  const timestamp = new Date().toLocaleTimeString();
  let coloredMessage = message;
  if (type === "rubic") {
    coloredMessage = `{bright-cyan-fg}${message}{/bright-cyan-fg}`;
  } else if (type === "taya") {
    coloredMessage = `{bright-yellow-fg}${message}{/bright-yellow-fg}`;
  } else if (type === "hedgemony") {
    coloredMessage = `{bright-magenta-fg}${message}{/bright-magenta-fg}`;
  } else if (type === "monda") {
    coloredMessage = `{bright-blue-fg}${message}{/bright-blue-fg}`;
  } else if (type === "bubblefi") {
    coloredMessage = `{bright-green-fg}${message}{/bright-green-fg}`;
  }
  transactionLogs.push(`[ {bold}{grey-fg}${timestamp}{/grey-fg}{/bold} ] ${coloredMessage}`);
  updateLogs();
}

function updateLogs() {
  logsBox.setContent(transactionLogs.join("\n"));
  logsBox.setScrollPerc(100);
  safeRender();
}
function clearTransactionLogs() {
  transactionLogs = [];
  updateLogs();
  addLog("Nhật ký giao dịch đã được xóa.", "hệ thống");
}

const screen = blessed.screen({
  smartCSR: true,
  title: "NT Exhaust",
  fullUnicode: true,
  mouse: true
});
let renderTimeout;
function safeRender() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => { screen.render(); }, 50);
}
const headerBox = blessed.box({
  top: 0,
  left: "center",
  width: "100%",
  tags: true,
  style: { fg: "white", bg: "default" }
});
figlet.text("NT Exhaust".toUpperCase(), { font: "Speed", horizontalLayout: "default" }, (err, data) => {
  if (err) headerBox.setContent("{center}{bold}TỰ ĐỘNG HOÁN ĐỔI MONAD{/bold}{/center}");
  else headerBox.setContent(`{center}{bold}{bright-cyan-fg}${data}{/bright-cyan-fg}{/bold}{/center}`);
  safeRender();
});
const descriptionBox = blessed.box({
  left: "center",
  width: "100%",
  content: "{center}{bold}{bright-cyan-fg}➕➕➕➕ TỰ ĐỘNG HOÁN ĐỔI MONAD ➕➕➕➕{/bright-cyan-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "white", bg: "default" }
});
const logsBox = blessed.box({
  label: " Nhật ký giao dịch ",
  left: 0,
  border: { type: "line" },
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  keys: true,
  vi: true,
  tags: true,
  scrollbar: { ch: " ", inverse: true, style: { bg: "blue" } },
  content: "",
  style: { border: { fg: "bright-red" }, bg: "default" }
});
const walletBox = blessed.box({
  label: " Thông tin ví ",
  left: "60%",
  tags: true,
  border: { type: "line" },
  style: { border: { fg: "magenta" }, fg: "white", bg: "default", align: "left", valign: "top" },
  content: ""
});

function updateWallet() {
  const shortAddress = walletInfo.address
    ? walletInfo.address.slice(0, 6) + "..." + walletInfo.address.slice(-4)
    : "Không có";

  const formatBalance = (balance) => {
    return Number(balance).toFixed(2);
  };

  const mon   = walletInfo.balanceMON ? formatBalance(walletInfo.balanceMON) : "0.00";
  const wmon  = walletInfo.balanceWMON ? formatBalance(walletInfo.balanceWMON) : "0.00";
  const hedge = walletInfo.balanceHEDGE ? formatBalance(walletInfo.balanceHEDGE) : "0.00";
  const weth  = walletInfo.balanceWETH ? formatBalance(walletInfo.balanceWETH) : "0.00";
  const usdc  = walletInfo.balanceUSDC ? formatBalance(walletInfo.balanceUSDC) : "0.00";
  const usdt  = walletInfo.balanceUSDT ? formatBalance(walletInfo.balanceUSDT) : "0.00";
  const network = walletInfo.network || "Không xác định";

  const content = `Địa chỉ : {bold}{bright-cyan-fg}${shortAddress}{/bright-cyan-fg}{/bold}
└── Mạng : {bold}{bright-yellow-fg}${network}{/bright-yellow-fg}{/bold}
    ├── MON   : {bold}{bright-green-fg}${mon}{/bright-green-fg}{/bold}
    ├── WMON  : {bold}{bright-green-fg}${wmon}{/bright-green-fg}{/bold}
    ├── HEDGE : {bold}{bright-green-fg}${hedge}{/bright-green-fg}{/bold}
    ├── WETH  : {bold}{bright-green-fg}${weth}{/bright-green-fg}{/bold}
    ├── USDC  : {bold}{bright-green-fg}${usdc}{/bright-green-fg}{/bold}
    └── USDT  : {bold}{bright-green-fg}${usdt}{/bright-green-fg}{/bold}
`;

  walletBox.setContent(content);
  safeRender();
}

function stopAllTransactions() {
  if (autoSwapRunning || tayaSwapRunning || hedgemonySwapRunning || mondaSwapRunning || bubbleFiSwapRunning) {
    autoSwapCancelled = true;
    tayaSwapCancelled = true;
    hedgemonySwapCancelled = true;
    mondaSwapCancelled = true;
    bubbleFiSwapCancelled = true;
    addLog("Lệnh dừng tất cả giao dịch đã được nhận. Tất cả giao dịch đã bị hủy.", "hệ thống");
  }
}

function getRubicMenuItems() {
  return autoSwapRunning
    ? ["Tự động hoán đổi Mon & WMON", "Dừng giao dịch", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"]
    : ["Tự động hoán đổi Mon & WMON", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"];
}
function getTayaMenuItems() {
  return tayaSwapRunning
    ? ["Tự động hoán đổi Token ngẫu nhiên", "Tự động hoán đổi MON & WMON", "Dừng giao dịch", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"]
    : ["Tự động hoán đổi Token ngẫu nhiên", "Tự động hoán đổi MON & WMON", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"];
}
function getHedgemonyMenuItems() {
  return hedgemonySwapRunning
    ? ["Tự động hoán đổi Mon & WMON", "Tự động hoán đổi Mon & HEDGE", "Dừng giao dịch", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"]
    : ["Tự động hoán đổi Mon & WMON", "Tự động hoán đổi Mon & HEDGE", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"];
}
function getMondaMenuItems() {
  return mondaSwapRunning
    ? ["Tự động hoán đổi Mon & Dak", "Tự động hoán đổi Mon & USDC/USDT", "{grey-fg}Tự động hoán đổi Mon & Monda [SẮP RA MẮT]{/grey-fg}", "Dừng giao dịch", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"]
    : ["Tự động hoán đổi Mon & Dak", "Tự động hoán đổi Mon & USDC/USDT", "{grey-fg}Tự động hoán đổi Mon & Monda [SẮP RA MẮT]{/grey-fg}", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"];
}
function getBubbleFiMenuItems() {
  return bubbleFiSwapRunning
    ? ["Tự động hoán đổi Pepe & Mldk & Myk", "Dừng giao dịch", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"]
    : ["Tự động hoán đổi Pepe & Mldk & Myk", "Xóa nhật ký giao dịch", "Quay lại menu chính", "Thoát"];
}

function getMainMenuItems() {
  let items = ["Hoán đổi Rubic", "Hoán đổi Taya", "Hoán đổi Hedgemony", "Hoán đổi Monda", "Hoán đổi BubbleFi", "Hàng đợi giao dịch", "Xóa nhật ký giao dịch", "Làm mới", "Thoát"];
  if (autoSwapRunning || tayaSwapRunning || hedgemonySwapRunning || mondaSwapRunning || bubbleFiSwapRunning) {
    items.unshift("Dừng tất cả giao dịch");
  }
  return items;
}

const mainMenu = blessed.list({
  label: " Menu ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "yellow" }, selected: { bg: "green", fg: "black" } },
  items: getMainMenuItems()
});
const rubicSubMenu = blessed.list({
  label: " Menu hoán đổi Rubic ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "yellow" }, selected: { bg: "cyan", fg: "black" } },
  items: getRubicMenuItems()
});
rubicSubMenu.hide();
const tayaSubMenu = blessed.list({
  label: " Menu hoán đổi Taya ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "yellow" }, selected: { bg: "yellow", fg: "black" } },
  items: getTayaMenuItems()
});
tayaSubMenu.hide();
const hedgemonySubMenu = blessed.list({
  label: " Menu hoán đổi Hedgemony ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "yellow" }, selected: { bg: "magenta", fg: "black" } },
  items: getHedgemonyMenuItems()
});
hedgemonySubMenu.hide();
const mondaSubMenu = blessed.list({
  label: " Menu hoán đổi Monda ",
  left: "60%",
  keys: true,
  tags: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: {
    fg: "white",
    bg: "default",
    border: { fg: "yellow" },
    selected: { bg: "blue", fg: "black" }
  },
  items: getMondaMenuItems()
});
mondaSubMenu.hide();
const bubbleFiSubMenu = blessed.list({
  label: " Menu hoán đổi BubbleFi ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: {
    fg: "white",
    bg: "default",
    border: { fg: "yellow" },
    selected: { bg: "magenta", fg: "black" }
  },
  items: getBubbleFiMenuItems(),
  tags: true
});
bubbleFiSubMenu.hide();
const promptBox = blessed.prompt({
  parent: screen,
  border: "line",
  height: 5,
  width: "60%",
  top: "center",
  left: "center",
  label: "{bright-blue-fg}Thông báo hoán đổi{/bright-blue-fg}",
  tags: true,
  keys: true,
  vi: true,
  mouse: true,
  style: { fg: "bright-white", bg: "black", border: { fg: "red" } }
});

screen.append(headerBox);
screen.append(descriptionBox);
screen.append(logsBox);
screen.append(walletBox);
screen.append(mainMenu);
screen.append(rubicSubMenu);
screen.append(tayaSubMenu);
screen.append(hedgemonySubMenu);
screen.append(mondaSubMenu);
screen.append(bubbleFiSubMenu);

function adjustLayout() {
  const screenHeight = screen.height;
  const screenWidth = screen.width;
  const headerHeight = Math.max(8, Math.floor(screenHeight * 0.15));
  headerBox.top = 0;
  headerBox.height = headerHeight;
  headerBox.width = "100%";
  descriptionBox.top = "25%";
  descriptionBox.height = Math.floor(screenHeight * 0.05);
  logsBox.top = headerHeight + descriptionBox.height;
  logsBox.left = 0;
  logsBox.width = Math.floor(screenWidth * 0.6);
  logsBox.height = screenHeight - (headerHeight + descriptionBox.height);
  walletBox.top = headerHeight + descriptionBox.height;
  walletBox.left = Math.floor(screenWidth * 0.6);
  walletBox.width = Math.floor(screenWidth * 0.4);
  walletBox.height = Math.floor(screenHeight * 0.35);
  mainMenu.top = headerHeight + descriptionBox.height + walletBox.height;
  mainMenu.left = Math.floor(screenWidth * 0.6);
  mainMenu.width = Math.floor(screenWidth * 0.4);
  mainMenu.height = screenHeight - (headerHeight + descriptionBox.height + walletBox.height);
  rubicSubMenu.top = mainMenu.top;
  rubicSubMenu.left = mainMenu.left;
  rubicSubMenu.width = mainMenu.width;
  rubicSubMenu.height = mainMenu.height;
  tayaSubMenu.top = mainMenu.top;
  tayaSubMenu.left = mainMenu.left;
  tayaSubMenu.width = mainMenu.width;
  tayaSubMenu.height = mainMenu.height;
  hedgemonySubMenu.top = mainMenu.top;
  hedgemonySubMenu.left = mainMenu.left;
  hedgemonySubMenu.width = mainMenu.width;
  hedgemonySubMenu.height = mainMenu.height;
  mondaSubMenu.top = mainMenu.top;
  mondaSubMenu.left = mainMenu.left;
  mondaSubMenu.width = mainMenu.width;
  mondaSubMenu.height = mainMenu.height;
  bubbleFiSubMenu.top = mainMenu.top;
  bubbleFiSubMenu.left = mainMenu.left;
  bubbleFiSubMenu.width = mainMenu.width;
  bubbleFiSubMenu.height = mainMenu.height;

  safeRender();
}
screen.on("resize", adjustLayout);
adjustLayout();
screen.key(["escape", "q", "C-c"], () => process.exit(0));
screen.key(["C-up"], () => { logsBox.scroll(-1); safeRender(); });
screen.key(["C-down"], () => { logsBox.scroll(1); safeRender(); });
safeRender();
mainMenu.focus();
updateLogs();
updateWalletData();

function addTransactionToQueue(transactionFunction, description = "Giao dịch") {
  const transactionId = ++transactionIdCounter;
  transactionQueueList.push({
    id: transactionId,
    description,
    timestamp: new Date().toLocaleTimeString(),
    status: "đang chờ"
  });
  addLog(`Giao dịch [${transactionId}] đã được thêm vào hàng đợi: ${description}`, "hệ thống");
  updateQueueDisplay();

  transactionQueue = transactionQueue.then(async () => {
    updateTransactionStatus(transactionId, "đang xử lý");
    addLog(`Giao dịch [${transactionId}] bắt đầu được xử lý.`, "hệ thống");
    try {
      if (nextNonce === null) {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
        addLog(`Nonce ban đầu: ${nextNonce}`, "hệ thống");
      }
      const result = await transactionFunction(nextNonce);
      nextNonce++;
      updateTransactionStatus(transactionId, "hoàn thành");
      addLog(`Giao dịch [${transactionId}] hoàn thành.`, "hệ thống");
      return result;
    } catch (error) {
      updateTransactionStatus(transactionId, "lỗi");
      addLog(`Giao dịch [${transactionId}] thất bại: ${error.message}`, "hệ thống");
      if (error.message && error.message.toLowerCase().includes("nonce has already been used")) {
        nextNonce++;
        addLog(`Nonce đã tăng vì đã được sử dụng. Giá trị nonce mới: ${nextNonce}`, "hệ thống");
      } else if (error.message && error.message.toLowerCase().includes("rpc")) {
        let retries = 0;
        while (retries < MAX_RPC_RETRIES) {
          try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
            addLog(`RPC bình thường, nonce được làm mới: ${nextNonce}`, "hệ thống");
            break;
          } catch (rpcError) {
            retries++;
            addLog(`Lỗi RPC, thử lại lần ${retries}: ${rpcError.message}`, "hệ thống");
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          }
        }
        if (retries === MAX_RPC_RETRIES) {
          addLog(`RPC vẫn lỗi sau ${MAX_RPC_RETRIES} lần thử. Bỏ qua giao dịch.`, "hệ thống");
        }
      } else {
        try {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
          addLog(`Nonce được làm mới: ${nextNonce}`, "hệ thống");
        } catch (rpcError) {
          addLog(`Không thể làm mới nonce: ${rpcError.message}`, "hệ thống");
        }
      }
      return;
    } finally {
      removeTransactionFromQueue(transactionId);
      updateQueueDisplay();
    }
  });
  return transactionQueue;
}

function updateTransactionStatus(id, status) {
  transactionQueueList.forEach(tx => {
    if (tx.id === id) tx.status = status;
  });
  updateQueueDisplay();
}
function removeTransactionFromQueue(id) {
  transactionQueueList = transactionQueueList.filter(tx => tx.id !== id);
  updateQueueDisplay();
}
function getTransactionQueueContent() {
  if (transactionQueueList.length === 0) return "Không có giao dịch nào trong hàng đợi.";
  return transactionQueueList.map(tx => `ID: ${tx.id} | ${tx.description} | ${tx.status} | ${tx.timestamp}`).join("\n");
}
let queueMenuBox = null;
let queueUpdateInterval = null;
function showTransactionQueueMenu() {
  const container = blessed.box({
    label: " Hàng đợi giao dịch ",
    top: "10%",
    left: "center",
    width: "80%",
    height: "80%",
    border: { type: "line" },
    style: { border: { fg: "blue" } },
    keys: true,
    mouse: true,
    interactive: true
  });
  const contentBox = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "90%",
    content: getTransactionQueueContent(),
    scrollable: true,
    keys: true,
    mouse: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", inverse: true, style: { bg: "blue" } }
  });
  const exitButton = blessed.button({
    content: " [Thoát] ",
    bottom: 0,
    left: "center",
    shrink: true,
    padding: { left: 1, right: 1 },
    style: { fg: "white", bg: "red", hover: { bg: "blue" } },
    mouse: true,
    keys: true,
    interactive: true
  });
  exitButton.on("press", () => {
    addLog("Thoát khỏi menu hàng đợi giao dịch.", "hệ thống");
    clearInterval(queueUpdateInterval);
    container.destroy();
    queueMenuBox = null;
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  });
  container.key(["a", "s", "d"], () => {
    addLog("Thoát khỏi menu hàng đợi giao dịch.", "hệ thống");
    clearInterval(queueUpdateInterval);
    container.destroy();
    queueMenuBox = null;
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  });
  container.append(contentBox);
  container.append(exitButton);
  queueUpdateInterval = setInterval(() => {
    contentBox.setContent(getTransactionQueueContent());
    screen.render();
  }, 1000);
  mainMenu.hide();
  screen.append(container);
  container.focus();
  screen.render();
}
function updateQueueDisplay() {
  if (queueMenuBox) {
    queueMenuBox.setContent(getTransactionQueueContent());
    screen.render();
  }
}

async function updateWalletData() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    globalWallet = wallet;
    walletInfo.address = wallet.address;

    const [
      balanceMON,
      balanceWMON,
      balanceHEDGE,
      balanceWETH,
      balanceUSDC,
      balanceUSDT
    ] = await Promise.all([
      provider.getBalance(wallet.address),
      new ethers.Contract(WMON_ADDRESS, ERC20_ABI, provider).balanceOf(wallet.address),
      new ethers.Contract(HEDGE_ADDRESS, ERC20_ABI, provider).balanceOf(wallet.address),
      new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider).balanceOf(wallet.address),
      new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider).balanceOf(wallet.address),
      new ethers.Contract(USDT_ADDRESS_MONDA, ERC20_ABI, provider).balanceOf(wallet.address)
    ]);

    walletInfo.balanceMON   = ethers.formatEther(balanceMON);
    walletInfo.balanceWMON  = ethers.formatEther(balanceWMON);
    walletInfo.balanceHEDGE = ethers.formatEther(balanceHEDGE);
    walletInfo.balanceWETH  = ethers.formatEther(balanceWETH);
    walletInfo.balanceUSDC  = ethers.formatUnits(balanceUSDC, 6);
    walletInfo.balanceUSDT  = ethers.formatUnits(balanceUSDT, 6);

    updateWallet();
    addLog("Số dư & ví đã được cập nhật!!", "hệ thống");
  } catch (error) {
    addLog("Không thể lấy dữ liệu ví: " + error.message, "hệ thống");
  }
}

async function waitWithCancel(delay, type) {
  return Promise.race([
    new Promise(resolve => setTimeout(resolve, delay)),
    new Promise(resolve => {
      const interval = setInterval(() => {
        if (type === "rubic" && autoSwapCancelled) { clearInterval(interval); resolve(); }
        if (type === "taya" && tayaSwapCancelled) { clearInterval(interval); resolve(); }
        if (type === "hedgemony" && hedgemonySwapCancelled) { clearInterval(interval); resolve(); }
        if (type === "monda" && mondaSwapCancelled) { clearInterval(interval); resolve(); }
        if (type === "bubblefi" && bubbleFiSwapCancelled) { clearInterval(interval); resolve(); }
      }, 100);
    })
  ]);
}

async function endInitialRubicRequest(txHash, walletAddress, amount, swapToWMON) {
  try {
    const amountStr = amount.toString();
    const payload = {
      price_impact: null,
      walletName: "metamask",
      deviceType: "desktop",
      slippage: 0,
      expected_amount: amountStr,
      mevbot_protection: false,
      to_amount_min: amountStr,
      network: "monad-testnet",
      provider: "wrapped",
      from_token: swapToWMON ? "0x0000000000000000000000000000000000000000" : ROUTER_ADDRESS,
      to_token: swapToWMON ? ROUTER_ADDRESS : "0x0000000000000000000000000000000000000000",
      from_amount: amountStr,
      to_amount: amountStr,
      user: walletAddress,
      hash: txHash,
    };

    const response = await axios.post(`${RUBIC_API_URL}?valid=false`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: "https://testnet.rubic.exchange",
        Referer: "https://testnet.rubic.exchange/",
        Cookie: RUBIC_COOKIE,
      },
    });

    addLog(`Rubic: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(txHash)}`, "rubic");
  } catch (error) {
    addLog(`Rubic: Lỗi trong yêu cầu API Rubic ban đầu: ${error.message}`, "rubic");
  }
}

async function executeSwap(index, total, wallet, swapToWMON, skipDelay = false) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = getRandomAmount();
  addLog(`Rubic: Bắt đầu hoán đổi ${swapToWMON ? "MON ➯ WMON" : "WMON ➯ MON"} với số lượng ${ethers.formatEther(amount)}`, "rubic");
  try {
    const tx = swapToWMON
      ? await router.deposit({ value: amount })
      : await router.withdraw(amount);
    const txHash = tx.hash;
    addLog(`Rubic: Giao dịch đã được gửi....`, "rubic");
    await tx.wait();
    addLog(`Rubic: Giao dịch được xác nhận!!!!`, "rubic");
    await sendRubicRequest(tx.hash, wallet.address, swapToWMON);
    await checkRubicRewards(wallet.address);
    addLog(`Rubic: Giao dịch ${index}/${total} hoàn tất.`, "rubic");
    await updateWalletData();
  } catch (error) {
    addLog(`Rubic: Lỗi trong giao dịch ${index}: ${error.message}`, "rubic");
  }
}
async function checkRubicRewards(walletAddress) {
  try {
    const response = await axios.get(`${RUBIC_REWARD_URL}${walletAddress}`, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://testnet.rubic.exchange",
        "Referer": "https://testnet.rubic.exchange/",
        "Cookie": RUBIC_COOKIE,
      },
    });
    addLog(`Rubic: phần thưởng ${JSON.stringify(response.data)}`, "rubic");
  } catch (error) {
    addLog(`Rubic: Lỗi ${error.message}`, "rubic");
  }
}
async function sendRubicRequest(txHash, walletAddress, swapToWMON) {
  try {
    const payload = {
      success: true,
      hash: txHash,
      user: walletAddress,
      swapType: swapToWMON ? "MON_to_WMON" : "WMON_to_MON",
    };
    const response = await axios.patch(RUBIC_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "Origin": "https://testnet.rubic.exchange",
        Referer: "https://testnet.rubic.exchange/",
        Cookie: RUBIC_COOKIE,
      },
    });
    addLog(`Rubic: Hoán đổi ${swapToWMON ? "MON sang WMON" : "WMON sang MON"} hoàn tất!! Mã giao dịch: ${getShortHash(txHash)}`, "rubic");
    addLog(`Rubic: Phản hồi API ${JSON.stringify(response.data)}`, "rubic");
  } catch (error) {
    addLog(`Rubic: Lỗi thông báo API Rubic: ${error.message}`, "rubic");
  }
}
async function runAutoSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Rubic:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Rubic: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "rubic");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Rubic: Dữ liệu nhập không hợp lệ. Phải là số.", "rubic");
      return;
    }
    addLog(`Rubic: Bạn đã nhập ${loopCount} lần tự động hoán đổi Rubic.`, "rubic");
    if (autoSwapRunning) {
      addLog("Rubic: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "rubic");
      return;
    }
    autoSwapRunning = true;
    autoSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    rubicSubMenu.setItems(getRubicMenuItems());
    rubicSubMenu.show();
    screen.render();
    let swapToWMON = true;
    for (let i = 1; i <= loopCount; i++) {
      if (autoSwapCancelled) {
        addLog(`Rubic: Tự động hoán đổi bị dừng tại vòng lặp ${i}.`, "rubic");
        break;
      }
      await addTransactionToQueue(async (nonce) => {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
        const amount = getRandomAmount();
        addLog(`Rubic: Bắt đầu hoán đổi ${swapToWMON ? "MON ➯ WMON" : "WMON ➯ MON"} với số lượng ${ethers.formatEther(amount)}`, "rubic");
        const tx = swapToWMON
          ? await router.deposit({ value: amount, nonce: nonce })
          : await router.withdraw(amount, { nonce: nonce });
        addLog(`Rubic: Giao dịch đã được gửi....`, "rubic");
        await tx.wait();
        addLog(`Rubic: Giao dịch được xác nhận!!!`, "rubic");
        await endInitialRubicRequest(tx.hash, globalWallet.address, amount, swapToWMON);
        await sendRubicRequest(tx.hash, globalWallet.address, swapToWMON);
        await checkRubicRewards(globalWallet.address);
        await updateWalletData();
      }, `Hoán đổi Rubic (${swapToWMON ? "MON->WMON" : "WMON->MON"}) - Vòng lặp ${i}`);
      swapToWMON = !swapToWMON;
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Rubic: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "rubic");
        await waitWithCancel(delay, "rubic");
        if (autoSwapCancelled) {
          addLog("Rubic: Tự động hoán đổi bị dừng trong thời gian chờ.", "rubic");
          break;
        }
      }
    }
    autoSwapRunning = false;
    rubicSubMenu.setItems(getRubicMenuItems());
    mainMenu.setItems(getMainMenuItems());
    screen.render();
    addLog("Rubic: Tự động hoán đổi hoàn tất.", "rubic");
  });
}
function stopAutoSwap() {
  if (autoSwapRunning) {
    autoSwapCancelled = true;
  } else {
    addLog("Rubic: Không có giao dịch nào đang chạy.", "rubic");
  }
}

async function executeTayaSwapRouteWithAmount(index, total, wallet, path, inputIsETH = true, amountInOverride, nonce = null) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const swapContract = new ethers.Contract(TAYA_SWAP_CONTRACT, TAYA_SWAP_ABI, wallet);
  const expectedWETH = await swapContract.WETH();
  if (inputIsETH && path[0].toLowerCase() !== expectedWETH.toLowerCase()) {
    addLog(`Taya: Lỗi - Đường dẫn phải bắt đầu bằng địa chỉ WETH: ${expectedWETH}`, "taya");
    return;
  }
  const amountIn = amountInOverride;
  addLog(`Taya: Hoán đổi MON ➯ ${getTokenSymbol(path[1])}`, "taya");
  addLog(`Taya: Bắt đầu hoán đổi với số lượng: ${ethers.formatEther(amountIn)}`, "taya");
  try {
    const amountOutMin = 0;
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const txOptions = { value: amountIn };
    if (nonce !== null) txOptions.nonce = nonce;
    let tx;
    if (inputIsETH) {
      tx = await swapContract.swapExactETHForTokens(
        amountOutMin,
        path,
        wallet.address,
        deadline,
        txOptions
      );
    } else {
      tx = await swapContract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        wallet.address,
        deadline,
        txOptions
      );
    }
    const txHash = tx.hash;
    addLog(`Taya: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await updateWalletData();
    addLog(`Taya: Giao dịch ${index}/${total} hoàn tất.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch ${index}: ${error.message}`, "taya");
  }
}

async function executeWrapMonToWMON(index, total, wallet, amountInOverride) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = amountInOverride;
  addLog(`Taya: Thực hiện hoán đổi MON ➯ WMON với số lượng: ${ethers.formatEther(amount)}`, "taya");
  try {
    const tx = await router.deposit({ value: amount });
    const txHash = tx.hash;
    addLog(`Taya: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await updateWalletData();
    addLog(`Taya: Giao dịch ${index}/${total} hoàn tất.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch wrap ${index}: ${error.message}`, "taya");
  }
}
async function executeUnwrapWMONToMON(index, total, wallet, amountInOverride) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = amountInOverride;
  addLog(`Taya: Thực hiện hoán đổi WMON ➯ MON với số lượng: ${ethers.formatEther(amount)}`, "taya");
  try {
    const tx = await router.withdraw(amount);
    const txHash = tx.hash;
    addLog(`Taya: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(txHash)}`, "taya");
    await updateWalletData();
    addLog(`Taya: Giao dịch ${index}/${total} hoàn tất.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch unwrap ${index}: ${error.message}`, "taya");
  }
}

async function runTayaAutoSwapRandom() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Taya (Token ngẫu nhiên):", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Taya: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "taya");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Taya: Dữ liệu nhập không hợp lệ. Phải là số.", "taya");
      return;
    }
    addLog(`Taya: Bạn đã nhập ${loopCount} lần tự động hoán đổi Taya (Token ngẫu nhiên).`, "taya");
    if (tayaSwapRunning) {
      addLog("Taya: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "taya");
      return;
    }
    tayaSwapRunning = true;
    tayaSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    tayaSubMenu.setItems(getTayaMenuItems());
    tayaSubMenu.show();
    screen.render();
    for (let i = 1; i <= loopCount; i++) {
      if (tayaSwapCancelled) {
        addLog(`Taya: Tự động hoán đổi (Token ngẫu nhiên) bị dừng tại vòng lặp ${i}.`, "taya");
        break;
      }
      const randomToken = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      addLog(`Taya: Thực hiện hoán đổi MON ➯ ${getTokenSymbol(randomToken)}`, "taya");
      const path = [WMON_ADDRESS, randomToken];
      const amountIn = getRandomAmountTaya();
      addLog(`Taya: Sử dụng số lượng: ${ethers.formatEther(amountIn)}`, "taya");
      await addTransactionToQueue(async (nonce) => {
        await executeTayaSwapRouteWithAmount(i, loopCount, globalWallet, path, true, amountIn, nonce);
      }, `Hoán đổi ngẫu nhiên Taya - Vòng lặp ${i}`);
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Taya: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "taya");
        await waitWithCancel(delay, "taya");
        if (tayaSwapCancelled) {
          addLog("Taya: Tự động hoán đổi (Token ngẫu nhiên) bị dừng trong thời gian chờ.", "taya");
          break;
        }
      }
    }
    tayaSwapRunning = false;
    mainMenu.setItems(getMainMenuItems());
    tayaSubMenu.setItems(getTayaMenuItems());
    screen.render();
    addLog("Taya: Tự động hoán đổi (Token ngẫu nhiên) hoàn tất.", "taya");
  });
}

async function runTayaWrapCycle() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Taya (MON & WMON):", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Taya: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "taya");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Taya: Dữ liệu nhập không hợp lệ. Phải là số.", "taya");
      return;
    }
    addLog(`Taya: Bạn đã nhập ${loopCount} chu kỳ cho hoán đổi Taya (MON & WMON).`, "taya");
    if (tayaSwapRunning) {
      addLog("Taya: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "taya");
      return;
    }
    tayaSwapRunning = true;
    tayaSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    tayaSubMenu.setItems(getTayaMenuItems());
    tayaSubMenu.show();
    screen.render();
    for (let i = 1; i <= loopCount; i++) {
      if (tayaSwapCancelled) {
        addLog(`Taya: Chu kỳ hoán đổi bị dừng tại vòng lặp ${i}.`, "taya");
        break;
      }
      const amountIn = getRandomAmountTaya();
      const monBalance = ethers.parseEther(walletInfo.balanceMON);
      const wmonBalance = ethers.parseEther(walletInfo.balanceWMON);
      let operation = (i % 2 === 1) ? "wrap" : "unwrap";
      if (operation === "wrap") {
        if (monBalance < amountIn) {
          if (wmonBalance >= amountIn) {
            operation = "unwrap";
            addLog("Taya: Số dư MON không đủ, chuyển sang unwrap.", "taya");
          } else {
            addLog(`Taya: Chu kỳ ${i}: Số dư MON và WMON không đủ.`, "taya");
            continue;
          }
        }
      } else {
        if (wmonBalance < amountIn) {
          if (monBalance >= amountIn) {
            operation = "wrap";
            addLog("Taya: Số dư WMON không đủ, chuyển sang wrap.", "taya");
          } else {
            addLog(`Taya: Chu kỳ ${i}: Số dư WMON và MON không đủ.`, "taya");
            continue;
          }
        }
      }
      if (operation === "wrap") {
        await addTransactionToQueue(async (nonce) => {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
          const tx = await router.deposit({ value: amountIn, nonce: nonce });
          addLog(`Taya: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(tx.hash)}`, "taya");
          await tx.wait();
          addLog(`Taya: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(tx.hash)}`, "taya");
          await updateWalletData();
        }, `Taya Wrap (Chu kỳ ${i})`);
      } else {
        await addTransactionToQueue(async (nonce) => {
          const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
          const data = router.interface.encodeFunctionData("withdraw", [amountIn]);
          const tx = await globalWallet.sendTransaction({ nonce: nonce, to: ROUTER_ADDRESS, data: data });
          addLog(`Taya: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(tx.hash)}`, "taya");
          await tx.wait();
          addLog(`Taya: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(tx.hash)}`, "taya");
          await updateWalletData();
        }, `Taya Unwrap (Chu kỳ ${i})`);
      }
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Taya: Đang chờ ${minutes} phút ${seconds} giây trước chu kỳ tiếp theo...`, "taya");
        await waitWithCancel(delay, "taya");
        if (tayaSwapCancelled) {
          addLog("Taya: Chu kỳ hoán đổi bị dừng trong thời gian chờ.", "taya");
          break;
        }
      }
    }
    tayaSwapRunning = false;
    mainMenu.setItems(getMainMenuItems());
    tayaSubMenu.setItems(getTayaMenuItems());
    screen.render();
    addLog("Taya: Hoán đổi (MON & WMON) hoàn tất.", "taya");
  });
}
function runTayaSwap() {
  tayaSubMenu.show();
  tayaSubMenu.focus();
  screen.render();
}

async function sendTradeHistoryWithRetry(txHash, wallet, amountIn, swapToWMON = true, retries = 3, delayMs = 2000) {
  const tradePayload = swapToWMON
    ? {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA",
        sellTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountIn }],
        buyTokens: [{ address: WMON_ADDRESS, amount: amountIn }]
      }
    : {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA",
        sellTokens: [{ address: WMON_ADDRESS, amount: amountIn }],
        buyTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountIn }]
      };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post("https://alpha-api.hedgemony.xyz/trade-history", tradePayload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HEDGEMONY_BEARER}`
        }
      });
      addLog(`Hedgemony: Lịch sử giao dịch đã được gửi thành công`, "hedgemony");
      return;
    } catch (error) {
      addLog(`Hedgemony: Không thể gửi lịch sử giao dịch (lần thử ${attempt}): ${error.message}`, "hedgemony");
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        addLog("Hedgemony: Tất cả các lần thử gửi lại lịch sử giao dịch đều thất bại.", "hedgemony");
      }
    }
  }
}

async function sendHedgeTradeHistoryWithRetry(txHash, wallet, amountValue, swapToHEDGE, retries = 3, delayMs = 2000) {
  const amountStr = typeof amountValue === "string" ? amountValue : amountValue.toString();
  let buyAmount;
  if (swapToHEDGE) {
    buyAmount = (BigInt(amountStr) * MON_TO_HEDGE_CONVERSION_FACTOR) / WEI_PER_ETHER;
  } else {
    buyAmount = (BigInt(amountStr) * HEDGE_TO_MON_CONVERSION_FACTOR) / WEI_PER_ETHER;
  }
  buyAmount = buyAmount.toString();

  const tradePayload = swapToHEDGE
    ? {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA",
        sellTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr }],
        buyTokens: [{ address: HEDGE_ADDRESS, amount: buyAmount }]
      }
    : {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA",
        sellTokens: [{ address: HEDGE_ADDRESS, amount: amountStr }],
        buyTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: buyAmount }]
      };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post("https://alpha-api.hedgemony.xyz/trade-history", tradePayload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HEDGEMONY_BEARER}`
        }
      });
      addLog(`Hoán đổi Hedge: Lịch sử giao dịch đã được gửi thành công`, "hedgemony");
      return;
    } catch (error) {
      addLog(`Hoán đổi Hedge: Không thể gửi lịch sử giao dịch (lần thử ${attempt}): ${error.message}`, "hedgemony");
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        addLog("Hoán đổi Hedge: Tất cả các lần thử gửi lại lịch sử giao dịch đều thất bại.", "hedgemony");
      }
    }
  }
}

async function runHedgeSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng chu kỳ hoán đổi Mon & HEDGE:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Hoán đổi Hedge: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "hedgemony");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("Hoán đổi Hedge: Dữ liệu nhập không hợp lệ. Phải là số dương.", "hedgemony");
      return;
    }
    if (hedgemonySwapRunning) {
      addLog("Hoán đổi Hedge: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "hedgemony");
      return;
    }
    hedgemonySwapRunning = true;
    hedgemonySwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    hedgemonySubMenu.setItems(getHedgemonyMenuItems());
    hedgemonySubMenu.show();
    hedgemonySubMenu.focus();
    screen.render();
    addLog(`Hoán đổi Hedge: Bắt đầu tự động hoán đổi với ${loopCount} chu kỳ.`, "hedgemony");

    for (let i = 1; i <= loopCount; i++) {
      if (hedgemonySwapCancelled) {
        addLog(`Hoán đổi Hedge: Tự động hoán đổi bị dừng tại chu kỳ thứ ${i}.`, "hedgemony");
        break;
      }
      let amountBN;
      const swapToHEDGE = (i % 2 === 1);
      if (swapToHEDGE) {
        amountBN = getRandomAmountMonToHedge();
        addLog(`Hoán đổi Hedge: Chu kỳ ${i}: Sẽ hoán đổi MON -> HEDGE với số lượng ${ethers.formatEther(amountBN)} MON`, "hedgemony");
      } else {
        amountBN = getRandomAmountHedgeToMon();
        addLog(`Hoán đổi Hedge: Chu kỳ ${i}: Sẽ hoán đổi HEDGE -> MON với số lượng ${ethers.formatUnits(amountBN, 18)} HEDGE`, "hedgemony");
        const hedgeContract = new ethers.Contract(HEDGE_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
        const hedgeBalance = await hedgeContract.balanceOf(globalWallet.address);
        if (hedgeBalance < amountBN) {
          addLog(`Hoán đổi Hedge: Số dư HEDGE không đủ. Bỏ qua chu kỳ ${i}.`, "hedgemony");
          continue;
        }
        const currentAllowance = await hedgeContract.allowance(globalWallet.address, HEDGEMONY_SWAP_CONTRACT);
        if (currentAllowance < amountBN) {
          addLog("Hoán đổi Hedge: Phê duyệt HEDGE không đủ, đang thực hiện phê duyệt...", "hedgemony");
          const approveTx = await hedgeContract.approve(HEDGEMONY_SWAP_CONTRACT, ethers.MaxUint256);
          addLog(`Hoán đổi Hedge: Giao dịch phê duyệt đã được gửi: ${getShortHash(approveTx.hash)}`, "hedgemony");
          await approveTx.wait();
          addLog("Hoán đổi Hedge: Phê duyệt thành công.", "hedgemony");
        }
      }

      const amountStr = amountBN.toString();
      let payload;
      if (swapToHEDGE) {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr }
          ],
          outputTokens: [
            { address: HEDGE_ADDRESS, percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      } else {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: HEDGE_ADDRESS, amount: amountStr }
          ],
          outputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      }

      try {
        const apiResponse = await axios.post("https://alpha-api.hedgemony.xyz/swap", payload, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HEDGEMONY_BEARER}`
          }
        });
        const multicallTx = apiResponse.data.multicallTx;
        if (!multicallTx || !multicallTx.to || !multicallTx.data) {
          addLog(`Hoán đổi Hedge: Dữ liệu giao dịch không đầy đủ.`, "hedgemony");
        } else {
          await addTransactionToQueue(async (nonce) => {
            const tx = await globalWallet.sendTransaction({
              nonce: nonce,
              to: multicallTx.to,
              value: multicallTx.value ? BigInt(multicallTx.value) : 0n,
              data: multicallTx.data,
            });
            addLog(`Hoán đổi Hedge: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
            await tx.wait();
            addLog(`Hoán đổi Hedge: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
            await updateWalletData();
            await sendHedgeTradeHistoryWithRetry(tx.hash, globalWallet, amountStr, swapToHEDGE);
          }, "Hoán đổi Hedge");
          addLog(`Hoán đổi Hedge: Chu kỳ ${i} hoàn tất.`, "hedgemony");
        }
      } catch (error) {
        if (error.response && error.response.data) {
          addLog(`Hoán đổi Hedge: Lỗi: ${JSON.stringify(error.response.data)}`, "hedgemony");
        } else {
          addLog(`Hoán đổi Hedge: Lỗi: ${error.message}`, "hedgemony");
        }
      }
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Hoán đổi Hedge: Đang chờ ${minutes} phút ${seconds} giây trước chu kỳ tiếp theo...`, "hedgemony");
        await waitWithCancel(delay, "hedgemony");
        if (hedgemonySwapCancelled) {
          addLog("Hoán đổi Hedge: Tự động hoán đổi bị dừng trong thời gian chờ.", "hedgemony");
          break;
        }
      }
    }
    hedgemonySwapRunning = false;
    hedgemonySubMenu.setItems(getHedgemonyMenuItems());
    mainMenu.setItems(getMainMenuItems());
    screen.render();
    addLog("Hoán đổi Hedge: Tự động hoán đổi hoàn tất.", "hedgemony");
  });
}

async function runHedgemonySwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Hedgemony:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "hedgemony");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ. Phải là số dương.", "hedgemony");
      return;
    }
    if (hedgemonySwapRunning) {
      addLog("Hedgemony: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "hedgemony");
      return;
    }
    hedgemonySwapRunning = true;
    hedgemonySwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    hedgemonySubMenu.setItems(getHedgemonyMenuItems());
    hedgemonySubMenu.show();
    hedgemonySubMenu.focus();
    screen.render();
    addLog(`Hedgemony: Bắt đầu tự động hoán đổi với ${loopCount} lần.`, "hedgemony");
    const wmonContract = new ethers.Contract(WMON_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
    for (let i = 1; i <= loopCount; i++) {
      if (hedgemonySwapCancelled) {
        addLog(`Hedgemony: Tự động hoán đổi bị dừng tại vòng lặp ${i}.`, "hedgemony");
        break;
      }
      const swapToWMON = (i % 2 === 1);
      const amountBN = getRandomAmountHedgemony();
      const amountStr = amountBN.toString();
      if (!swapToWMON) {
        const wmonBalance = await wmonContract.balanceOf(globalWallet.address);
        addLog(`Hedgemony: Sẽ hoán đổi WMON ➯ MON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
        if (wmonBalance < amountBN) {
          addLog(`Hedgemony: Số dư WMON không đủ. Bỏ qua vòng lặp ${i}.`, "hedgemony");
          continue;
        }
        const currentAllowance = await wmonContract.allowance(globalWallet.address, HEDGEMONY_SWAP_CONTRACT);
        if (currentAllowance < amountBN) {
          addLog("Hedgemony: Phê duyệt WMON không đủ, đang thực hiện phê duyệt...", "hedgemony");
          const approveTx = await wmonContract.approve(HEDGEMONY_SWAP_CONTRACT, ethers.MaxUint256);
          addLog(`Hedgemony: Giao dịch phê duyệt đã được gửi: ${getShortHash(approveTx.hash)}`, "hedgemony");
          await approveTx.wait();
          addLog("Hedgemony: Phê duyệt thành công.", "hedgemony");
        }
      } else {
        addLog(`Hedgemony: Sẽ hoán đổi MON ➯ WMON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
      }
      let payload;
      if (swapToWMON) {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr }
          ],
          outputTokens: [
            { address: WMON_ADDRESS, percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      } else {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: WMON_ADDRESS, amount: amountStr }
          ],
          outputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      }
      try {
      const apiResponse = await axios.post("https://alpha-api.hedgemony.xyz/swap", payload, {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${HEDGEMONY_BEARER}`
  }
});
const multicallTx = apiResponse.data.multicallTx;
if (!multicallTx || !multicallTx.to || !multicallTx.data) {
  addLog(`Hoán đổi Hedge: Dữ liệu giao dịch không đầy đủ.`, "hedgemony");
} else {
  await addTransactionToQueue(async (nonce) => {
    const tx = await globalWallet.sendTransaction({
      nonce: nonce,
      to: multicallTx.to,
      value: multicallTx.value ? BigInt(multicallTx.value) : 0n,
      data: multicallTx.data,
    });
    addLog(`Hoán đổi Hedge: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
    await tx.wait();
    addLog(`Hoán đổi Hedge: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
    await updateWalletData();
    await sendHedgeTradeHistoryWithRetry(tx.hash, globalWallet, amountStr, swapToHEDGE);
  }, "Hoán đổi Hedge");
  addLog(`Hoán đổi Hedge: Chu kỳ ${i} hoàn tất.`, "hedgemony");
}
} catch (error) {
  if (error.response && error.response.data) {
    addLog(`Hoán đổi Hedge: Lỗi: ${JSON.stringify(error.response.data)}`, "hedgemony");
  } else {
    addLog(`Hoán đổi Hedge: Lỗi: ${error.message}`, "hedgemony");
  }
}
if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`Hoán đổi Hedge: Đang chờ ${minutes} phút ${seconds} giây trước chu kỳ tiếp theo...`, "hedgemony");
  await waitWithCancel(delay, "hedgemony");
  if (hedgemonySwapCancelled) {
    addLog("Hoán đổi Hedge: Tự động hoán đổi bị dừng trong thời gian chờ.", "hedgemony");
    break;
  }
}
}
hedgemonySwapRunning = false;
hedgemonySubMenu.setItems(getHedgemonyMenuItems());
mainMenu.setItems(getMainMenuItems());
screen.render();
addLog("Hoán đổi Hedge: Tự động hoán đổi hoàn tất.", "hedgemony");
});
}


async function runHedgemonySwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Hedgemony:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "hedgemony");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ. Phải là số dương.", "hedgemony");
      return;
    }
    if (hedgemonySwapRunning) {
      addLog("Hedgemony: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "hedgemony");
      return;
    }
    hedgemonySwapRunning = true;
    hedgemonySwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    hedgemonySubMenu.setItems(getHedgemonyMenuItems());
    hedgemonySubMenu.show();
    hedgemonySubMenu.focus();
    screen.render();
    addLog(`Hedgemony: Bắt đầu tự động hoán đổi với ${loopCount} lần.`, "hedgemony");
    const wmonContract = new ethers.Contract(WMON_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
    for (let i = 1; i <= loopCount; i++) {
      if (hedgemonySwapCancelled) {
        addLog(`Hedgemony: Tự động hoán đổi bị dừng tại vòng lặp ${i}.`, "hedgemony");
        break;
      }
      const swapToWMON = (i % 2 === 1);
      const amountBN = getRandomAmountHedgemony();
      const amountStr = amountBN.toString();
      if (!swapToWMON) {
        const wmonBalance = await wmonContract.balanceOf(globalWallet.address);
        addLog(`Hedgemony: Sẽ hoán đổi WMON ➯ MON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
        if (wmonBalance < amountBN) {
          addLog(`Hedgemony: Số dư WMON không đủ. Bỏ qua vòng lặp ${i}.`, "hedgemony");
          continue;
        }
        const currentAllowance = await wmonContract.allowance(globalWallet.address, HEDGEMONY_SWAP_CONTRACT);
        if (currentAllowance < amountBN) {
          addLog("Hedgemony: Phê duyệt WMON không đủ, đang thực hiện phê duyệt...", "hedgemony");
          const approveTx = await wmonContract.approve(HEDGEMONY_SWAP_CONTRACT, ethers.MaxUint256);
          addLog(`Hedgemony: Giao dịch phê duyệt đã được gửi: ${getShortHash(approveTx.hash)}`, "hedgemony");
          await approveTx.wait();
          addLog("Hedgemony: Phê duyệt thành công.", "hedgemony");
        }
      } else {
        addLog(`Hedgemony: Sẽ hoán đổi MON ➯ WMON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
      }
      let payload;
      if (swapToWMON) {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr }
          ],
          outputTokens: [
            { address: WMON_ADDRESS, percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      } else {
        payload = {
          chainId: 10143,
          inputTokens: [
            { address: WMON_ADDRESS, amount: amountStr }
          ],
          outputTokens: [
            { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", percent: 100 }
          ],
          recipient: globalWallet.address,
          slippage: 0.5
        };
      }
      try {
        const apiResponse = await axios.post("https://alpha-api.hedgemony.xyz/swap", payload, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${HEDGEMONY_BEARER}`
          }
        });
        const multicallTx = apiResponse.data.multicallTx;
        if (!multicallTx || !multicallTx.to || !multicallTx.data) {
          addLog(`Hedgemony: Dữ liệu giao dịch không đầy đủ.`, "hedgemony");
        } else {
          await addTransactionToQueue(async (nonce) => {
            const tx = await globalWallet.sendTransaction({
              nonce: nonce,
              to: multicallTx.to,
              value: multicallTx.value || 0,
              data: multicallTx.data,
            });
            addLog(`Hedgemony: Giao dịch đã được gửi!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
            await tx.wait();
            addLog(`Hedgemony: Giao dịch được xác nhận!! Mã giao dịch: ${getShortHash(tx.hash)}`, "hedgemony");
            await sendTradeHistoryWithRetry(tx.hash, globalWallet, amountStr, swapToWMON);
            await updateWalletData();
          }, "Hoán đổi Hedgemony");
          addLog(`Hedgemony: ${i}/${loopCount} Hoán đổi hoàn tất.`, "hedgemony");
        }
      } catch (error) {
        if (error.response && error.response.data) {
          addLog(`Hedgemony: Lỗi: ${JSON.stringify(error.response.data)}`, "hedgemony");
        } else {
          addLog(`Hedgemony: Lỗi: ${error.message}`, "hedgemony");
        }
      }
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`HedgemonySwap: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "hedgemony");
        await waitWithCancel(delay, "hedgemony");
        if (hedgemonySwapCancelled) {
          addLog("Hedgemony: Tự động hoán đổi bị dừng trong thời gian chờ.", "hedgemony");
          break;
        }
      }
    }
    hedgemonySwapRunning = false;
    hedgemonySubMenu.setItems(getHedgemonyMenuItems());
    mainMenu.setItems(getMainMenuItems());
    screen.render();
    addLog("Hedgemony: Tự động hoán đổi hoàn tất.", "hedgemony");
  });
}
function stopHedgemonySwap() {
  if (hedgemonySwapRunning) {
    hedgemonySwapCancelled = true;
    addLog("Hedgemony: Lệnh dừng giao dịch đã được nhận.", "hedgemony");
  } else {
    addLog("Hedgemony: Không có giao dịch nào đang chạy.", "hedgemony");
  }
}

async function runMondaSwapMonDak() {
    promptBox.setFront();
    promptBox.readInput("Nhập số lượng chu kỳ cho hoán đổi MON & DAK:", "", async (err, value) => {
      promptBox.hide();
      mondaSubMenu.show();
      mondaSubMenu.focus();
      screen.render();
      if (err || !value) {
        addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "monda");
        return;
      }
      const loopCount = parseInt(value);
      if (isNaN(loopCount)) {
        addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
        return;
      }
      addLog(`MondaSwap: Bạn đã nhập ${loopCount} chu kỳ cho hoán đổi MON & DAK.`, "monda");
      if (mondaSwapRunning) {
        addLog("MondaSwap: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "monda");
        return;
      }
      mondaSwapRunning = true;
      mondaSwapCancelled = false;
      mainMenu.setItems(getMainMenuItems());
      mondaSubMenu.setItems(getMondaMenuItems());
      mondaSubMenu.show();
      mondaSubMenu.focus();
      screen.render();
      const mondaRouter = new ethers.Contract(
        "0xc80585f78A6e44fb46e1445006f820448840386e",
        MONDA_ROUTER_ABI,
        globalWallet
      );
      const routerWETH = await mondaRouter.WETH();
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const DAK_ADDRESS = "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714";

      for (let i = 1; i <= loopCount; i++) {
        if (mondaSwapCancelled) {
          addLog(`MondaSwap: Tự động hoán đổi MON & DAK bị dừng tại vòng lặp ${i}.`, "monda");
          break;
        }
        if (i % 2 === 1) {
          const amountIn = getRandomAmountMonForSwap();
          const balanceMON = await provider.getBalance(globalWallet.address);
          if (balanceMON < amountIn) {
            addLog(`Monda: Số dư MON không đủ để hoán đổi MON → DAK.`, "monda");
            continue;
          }
          const expectedOutput = getRandomAmountDakForSwap(); 
          const amountOutMin = (expectedOutput * 980n) / 1000n;
          const deadline = Math.floor(Date.now() / 1000) + 300;
          let path = [routerWETH, DAK_ADDRESS];
          addLog(`Monda: Hoán đổi MON ➯ DAK với số lượng ${ethers.formatEther(amountIn)} MON`, "monda");
          await addTransactionToQueue(async (nonce) => {
            const tx = await mondaRouter.swapExactETHForTokens(
              amountOutMin,
              path,
              globalWallet.address,
              deadline,
              { value: amountIn, nonce: nonce }
            );
            addLog(`Monda: Giao dịch đã được gửi: ${getShortHash(tx.hash)}`, "monda");
            await tx.wait();
            addLog(`Monda: Giao dịch được xác nhận.`, "monda");
            await updateWalletData();
          }, `Monda Swap MON ➯ DAK`);
        } else {
          const amountIn = getRandomAmountDakForSwap();
          const tokenContract = new ethers.Contract(DAK_ADDRESS, ERC20_ABI, provider);
          const tokenBalance = await tokenContract.balanceOf(globalWallet.address);
          if (tokenBalance < amountIn) {
            addLog(`Monda: Số dư DAK không đủ để hoán đổi DAK → MON.`, "monda");
            continue;
          }
          const tokenContractApprove = new ethers.Contract(DAK_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
          const currentAllowance = await tokenContractApprove.allowance(globalWallet.address, "0xc80585f78A6e44fb46e1445006f820448840386e");
          if (currentAllowance < amountIn) {
            addLog(`Monda: Đang phê duyệt DAK...`, "monda");
            const approveTx = await tokenContractApprove.approve("0xc80585f78A6e44fb46e1445006f820448840386e", ethers.MaxUint256);
            await approveTx.wait();
            addLog(`Monda: Phê duyệt DAK thành công.`, "monda");
          }
          const expectedOutput = getRandomAmountMonForSwap(); 
          const amountOutMin = (expectedOutput * 980n) / 1000n;
          const deadline = Math.floor(Date.now() / 1000) + 300;
          let path = [DAK_ADDRESS, routerWETH];
          addLog(`Monda: Hoán đổi DAK ➯ MON với số lượng ${ethers.formatUnits(amountIn,18)} DAK`, "monda");
          await addTransactionToQueue(async (nonce) => {
            const tx = await mondaRouter.swapExactTokensForETH(
              amountIn,
              amountOutMin,
              path,
              globalWallet.address,
              deadline,
              { nonce: nonce }
            );
            addLog(`Monda: Giao dịch đã được gửi: ${getShortHash(tx.hash)}`, "monda");
            await tx.wait();
            addLog(`Monda: Giao dịch được xác nhận.`, "monda");
            await updateWalletData();
          }, `Monda Swap DAK ➯ MON`);
        }
        if (i < loopCount) {
          const delay = getRandomDelay();
          const minutes = Math.floor(delay / 60000);
          const seconds = Math.floor((delay % 60000) / 1000);
          addLog(`MondaSwap: Chu kỳ thứ ${i} hoàn tất`, "monda");
          addLog(`MondaSwap: Đang chờ ${minutes} phút ${seconds} giây trước chu kỳ tiếp theo...`, "monda");
          await waitWithCancel(delay, "monda");
          if (mondaSwapCancelled) {
            addLog(`Monda: Tự động hoán đổi bị dừng trong thời gian chờ.`, "monda");
            break;
          }
        }
      }
      mondaSwapRunning = false;
      mainMenu.setItems(getMainMenuItems());
      mondaSubMenu.setItems(getMondaMenuItems());
      screen.render();
      addLog("MondaSwap: Tự động hoán đổi MON & DAK hoàn tất.", "monda");
      mondaSubMenu.focus();
    });
  }


async function runMondaSwapMonUsdcUsdt() {
  promptBox.show();
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng chu kỳ cho hoán đổi MON/USDC/USDT:", "", async (err, value) => {
    promptBox.hide();
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    if (err || !value) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "monda");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
      return;
    }
    addLog(`MondaSwap: Bạn đã nhập ${loopCount} chu kỳ cho hoán đổi MON/USDC/USDT.`, "monda");

    mondaSwapRunning = true;
    mondaSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    mondaSubMenu.setItems(getMondaMenuItems());
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();

    const mondaRouter = new ethers.Contract(
      "0xc80585f78A6e44fb46e1445006f820448840386e",
      MONDA_ROUTER_ABI,
      globalWallet
    );
    const routerWETH = await mondaRouter.WETH();
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    for (let i = 1; i <= loopCount; i++) {
      if (mondaSwapCancelled) {
        addLog(`MondaSwap: Tự động hoán đổi MON/USDC/USDT bị dừng tại vòng lặp ${i}.`, "monda");
        break;
      }

      let useUSDC = ((i - 1) % 4) < 2;
      let targetToken = useUSDC ? USDC_ADDRESS : "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D";

      if (i % 2 === 1) {
        const amountIn = getRandomAmountMonForUsdcUsdt();
        const balanceMON = await provider.getBalance(globalWallet.address);
        if (balanceMON < amountIn) {
          addLog(`Monda: Số dư MON không đủ để hoán đổi MON → ${useUSDC ? "USDC" : "USDT"}.`, "monda");
          continue;
        }
        const expectedOutput = useUSDC ? getRandomAmountUsdcForSwap() : getRandomAmountUsdtForSwap();
        const amountOutMin = 0n;
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const path = [routerWETH, targetToken];
        addLog(`Monda: Hoán đổi MON ➯ ${useUSDC ? "USDC" : "USDT"} với số lượng: ${ethers.formatEther(amountIn)} MON`, "monda");
        await addTransactionToQueue(async (nonce) => {
          const tx = await mondaRouter.swapExactETHForTokens(
            amountOutMin,
            path,
            globalWallet.address,
            deadline,
            { value: amountIn, nonce: nonce }
          );
          addLog(`Monda: Giao dịch đã được gửi: ${getShortHash(tx.hash)}`, "monda");
          await tx.wait();
          addLog(`Monda: Giao dịch được xác nhận.`, "monda");
          await updateWalletData();
        }, `Monda Swap MON ➯ ${useUSDC ? "USDC" : "USDT"}`);
      } else {
        const decimals = 6;
        const amountIn = useUSDC ? getRandomAmountUsdcForSwap() : getRandomAmountUsdtForSwap();
        const tokenContract = new ethers.Contract(targetToken, ERC20_ABI, provider);
        const tokenBalance = await tokenContract.balanceOf(globalWallet.address);
        if (tokenBalance < amountIn) {
          addLog(`Monda: Số dư ${useUSDC ? "USDC" : "USDT"} không đủ để hoán đổi sang MON.`, "monda");
          continue;
        }
        const tokenContractApprove = new ethers.Contract(targetToken, ERC20_ABI_APPROVE, globalWallet);
        const currentAllowance = await tokenContractApprove.allowance(globalWallet.address, "0xc80585f78A6e44fb46e1445006f820448840386e");
        if (currentAllowance < amountIn) {
          addLog(`Monda: Đang phê duyệt ${useUSDC ? "USDC" : "USDT"}...`, "monda");
          const approveTx = await tokenContractApprove.approve("0xc80585f78A6e44fb46e1445006f820448840386e", ethers.MaxUint256);
          await approveTx.wait();
          addLog(`Monda: Phê duyệt ${useUSDC ? "USDC" : "USDT"} thành công.`, "monda");
        }
        const expectedOutput = getRandomAmountMonForUsdcUsdt();
        const amountOutMin = 0n; 
        const deadline = Math.floor(Date.now() / 1000) + 300;
        const path = [targetToken, routerWETH];
        addLog(`Monda: Hoán đổi ${useUSDC ? "USDC" : "USDT"} ➯ MON với số lượng: ${ethers.formatUnits(amountIn, decimals)} ${useUSDC ? "USDC" : "USDT"}`, "monda");
        await addTransactionToQueue(async (nonce) => {
          const tx = await mondaRouter.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            globalWallet.address,
            deadline,
            { nonce: nonce }
          );
          addLog(`Monda: Giao dịch đã được gửi: ${getShortHash(tx.hash)}`, "monda");
          await tx.wait();
          addLog(`Monda: Giao dịch được xác nhận ${getShortHash(tx.hash)}`, "monda");
          await updateWalletData();
        }, `Monda Swap ${useUSDC ? "USDC" : "USDT"} ➯ MON`);
      }
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Monda: Chu kỳ thứ ${i} hoàn tất`, "monda");
        addLog(`Monda: Đang chờ ${minutes} phút ${seconds} giây trước chu kỳ tiếp theo...`, "monda");
        await waitWithCancel(delay, "monda");
        if (mondaSwapCancelled) {
          addLog(`Monda: Tự động hoán đổi bị dừng trong thời gian chờ.`, "monda");
          break;
        }
      }
    }
    mondaSwapRunning = false;
    mainMenu.setItems(getMainMenuItems());
    mondaSubMenu.setItems(getMondaMenuItems());
    screen.render();
    addLog("MondaSwap: Tự động hoán đổi MON/USDC/USDT hoàn tất.", "monda");
    mondaSubMenu.focus();
  });
}


async function runMondaSwapMonMonda() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi Monda (Mon & Monda):", "", async (err, value) => {
    promptBox.hide();
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    if (err || !value) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "monda");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
      return;
    }
    addLog(`MondaSwap: Bạn đã nhập ${loopCount} lần tự động hoán đổi Mon & Monda.`, "monda");
    if (mondaSwapRunning) {
      addLog("MondaSwap: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "monda");
      return;
    }
    mondaSwapRunning = true;
    mondaSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    mondaSubMenu.setItems(getMondaMenuItems());
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    for (let i = 1; i <= loopCount; i++) {
      if (mondaSwapCancelled) {
        addLog(`MondaSwap: Tự động hoán đổi Mon & Monda bị dừng tại vòng lặp ${i}.`, "monda");
        break;
      }
      await addTransactionToQueue(async (nonce) => {
        addLog(`MondaSwap: Vòng lặp ${i}: Thực hiện hoán đổi Mon & Monda.`, "monda");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }, `Monda Swap Mon ➯ Monda`);
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`MondaSwap: Chu kỳ thứ ${i} hoàn tất`, "monda");
        addLog(`MondaSwap: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "monda");
        await waitWithCancel(delay, "monda");
        if (mondaSwapCancelled) {
          addLog("Monda: Tự động hoán đổi bị dừng trong thời gian chờ.", "monda");
          break;
        }
      }
    }
    mondaSwapRunning = false;
    mainMenu.setItems(getMainMenuItems());
    mondaSubMenu.setItems(getMondaMenuItems());
    screen.render();
    addLog("MondaSwap: Tự động hoán đổi Mon & Monda hoàn tất.", "monda");
    mondaSubMenu.focus();
  });
}

async function runBubbleFiAutoSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lượng hoán đổi BubbleFi:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("BubbleFi: Dữ liệu nhập không hợp lệ hoặc bị hủy.", "bubblefi");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("BubbleFi: Dữ liệu nhập không hợp lệ. Phải là số dương.", "bubblefi");
      return;
    }
    addLog(`BubbleFi: Bạn đã nhập ${loopCount} lần hoán đổi BubbleFi.`, "bubblefi");
    if (bubbleFiSwapRunning) {
      addLog("BubbleFi: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "bubblefi");
      return;
    }
    bubbleFiSwapRunning = true;
    bubbleFiSwapCancelled = false;
    mainMenu.setItems(getMainMenuItems());
    bubbleFiSubMenu.setItems(getBubbleFiMenuItems());
    bubbleFiSubMenu.show();
    screen.render();
    let userId;
    try {
      const sessionResponse = await axios.get("https://api.bubblefi.xyz/auth/session", {
        headers: { 
          "Content-Type": "application/json",
          Cookie: BUBBLEFI_COOKIE,
          "origin": "https://app.bubblefi.xyz",
          "referer": "https://app.bubblefi.xyz/",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
        }
      });
      userId = sessionResponse.data.user.id;
      addLog(`BubbleFi: Đã lấy được phiên cho ID người dùng ${userId}`, "bubblefi");
    } catch (error) {
      addLog(`BubbleFi: Không thể lấy phiên: ${error.message}`, "bubblefi");
      bubbleFiSwapRunning = false;
      return;
    }

    const tokens = [
      { address: TOKEN_PEPE, name: "PEPE" },
      { address: TOKEN_MLDK, name: "MLDK" },
      { address: TOKEN_MYK,  name: "MYK" }
    ];

    for (let i = 1; i <= loopCount; i++) {
      if (bubbleFiSwapCancelled) {
        addLog(`BubbleFi: Hoán đổi bị hủy tại chu kỳ thứ ${i}.`, "bubblefi");
        break;
      }

      const indexFrom = Math.floor(Math.random() * tokens.length);
      let indexTo;
      do {
        indexTo = Math.floor(Math.random() * tokens.length);
      } while (indexTo === indexFrom);
      const fromToken = tokens[indexFrom];
      const toToken = tokens[indexTo];
      const amountToSwap = getRandomAmountBubbleFi();
      const fromTokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, globalWallet.provider);
      const balance = await fromTokenContract.balanceOf(globalWallet.address);
      if (balance < amountToSwap) {
        addLog(`BubbleFi: Số dư ${fromToken.name} (${ethers.formatUnits(balance, 18)}) không đủ để hoán đổi ${ethers.formatUnits(amountToSwap, 18)}. Bỏ qua vòng lặp này.`, "bubblefi");
        continue;
      }

      addLog(`BubbleFi: Hoán đổi ${fromToken.name} ➯ ${toToken.name} với số lượng ${ethers.formatUnits(amountToSwap, 18)}`, "bubblefi");

      await addTransactionToQueue(async (nonce) => {
        const fromTokenContractApprove = new ethers.Contract(fromToken.address, ERC20_ABI_APPROVE, globalWallet);
        const currentAllowance = await fromTokenContractApprove.allowance(globalWallet.address, BUBBLEFI_ROUTER_ADDRESS);
        if (currentAllowance < amountToSwap) {
          addLog(`BubbleFi: Cần phê duyệt ${fromToken.name}.`, "bubblefi");
          const approveTx = await fromTokenContractApprove.approve(BUBBLEFI_ROUTER_ADDRESS, ethers.MaxUint256, { nonce });
          addLog(`BubbleFi: Giao dịch phê duyệt ${fromToken.name} đã được gửi: ${getShortHash(approveTx.hash)}`, "bubblefi");
          await approveTx.wait();
          addLog(`BubbleFi: Phê duyệt ${fromToken.name} thành công.`, "bubblefi");
        }
        const bubbleFiRouter = new ethers.Contract(BUBBLEFI_ROUTER_ADDRESS, BUBBLEFI_ROUTER_ABI, globalWallet);
        const swapPath = [fromToken.address, toToken.address];
        let estimatedAmounts;
        try {
          estimatedAmounts = await bubbleFiRouter.getAmountsOut(amountToSwap, swapPath);
        } catch (error) {
          addLog(`BubbleFi: getAmountsOut thất bại: ${error.message}`, "bubblefi");
          return;
        }
        const outputEstimated = estimatedAmounts[estimatedAmounts.length - 1];
        if (outputEstimated === 0n) {
          addLog(`BubbleFi: Ước tính đầu ra bằng 0, đường dẫn hoán đổi không hợp lệ.`, "bubblefi");
          return;
        }
        const amountOutMin = outputEstimated * 997n / 1000n;
        const deadline = Math.floor(Date.now() / 1000) + 300;
        addLog(`BubbleFi: Bắt đầu hoán đổi ${fromToken.name} ➯ ${toToken.name} với số lượng ${ethers.formatUnits(amountToSwap, 18)}`, "bubblefi");
        const raffleParam = {
          enter: false,
          fractionOfSwapAmount: { numerator: 0, denominator: 0 },
          raffleNftReceiver: "0x0000000000000000000000000000000000000000"
        };

        const swapTx = await bubbleFiRouter.swapExactTokensForTokens(
          amountToSwap,
          amountOutMin,
          swapPath,
          globalWallet.address,
          deadline,
          raffleParam,
          { nonce }
        );
        addLog(`BubbleFi: Giao dịch hoán đổi đã được gửi: ${getShortHash(swapTx.hash)}`, "bubblefi");
        await swapTx.wait();
        const processPayload = {
          liqAddress: "0x",
          methodType: "SWAP",
          transactionHash: swapTx.hash,
          userAddress: globalWallet.address,
          userId: userId,
          usingBackpack: true
        };
        try {
          const postResponse = await axios.post("https://api.bubblefi.xyz/points/process-action", processPayload, {
            headers: {
              "Content-Type": "application/json",
              Cookie: BUBBLEFI_COOKIE,
              "origin": "https://app.bubblefi.xyz",
              "referer": "https://app.bubblefi.xyz/",
              "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
            }
          });
          const { pointsAwarded, totalPoints } = postResponse.data;
          addLog(`BubbleFi: Điểm được thưởng: Điểm = ${pointsAwarded}, Tổng điểm = ${totalPoints}`, "bubblefi");
          await updateWalletData();
          addLog(`BubbleFi: Hoán đổi ${fromToken.name} ➯ ${toToken.name} hoàn tất.`, "bubblefi");
        } catch (postError) {
          addLog(`BubbleFi: Không thể xử lý điểm: ${postError.message}`, "bubblefi");
        }
      }, `BubbleFi Swap ${fromToken.name} ➯ ${toToken.name}`);
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`BubbleFiSwap: Chu kỳ thứ ${i} hoàn tất`, "bubblefi");
        addLog(`BubbleFiSwap: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "bubblefi");
        await waitWithCancel(delay, "bubblefi");
        if (bubbleFiSwapCancelled) {
          addLog("BubbleFi: Tự động hoán đổi bị dừng trong thời gian chờ.", "bubblefi");
          break;
        } 
      }
    } 
    bubbleFiSwapRunning = false;
    bubbleFiSubMenu.setItems(getBubbleFiMenuItems());
    mainMenu.setItems(getMainMenuItems());
    screen.render();
    addLog("BubbleFi: Tự động hoán đổi hoàn tất.", "bubblefi");
  });
}
mainMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Dừng tất cả giao dịch") {
    stopAllTransactions();
    mainMenu.setItems(getMainMenuItems());
    mainMenu.focus();
    screen.render();
  } else if (selected === "Hoán đổi Rubic") {
    rubicSubMenu.show();
    rubicSubMenu.focus();
    screen.render();
  } else if (selected === "Hoán đổi Taya") {
    runTayaSwap();
  } else if (selected === "Hoán đổi Hedgemony") {
    hedgemonySubMenu.show();
    hedgemonySubMenu.focus();
    screen.render();
  } else if (selected === "Hoán đổi Monda") {
    mainMenu.hide();
    mondaSubMenu.setItems(getMondaMenuItems());
    mondaSubMenu.show();
    setTimeout(() => {
      mondaSubMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Hoán đổi BubbleFi") {
    mainMenu.hide();
    bubbleFiSubMenu.setItems(getBubbleFiMenuItems());
    bubbleFiSubMenu.show();
    setTimeout(() => {
      bubbleFiSubMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Hàng đợi giao dịch") {
    showTransactionQueueMenu();
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Làm mới") {
    updateWalletData();
    updateLogs();
    screen.render();
    addLog("Đã làm mới", "hệ thống");
    mainMenu.focus();
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

rubicSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Tự động hoán đổi Mon & WMON") {
    runAutoSwap();
  } else if (selected === "Dừng giao dịch") {
    if (autoSwapRunning) {
      autoSwapCancelled = true;
      addLog("Rubic: Lệnh dừng giao dịch đã được nhận.", "rubic");
    } else {
      addLog("Rubic: Không có giao dịch nào đang chạy.", "rubic");
    }
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Quay lại menu chính") {
    rubicSubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

function showTayaSubMenu() {
  mainMenu.hide();
  tayaSubMenu.setItems(getTayaMenuItems());
  tayaSubMenu.show();
  tayaSubMenu.focus();
  screen.render();
}

tayaSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Tự động hoán đổi Token ngẫu nhiên") {
    runTayaAutoSwapRandom();
  } else if (selected === "Tự động hoán đổi MON & WMON") {
    runTayaWrapCycle();
  } else if (selected === "Dừng giao dịch") {
    if (tayaSwapRunning) {
      tayaSwapCancelled = true;
      addLog("Taya: Lệnh dừng giao dịch đã được nhận.", "taya");
    } else {
      addLog("Taya: Không có giao dịch nào đang chạy.", "taya");
    }
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Quay lại menu chính") {
    tayaSubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

function showHedgemonySubMenu() {
  mainMenu.hide();
  hedgemonySubMenu.setItems(getHedgemonyMenuItems());
  hedgemonySubMenu.show();
  hedgemonySubMenu.focus();
  screen.render();
}

hedgemonySubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Tự động hoán đổi Mon & WMON") {
    runHedgemonySwap();
  } else if (selected === "Tự động hoán đổi Mon & HEDGE") {
    runHedgeSwap();
  } else if (selected === "Dừng giao dịch") {
    if (hedgemonySwapRunning) {
      hedgemonySwapCancelled = true;
      addLog("Hedgemony: Lệnh dừng giao dịch đã được nhận.", "hedgemony");
    } else {
      addLog("Hedgemony: Không có giao dịch nào đang chạy.", "hedgemony");
    }
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Quay lại menu chính") {
    hedgemonySubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

mondaSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Tự động hoán đổi Mon & Dak") {
    runMondaSwapMonDak();
  } else if (selected === "Tự động hoán đổi Mon & USDC/USDT") {
    runMondaSwapMonUsdcUsdt();
  } else if (selected === "Tự động hoán đổi Mon & Monda") {
    addLog("MondaSwap: Tính năng tự động hoán đổi Mon & Monda sắp ra mắt.", "monda");
    mondaSubMenu.focus();
    return;
  } else if (selected === "Dừng giao dịch") {
    if (mondaSwapRunning) {
      mondaSwapCancelled = true;
      addLog("MondaSwap: Lệnh dừng giao dịch đã được nhận.", "monda");
    } else {
      addLog("MondaSwap: Không có giao dịch nào đang chạy.", "monda");
    }
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Quay lại menu chính") {
    mondaSubMenu.hide();
    mainMenu.show();
    setTimeout(() => {
      mainMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

bubbleFiSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Tự động hoán đổi Pepe & Mldk & Myk") {
    runBubbleFiAutoSwap();
  } else if (selected === "Dừng giao dịch") {
    if (bubbleFiSwapRunning) {
      bubbleFiSwapCancelled = true;
      addLog("BubbleFiSwap: Lệnh dừng giao dịch đã được nhận.", "bubblefi");
    } else {
      addLog("BubbleFiSwap: Không có giao dịch nào đang chạy.", "bubblefi");
    }
  } else if (selected === "Xóa nhật ký giao dịch") {
    clearTransactionLogs();
  } else if (selected === "Quay lại menu chính") {
    bubbleFiSubMenu.hide();
    mainMenu.show();
    setTimeout(() => {
      mainMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Thoát") {
    process.exit(0);
  }
});

screen.key(["C-up"], () => { logsBox.scroll(-1); safeRender(); });
screen.key(["C-down"], () => { logsBox.scroll(1); safeRender(); });
safeRender();
mainMenu.focus();
updateLogs();
screen.render();
