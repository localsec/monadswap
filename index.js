import "dotenv/config";
import blessed from "blessed";
import figlet from "figlet";
import { ethers } from "ethers";
import axios from "axios";

const RPC_URL = process.env.RPC_URL || "https://testnet-rpc.monad.xyz";
// Địa chỉ URL RPC, mặc định là testnet của Monad

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
// Khóa riêng, mặc định là chuỗi rỗng

const WMON_ADDRESS = process.env.WMON_ADDRESS || "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
// Địa chỉ WMON, mặc định như trên

const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || WMON_ADDRESS;
// Địa chỉ Router, mặc định sử dụng WMON_ADDRESS

const RUBIC_API_URL = process.env.RUBIC_API_URL || "https://testnet-api.rubic.exchange/api/v2/trades/onchain/new_extended";
// URL API của Rubic, mặc định là testnet API

const RUBIC_COOKIE = process.env.RUBIC_COOKIE || "";
// Cookie của Rubic, mặc định là chuỗi rỗng

const RUBIC_REWARD_URL = "https://testnet-api.rubic.exchange/api/v2/rewards/tmp_onchain_reward_amount_for_user?address=";
// URL phần thưởng của Rubic

const HEDGEMONY_BEARER = process.env.HEDGEMONY_BEARER;
// Token Bearer của Hedgemony

const USDC_ADDRESS = "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea";
// Địa chỉ USDC

const WETH_ADDRESS = "0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37";
// Địa chỉ WETH

const TAYA_SWAP_CONTRACT = "0x4ba4bE2FB69E2aa059A551Ce5d609Ef5818Dd72F";
// Địa chỉ hợp đồng Swap của Taya

const TOKENS = [USDC_ADDRESS, WETH_ADDRESS];
// Danh sách các token (USDC và WETH)

const HEDGEMONY_SWAP_CONTRACT = "0xfB06ac672944099E33Ad7F27f0Aa9B1bc43e65F8";
// Địa chỉ hợp đồng Swap của Hedgemony

const HEDGE_ADDRESS = process.env.HEDGE_ADDRESS || "0x04a9d9D4AEa93F512A4c7b71993915004325ed38";
// Địa chỉ HEDGE, mặc định như trên

const MONDA_ROUTER_ADDRESS = "0xc80585f78A6e44fb46e1445006f820448840386e";
// Địa chỉ Router của Monda

const USDT_ADDRESS_MONDA = "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D";
// Địa chỉ USDT trên Monda

const TOKEN_MLDK = "0xe9f4c0093B4e94800487cad93FBBF7C3729ccf5c";
// Địa chỉ token MLDK

const TOKEN_MYK  = "0x59897686b2Dd2059b09642797EBeA3d21E6cE2d1";
// Địa chỉ token MYK

const TOKEN_PEPE = "0xab1fA5cc0a7dB885BC691b60eBeEbDF59354434b";
// Địa chỉ token PEPE

const BUBBLEFI_ROUTER_ADDRESS = "0x6c4f91880654a4F4414f50e002f361048433051B";
// Địa chỉ Router của BubbleFi

const BUBBLEFI_COOKIE = process.env.BUBBLEFI_COOKIE || "";
// Cookie của BubbleFi, mặc định là chuỗi rỗng

const MON_TO_HEDGE_CONVERSION_FACTOR = ethers.parseUnits("15.40493695", 18);
// Tỉ lệ quy đổi từ MON sang HEDGE

const HEDGE_TO_MON_CONVERSION_FACTOR = ethers.parseUnits("0.06493", 18);
// Tỉ lệ quy đổi từ HEDGE sang MON

const WEI_PER_ETHER = ethers.parseUnits("1", 18);
// Số WEI trên 1 ETHER

const MAX_RPC_RETRIES = 5;
// Số lần thử lại khi lỗi RPC

const RETRY_DELAY_MS = 5000;
// Thời gian delay giữa mỗi lần thử lại (5 giây)

const bubbleFiTokens = [
  { address: TOKEN_PEPE, name: "PEPE" },
  { address: TOKEN_MLDK, name: "MLDK" },
  { address: TOKEN_MYK,  name: "MYK" }
];
// Danh sách token Swap trên BubbleFi

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
// Hàm kiểm tra số dư của một địa chỉ

const ROUTER_ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];
// Hàm gửi và rút của Router

const ERC20_ABI_APPROVE = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];
// Hàm kiểm tra số dư, kiểm tra quyền cho phép, và phê duyệt số lượng token

const TAYA_SWAP_ABI = [
  "function WETH() view returns (address)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) nonpayable"
];
// Hàm lấy địa chỉ WETH, hoán đổi ETH lấy token, và hoán đổi token này lấy token khác

const MONDA_ROUTER_ABI = [
  {"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"}
];
// Hàm khởi tạo, lấy địa chỉ WETH, thêm thanh khoản, hoán đổi ETH lấy token, và hoán đổi token lấy ETH

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
// Hàm hoán đổi token lấy token với số lượng đầu vào, tối thiểu đầu ra, đường dẫn, người nhận, thời hạn và thông tin xổ số
// Hàm lấy số lượng đầu ra dự kiến dựa trên số lượng đầu vào và đường dẫn token



let walletInfo = {
  address: "",
  balanceMON: "0.00",
  balanceWMON: "0.00",
  balanceHEDGE: "0.00",
  balanceWETH: "0.00",
balanceHEDGE: "0.00",
  balanceUSDC: "0.00",
  network: "Monad Testnet",
  status: "Initializing"
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
  addLog(`Unhandled Rejection: ${reason}`, "system");
});
// Xử lý lỗi không được bắt: Ghi log lỗi hệ thống khi có lời hứa bị từ chối không xử lý

process.on("uncaughtException", (error) => {
  addLog(`Uncaught Exception: ${error.message}`, "system");
});
// Xử lý ngoại lệ không được bắt: Ghi log lỗi hệ thống khi có ngoại lệ xảy ra

function getShortAddress(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}
// Lấy địa chỉ ngắn: Cắt địa chỉ để chỉ hiển thị 6 ký tự đầu và 4 ký tự cuối

function getShortHash(hash) {
  return hash.slice(0, 6) + "..." + hash.slice(-4);
}
// Lấy mã băm ngắn: Cắt mã băm để chỉ hiển thị 6 ký tự đầu và 4 ký tự cuối

function getTokenSymbol(address) {
  if (address.toLowerCase() === WMON_ADDRESS.toLowerCase()) return "WMON";
  if (address.toLowerCase() === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (address.toLowerCase() === WETH_ADDRESS.toLowerCase()) return "WETH";
  return address;
}
// Lấy biểu tượng token: Trả về biểu tượng token (WMON, USDC, WETH) dựa trên địa chỉ hoặc trả về địa chỉ nếu không khớp

// Thiết lập độ trễ giữa các giao dịch
function getRandomDelay() {
  return Math.random() * (60000 - 30000) + 30000;
}
// Lấy độ trễ ngẫu nhiên: Trả về thời gian trễ ngẫu nhiên từ 30 đến 60 giây

// Số lượng ngẫu nhiên cho Rubic
function getRandomAmount() {
  const min = 0.005, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}
// Lấy số lượng ngẫu nhiên: Trả về số lượng ETH ngẫu nhiên từ 0.005 đến 0.01, định dạng với 6 chữ số thập phân

// Random số lượng ngẫu nhiên cho Taya
function getRandomAmountTaya() {
  const min = 0.005, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}

// Random số lượng ngẫu nhiên cho Hedgemony Mon - Wmon
function getRandomAmountHedgemony() {
  const min = 0.003, max = 0.01;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6));
}

// Random số lượng token $MON (Hedgemony)
function getRandomAmountMonToHedge() {
  const min = 0.01, max = 0.05;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Random số lượng token $HEDGE (Hedgemony)
function getRandomAmountHedgeToMon() {
  const min = 400, max = 1000;
  const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
  return ethers.parseUnits(randomInt.toString(), 18);
}

// Random số lượng Monda ngẫu nhiên để swap từ Dak -> Mon
function getRandomAmountDakForSwap() {
  const min = 0.3, max = 4;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Random số lượng Monda ngẫu nhiên để swap từ Mon -> Dak
function getRandomAmountMonForSwap() {
  const min = 0.1, max = 1;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}

// Random số lượng Monda ngẫu nhiên để swap từ Mon -> USDC/USDT
function getRandomAmountMonForUsdcUsdt() {
  const min = 1 , max = 4;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseEther(randomVal.toFixed(6)); 
}

// Random số lượng Monda ngẫu nhiên để swap từ USDC -> Mon
function getRandomAmountUsdcForSwap() {
  const min = 10, max = 43 ;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 6);
}

// Random số lượng Monda ngẫu nhiên để swap từ USDT -> Mon
function getRandomAmountUsdtForSwap() {
  const min = 11, max = 43;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 6); 
}

// Random số lượng token Bubblefi PEPE - MLDK - MYK ngẫu nhiên
function getRandomAmountBubbleFi() {
  const min = 5;
  const max = 15;
  const randomVal = Math.random() * (max - min) + min;
  return ethers.parseUnits(randomVal.toFixed(6), 18);
}
    
// Thêm log hiển thị ra màn hình
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

// Cập nhật lại log trên màn hình
function updateLogs() {
  logsBox.setContent(transactionLogs.join("\n"));
  logsBox.setScrollPerc(100);
  safeRender();
}

// Xóa toàn bộ log giao dịch
function clearTransactionLogs() {
  transactionLogs = [];
  updateLogs();
  addLog("Log giao dịch đã được xóa.", "system");
}

// Khởi tạo màn hình terminal
const screen = blessed.screen({
  smartCSR: true,
  title: "NT Exhaust",
  fullUnicode: true,
  mouse: true
});

let renderTimeout;

// Render an toàn (tránh bị lỗi giao diện khi render liên tục)
function safeRender() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => { screen.render(); }, 50);
}

// Tạo khung hiển thị header
const headerBox = blessed.box({
  top: 0,
  left: "center",
  width: "100%",
  tags: true,
  style: { fg: "white", bg: "default" }
});

// Hiển thị chữ "NT Exhaust" ở header
figlet.text("NT Exhaust".toUpperCase(), { font: "Speed", horizontalLayout: "default" }, (err, data) => {
  if (err) headerBox.setContent("{center}{bold}MONAD AUTO SWAP{/bold}{/center}");
  else headerBox.setContent(`{center}{bold}{bright-cyan-fg}${data}{/bright-cyan-fg}{/bold}{/center}`);
  safeRender();
});

// Box mô tả tiêu đề chính
const descriptionBox = blessed.box({
  left: "center",
  width: "100%",
  content: "{center}{bold}{bright-cyan-fg}➕➕➕➕ MONAD AUTO SWAP ➕➕➕➕{/bright-cyan-fg}{/bold}{/center}",
  tags: true,
  style: { fg: "white", bg: "default" }
});

// Box hiển thị log giao dịch
const logsBox = blessed.box({
  label: " Lịch Sử Giao Dịch ", // Transaction Logs -> Lịch Sử Giao Dịch
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

// Box hiển thị thông tin ví
const walletBox = blessed.box({
  label: " Thông Tin Ví ", // Informasi Wallet -> Thông Tin Ví
  left: "60%",
  tags: true,
  border: { type: "line" },
  style: { border: { fg: "magenta" }, fg: "white", bg: "default", align: "left", valign: "top" },
  content: ""
});

// Cập nhật thông tin ví
function updateWallet() {
  const shortAddress = walletInfo.address
    ? walletInfo.address.slice(0, 6) + "..." + walletInfo.address.slice(-4)
    : "Không Có"; // N/A -> Không Có
}


  const formatBalance = (balance) => {
    return Number(balance).toFixed(2);
};

const mon   = walletInfo.balanceMON ? formatBalance(walletInfo.balanceMON) : "0.00";
const wmon  = walletInfo.balanceWMON ? formatBalance(walletInfo.balanceWMON) : "0.00";
const hedge = walletInfo.balanceHEDGE ? formatBalance(walletInfo.balanceHEDGE) : "0.00";
const weth  = walletInfo.balanceWETH ? formatBalance(walletInfo.balanceWETH) : "0.00";
const usdt  = walletInfo.balanceUSDT ? formatBalance(walletInfo.balanceUSDT) : "0.00";
const usdc  = walletInfo.balanceUSDC ? formatBalance(walletInfo.balanceUSDC) : "0.00";
const network = walletInfo.network || "Không Xác Định"; // Unknown -> Không Xác Định

const content = `Địa Chỉ Ví : {bold}{bright-cyan-fg}${shortAddress}{/bright-cyan-fg}{/bold}
└── Mạng Lưới : {bold}{bright-yellow-fg}${network}{/bright-yellow-fg}{/bold}
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
  if (autoSwapRunning || tayaSwapRunning || hedgemonySwapRunning || mondaSwapRunning) {
    autoSwapCancelled = true;
    tayaSwapCancelled = true;
    hedgemonySwapCancelled = true;
    mondaSwapCancelled = true;
    bubbleFiSwapCancelled = true;
    addLog("Lệnh dừng tất cả giao dịch đã được nhận. Tất cả giao dịch đã được dừng lại.", "system"); 
    // Stop All Transactions command received. Semua transaksi telah dihentikan. -> Dịch tiếng Việt
  }
}

function getRubicMenuItems() {
  return autoSwapRunning
    ? ["Tự Động Swap Mon & WMON", "Dừng Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"]
    : ["Tự Động Swap Mon & WMON", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"];
}

function getTayaMenuItems() {
  return tayaSwapRunning
    ? ["Tự Động Swap Token Ngẫu Nhiên", "Tự Động Swap MON & WMON", "Dừng Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"]
    : ["Tự Động Swap Token Ngẫu Nhiên", "Tự Động Swap MON & WMON", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"];
}

function getHedgemonyMenuItems() {
  return hedgemonySwapRunning
    ? ["Tự Động Swap Mon & WMON", "Tự Động Swap Mon & HEDGE", "Dừng Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"]
    : ["Tự Động Swap Mon & WMON", "Tự Động Swap Mon & HEDGE", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"];
}

function getMondaMenuItems() {
  return mondaSwapRunning
    ? ["Tự Động Swap Mon & Dak", "Tự Động Swap Mon & USDC/USDT", "{grey-fg}Tự Động Swap Mon & Monda [SẮP RA MẮT]{/grey-fg}", "Dừng Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"]
    : ["Tự Động Swap Mon & Dak", "Tự Động Swap Mon & USDC/USDT", "{grey-fg}Tự Động Swap Mon & Monda [SẮP RA MẮT]{/grey-fg}", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"];
}

function getBubbleFiMenuItems() {
  return bubbleFiSwapRunning
    ? ["Tự Động Swap Pepe & Mldk & Myk", "Dừng Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"]
    : ["Tự Động Swap Pepe & Mldk & Myk", "Xóa Lịch Sử Giao Dịch", "Quay Lại Menu Chính", "Thoát"];
}

function getMainMenuItems() {
  let items = ["Rubic Swap", "Taya Swap", "Hedgemony Swap", "Monda Swap", "BubbleFi Swap", "Hàng Chờ Giao Dịch", "Xóa Lịch Sử Giao Dịch", "Làm Mới", "Thoát"];
  if (autoSwapRunning || tayaSwapRunning || hedgemonySwapRunning || mondaSwapRunning || bubbleFiSwapRunning) {
    items.unshift("Dừng Tất Cả Giao Dịch");
  }
  return items;
}

const mainMenu = blessed.list({
  label: " Menu Chính ",
  left: "60%",
  keys: true,
  vi: true,
  mouse: true,
  border: { type: "line" },
  style: { fg: "white", bg: "default", border: { fg: "yellow" }, selected: { bg: "green", fg: "black" } },
  items: getMainMenuItems()
});

const rubicSubMenu = blessed.list({
  label: " Menu Rubic Swap ",
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
  label: " Menu Taya Swap ",
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
  label: " Menu Hedgemony Swap ",
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
  label: " Menu Monda Swap ",
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
  label: " Menu BubbleFi Swap ",
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
  label: "{bright-blue-fg}Nhập Lệnh Swap{/bright-blue-fg}",
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

  // Hộp tiêu đề (Header)
  headerBox.top = 0;
  headerBox.height = headerHeight;
  headerBox.width = "100%";

  // Hộp mô tả (Mô tả chức năng)
  descriptionBox.top = "25%";
  descriptionBox.height = Math.floor(screenHeight * 0.05);

  // Hộp log hiển thị thông tin
  logsBox.top = headerHeight + descriptionBox.height;
  logsBox.left = 0;
  logsBox.width = Math.floor(screenWidth * 0.6);
  logsBox.height = screenHeight - (headerHeight + descriptionBox.height);

  // Hộp ví (Thông tin ví)
  walletBox.top = headerHeight + descriptionBox.height;
  walletBox.left = Math.floor(screenWidth * 0.6);
  walletBox.width = Math.floor(screenWidth * 0.4);
  walletBox.height = Math.floor(screenHeight * 0.35);

  // Menu chính (Menu thao tác chính)
  mainMenu.top = headerHeight + descriptionBox.height + walletBox.height;
  mainMenu.left = Math.floor(screenWidth * 0.6);
  mainMenu.width = Math.floor(screenWidth * 0.4);
  mainMenu.height = screenHeight - (headerHeight + descriptionBox.height + walletBox.height);

  // Các menu con (Menu Swap phụ)
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

  // Render lại giao diện sau khi chỉnh layout
  safeRender();
}

screen.on("resize", adjustLayout); // Sự kiện thay đổi kích thước màn hình
adjustLayout(); // Cập nhật lại giao diện khi khởi chạy

// Thoát chương trình khi nhấn phím ESC, Q hoặc Ctrl+C
screen.key(["escape", "q", "C-c"], () => process.exit(0));

// Cuộn log lên khi nhấn Ctrl + Up
screen.key(["C-up"], () => { 
  logsBox.scroll(-1); 
  safeRender(); 
});

// Cuộn log xuống khi nhấn Ctrl + Down
screen.key(["C-down"], () => { 
  logsBox.scroll(1); 
  safeRender(); 
});

safeRender(); // Render lại màn hình
mainMenu.focus(); // Focus vào menu chính khi khởi động
updateLogs(); // Cập nhật log
updateWalletData(); // Cập nhật dữ liệu ví

// Thêm giao dịch vào hàng đợi
function addTransactionToQueue(transactionFunction, description = "Giao dịch") {
  const transactionId = ++transactionIdCounter;
  transactionQueueList.push({
    id: transactionId,
    description,
    timestamp: new Date().toLocaleTimeString(),
    status: "queued" // Trạng thái: đang chờ xử lý
  });

  // Ghi log thông báo thêm giao dịch vào hàng đợi
  addLog(`Giao dịch [${transactionId}] đã được thêm vào hàng đợi: ${description}`, "system");

  updateQueueDisplay(); // Cập nhật lại giao diện hàng đợi
}

  transactionQueue = transactionQueue.then(async () => {
    updateTransactionStatus(transactionId, "processing"); // Cập nhật trạng thái: đang xử lý
    addLog(`Giao dịch [${transactionId}] bắt đầu xử lý.`, "system");

    try {
      if (nextNonce === null) {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
        addLog(`Nonce ban đầu: ${nextNonce}`, "system");
      }

      const result = await transactionFunction(nextNonce);
      nextNonce++;

      updateTransactionStatus(transactionId, "completed"); // Cập nhật trạng thái: hoàn tất
      addLog(`Giao dịch [${transactionId}] đã hoàn thành.`, "system");

      return result;
    } catch (error) {
      updateTransactionStatus(transactionId, "error"); // Cập nhật trạng thái: lỗi
      addLog(`Giao dịch [${transactionId}] thất bại: ${error.message}`, "system");

      if (error.message && error.message.toLowerCase().includes("nonce has already been used")) {
        nextNonce++;
        addLog(`Nonce được tăng lên do đã sử dụng. Nonce mới: ${nextNonce}`, "system");
      } else if (error.message && error.message.toLowerCase().includes("rpc")) {
        let retries = 0;
        while (retries < MAX_RPC_RETRIES) {
          try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
            addLog(`RPC bình thường, đã làm mới nonce: ${nextNonce}`, "system");
            break;
          } catch (rpcError) {
            retries++;
            addLog(`Lỗi RPC, thử lại lần ${retries}: ${rpcError.message}`, "system");
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          }
        }
        if (retries === MAX_RPC_RETRIES) {
          addLog(`RPC vẫn lỗi sau ${MAX_RPC_RETRIES} lần thử. Bỏ qua giao dịch này.`, "system");
        }
      } else {
        try {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          nextNonce = await provider.getTransactionCount(globalWallet.address, "pending");
          addLog(`Đã làm mới nonce: ${nextNonce}`, "system");
        } catch (rpcError) {
          addLog(`Lỗi khi làm mới nonce: ${rpcError.message}`, "system");
        }
      }
      return;
    } finally {
      removeTransactionFromQueue(transactionId); // Xoá giao dịch khỏi hàng đợi
      updateQueueDisplay(); // Cập nhật giao diện hàng đợi
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
    label: " Hàng Đợi Giao Dịch ",
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
    addLog("Thoát khỏi menu Hàng Đợi Giao Dịch.", "system");
    clearInterval(queueUpdateInterval);
    container.destroy();
    queueMenuBox = null;
    mainMenu.show();
    mainMenu.focus();
    screen.render();
});

container.key(["a", "s", "d"], () => {
    addLog("Thoát khỏi menu Hàng Đợi Giao Dịch.", "system");
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
    addLog("Đã cập nhật số dư & ví !!", "system");
  } catch (error) {
    addLog("Lấy dữ liệu ví thất bại: " + error.message, "system");
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
      price_impact: null,                      // Độ trượt giá
      walletName: "metamask",                  // Tên ví
      deviceType: "desktop",                   // Loại thiết bị
      slippage: 0,                             // Độ trượt giá cho phép
      expected_amount: amountStr,              // Số lượng kỳ vọng
      mevbot_protection: false,                // Bảo vệ chống MEV bot
      to_amount_min: amountStr,                // Số lượng tối thiểu nhận được
      network: "monad-testnet",                // Mạng đang sử dụng
      provider: "wrapped",                     // Nhà cung cấp thanh khoản
      from_token: swapToWMON ? "0x0000000000000000000000000000000000000000" : ROUTER_ADDRESS, // Token gửi
      to_token: swapToWMON ? ROUTER_ADDRESS : "0x0000000000000000000000000000000000000000", // Token nhận
      from_amount: amountStr,                  // Số lượng gửi
      to_amount: amountStr,                    // Số lượng nhận
      user: walletAddress,                     // Địa chỉ ví người dùng
      hash: txHash,                            // Hash giao dịch
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

addLog(`Rubic: Gửi giao dịch thành công!! Tx Hash: ${getShortHash(txHash)}`, "rubic");
} catch (error) {
addLog(`Rubic: Lỗi khi gửi request API Rubic: ${error.message}`, "rubic");
}
}

async function executeSwap(index, total, wallet, swapToWMON, skipDelay = false) {
const provider = new ethers.JsonRpcProvider(RPC_URL);
const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
const amount = getRandomAmount();
addLog(`Rubic: Bắt đầu swap ${swapToWMON ? "MON ➯ WMON" : "WMON ➯ MON"} với số lượng ${ethers.formatEther(amount)}`, "rubic");

try {
  const tx = swapToWMON
    ? await router.deposit({ value: amount })
    : await router.withdraw(amount);
  
  const txHash = tx.hash;
  addLog(`Rubic: Đã gửi giao dịch....`, "rubic");
  
  await tx.wait();
  
  addLog(`Rubic: Giao dịch đã được xác nhận!!!!`, "rubic");
  
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
    addLog(`Rubic: Phần thưởng ${JSON.stringify(response.data)}`, "rubic");
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
    addLog(`Rubic: Swap ${swapToWMON ? "MON sang WMON" : "WMON sang MON"} thành công!! Tx Hash: ${getShortHash(txHash)}`, "rubic");
    addLog(`Rubic: Phản hồi API ${JSON.stringify(response.data)}`, "rubic");
  } catch (error) {
    addLog(`Rubic: Lỗi gửi thông báo tới API Rubic: ${error.message}`, "rubic");
  }
}

async function runAutoSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap Rubic:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Rubic: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "rubic");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Rubic: Dữ liệu nhập không hợp lệ. Phải là số.", "rubic");
      return;
    }
    addLog(`Rubic: Bạn đã nhập ${loopCount} lần auto swap Rubic.`, "rubic");
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
        addLog(`Rubic: Auto swap đã dừng ở vòng lặp thứ ${i}.`, "rubic");
        break;
      }
      await addTransactionToQueue(async (nonce) => {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
        const amount = getRandomAmount();
        addLog(`Rubic: Bắt đầu swap ${swapToWMON ? "MON ➯ WMON" : "WMON ➯ MON"} với số lượng ${ethers.formatEther(amount)}`, "rubic");
        const tx = swapToWMON
          ? await router.deposit({ value: amount, nonce: nonce })
          : await router.withdraw(amount, { nonce: nonce });
        addLog(`Rubic: Đã gửi Tx...`, "rubic");
        await tx.wait();
        addLog(`Rubic: Tx Đã Xác Nhận!!!`, "rubic");
        await endInitialRubicRequest(tx.hash, globalWallet.address, amount, swapToWMON);
        await sendRubicRequest(tx.hash, globalWallet.address, swapToWMON);
        await checkRubicRewards(globalWallet.address);
        await updateWalletData();
      }, `Rubic Swap (${swapToWMON ? "MON->WMON" : "WMON->MON"}) - Vòng lặp ${i}`);
      swapToWMON = !swapToWMON;
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Rubic: Đang chờ ${minutes} phút ${seconds} giây trước giao dịch tiếp theo...`, "rubic");
        await waitWithCancel(delay, "rubic");
        if (autoSwapCancelled) {
          addLog("Rubic: Auto swap đã dừng trong thời gian chờ.", "rubic");
          break;
        }
      }
    }

    autoSwapRunning = false;
rubicSubMenu.setItems(getRubicMenuItems());
mainMenu.setItems(getMainMenuItems());
screen.render();
addLog("Rubic: Auto swap đã hoàn thành.", "rubic");
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
  addLog(`Taya: Swap MON ➯ ${getTokenSymbol(path[1])}`, "taya");
  addLog(`Taya: Bắt đầu Swap với số lượng: ${ethers.formatEther(amountIn)}`, "taya");
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
    addLog(`Taya: Đã gửi giao dịch!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    await updateWalletData();
    addLog(`Taya: Giao dịch ${index}/${total} đã hoàn thành.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch ${index}: ${error.message}`, "taya");
  }
}
  
async function executeWrapMonToWMON(index, total, wallet, amountInOverride) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = amountInOverride;
  addLog(`Taya: Đang thực hiện Swap MON ➯ WMON với số lượng: ${ethers.formatEther(amount)}`, "taya");
  try {
    const tx = await router.deposit({ value: amount });
    const txHash = tx.hash;
    addLog(`Taya: Đã gửi giao dịch!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    await updateWalletData();
    addLog(`Taya: Giao dịch ${index}/${total} đã hoàn thành.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch wrap ${index}: ${error.message}`, "taya");
  }
}
async function executeUnwrapWMONToMON(index, total, wallet, amountInOverride) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = amountInOverride;
  
  addLog(`Taya: Đang thực hiện Swap WMON ➯ MON với số lượng: ${ethers.formatEther(amount)}`, "taya");
  
  try {
    const tx = await router.withdraw(amount);
    const txHash = tx.hash;
    
    addLog(`Taya: Đã gửi giao dịch!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    
    await tx.wait();
    
    addLog(`Taya: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(txHash)}`, "taya");
    
    await updateWalletData();
    
    addLog(`Taya: Giao dịch ${index}/${total} đã hoàn thành.`, "taya");
  } catch (error) {
    addLog(`Taya: Lỗi trong giao dịch unwrap ${index}: ${error.message}`, "taya");
  }
}

async function runTayaAutoSwapRandom() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap Taya (Token Ngẫu Nhiên):", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Taya: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "taya");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Taya: Dữ liệu nhập không hợp lệ. Phải là số.", "taya");
      return;
    }
    addLog(`Taya: Bạn đã nhập ${loopCount} lần auto swap Taya (Token Ngẫu Nhiên).`, "taya");
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
        addLog(`Taya: Auto swap (Token Ngẫu Nhiên) đã dừng ở vòng lặp thứ ${i}.`, "taya");
        break;
      }
      const randomToken = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      addLog(`Taya: Thực hiện swap MON ➯ ${getTokenSymbol(randomToken)}`, "taya");
      const path = [WMON_ADDRESS, randomToken];
      const amountIn = getRandomAmountTaya();
      addLog(`Taya: Sử dụng số lượng: ${ethers.formatEther(amountIn)}`, "taya");
      await addTransactionToQueue(async (nonce) => {
        await executeTayaSwapRouteWithAmount(i, loopCount, globalWallet, path, true, amountIn, nonce);
      }, `Taya Random Swap - Vòng lặp ${i}`);
      if (i < loopCount) {
        const delay = getRandomDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        addLog(`Taya: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện giao dịch tiếp theo...`, "taya");
        await waitWithCancel(delay, "taya");
        if (tayaSwapCancelled) {
          addLog("Taya: Auto swap (Token Ngẫu Nhiên) đã dừng trong thời gian chờ.", "taya");
          break;
        }
      }
    }
    
    tayaSwapRunning = false;
mainMenu.setItems(getMainMenuItems());
tayaSubMenu.setItems(getTayaMenuItems());
screen.render();
addLog("Taya: Auto swap (Token Ngẫu Nhiên) đã hoàn thành.", "taya");
});
}

async function runTayaWrapCycle() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap Taya (MON & WMON):", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Taya: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "taya");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("Taya: Dữ liệu nhập không hợp lệ. Phải là số.", "taya");
      return;
    }
    addLog(`Taya: Bạn đã nhập ${loopCount} vòng lặp để swap Taya (MON & WMON).`, "taya");
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
    addLog(`Taya: Vòng lặp swap đã dừng tại lần lặp thứ ${i}.`, "taya");
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
        addLog(`Taya: Vòng lặp ${i}: Số dư MON và WMON đều không đủ.`, "taya");
        continue;
      }
    }
  } else {
    if (wmonBalance < amountIn) {
      if (monBalance >= amountIn) {
        operation = "wrap";
        addLog("Taya: Số dư WMON không đủ, chuyển sang wrap.", "taya");
      } else {
        addLog(`Taya: Vòng lặp ${i}: Số dư WMON và MON đều không đủ.`, "taya");
        continue;
      }
    }
  }
     if (operation === "wrap") {
  await addTransactionToQueue(async (nonce) => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
    const tx = await router.deposit({ value: amountIn, nonce: nonce });
    addLog(`Taya: Đã gửi giao dịch!! Tx Hash: ${getShortHash(tx.hash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(tx.hash)}`, "taya");
    await updateWalletData();
  }, `Taya Wrap (Vòng lặp ${i})`);
} else {
  await addTransactionToQueue(async (nonce) => {
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, globalWallet);
    const data = router.interface.encodeFunctionData("withdraw", [amountIn]);
    const tx = await globalWallet.sendTransaction({ nonce: nonce, to: ROUTER_ADDRESS, data: data });
    addLog(`Taya: Đã gửi giao dịch!! Tx Hash: ${getShortHash(tx.hash)}`, "taya");
    await tx.wait();
    addLog(`Taya: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(tx.hash)}`, "taya");
    await updateWalletData();
  }, `Taya Unwrap (Vòng lặp ${i})`);
}

if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`Taya: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện vòng lặp tiếp theo...`, "taya");
  await waitWithCancel(delay, "taya");
  if (tayaSwapCancelled) {
    addLog("Taya: Vòng lặp swap đã dừng trong thời gian chờ.", "taya");
    break;
  }
}
}
    tayaSwapRunning = false;
mainMenu.setItems(getMainMenuItems());
tayaSubMenu.setItems(getTayaMenuItems());
screen.render();
addLog("Taya: Swap (MON & WMON) đã hoàn thành.", "taya");
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
        tradeSource: "EOA",  // Nguồn giao dịch
        sellTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountIn }],
        buyTokens: [{ address: WMON_ADDRESS, amount: amountIn }]
      }
    : {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA",  // Nguồn giao dịch
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
  addLog(`Hedgemony: Gửi lịch sử giao dịch thất bại (lần thử ${attempt}): ${error.message}`, "hedgemony");
  if (attempt < retries) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  } else {
    addLog("Hedgemony: Tất cả các lần thử gửi lịch sử giao dịch đều thất bại.", "hedgemony");
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
        tradeSource: "EOA", // Nguồn giao dịch
        sellTokens: [{ address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr }],
        buyTokens: [{ address: HEDGE_ADDRESS, amount: buyAmount }]
      }
    : {
        txHash: txHash,
        account: wallet.address,
        chainId: 10143,
        date: new Date().toISOString(),
        tradeSource: "EOA", // Nguồn giao dịch
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
    addLog(`Hedge Swap: Lịch sử giao dịch đã được gửi thành công`, "hedgemony");
    return;
  } catch (error) {
    addLog(`Hedge Swap: Gửi lịch sử giao dịch thất bại (lần thử ${attempt}): ${error.message}`, "hedgemony");
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      addLog("Hedge Swap: Tất cả các lần thử gửi lịch sử giao dịch đều thất bại.", "hedgemony");
    }
  }
}

async function runHedgeSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số vòng lặp swap Mon & HEDGE:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Hedge Swap: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "hedgemony");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("Hedge Swap: Dữ liệu nhập không hợp lệ. Phải là số nguyên dương.", "hedgemony");
      return;
    }
    if (hedgemonySwapRunning) {
      addLog("Hedge Swap: Giao dịch đang chạy. Vui lòng dừng giao dịch trước.", "hedgemony");
      return;
    }
hedgemonySwapRunning = true;
hedgemonySwapCancelled = false;
mainMenu.setItems(getMainMenuItems());
hedgemonySubMenu.setItems(getHedgemonyMenuItems());
hedgemonySubMenu.show();
hedgemonySubMenu.focus();
screen.render();
addLog(`Hedge Swap: Bắt đầu auto swap tổng cộng ${loopCount} vòng lặp.`, "hedgemony");

for (let i = 1; i <= loopCount; i++) {
  if (hedgemonySwapCancelled) {
    addLog(`Hedge Swap: Auto swap đã dừng ở vòng lặp thứ ${i}.`, "hedgemony");
    break;
  }
  let amountBN;
  const swapToHEDGE = (i % 2 === 1);
  if (swapToHEDGE) {
    amountBN = getRandomAmountMonToHedge();
    addLog(`Hedge Swap: Vòng lặp ${i}: Sẽ swap MON -> HEDGE với số lượng ${ethers.formatEther(amountBN)} MON`, "hedgemony");
  } else {
    amountBN = getRandomAmountHedgeToMon();
    addLog(`Hedge Swap: Vòng lặp ${i}: Sẽ swap HEDGE -> MON với số lượng ${ethers.formatUnits(amountBN, 18)} HEDGE`, "hedgemony");
    const hedgeContract = new ethers.Contract(HEDGE_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
    const hedgeBalance = await hedgeContract.balanceOf(globalWallet.address);
    if (hedgeBalance < amountBN) {
      addLog(`Hedge Swap: Số dư HEDGE không đủ. Bỏ qua vòng lặp ${i}.`, "hedgemony");
      continue;
    }
    const currentAllowance = await hedgeContract.allowance(globalWallet.address, HEDGEMONY_SWAP_CONTRACT);
    if (currentAllowance < amountBN) {
      addLog("Hedge Swap: Allowance của HEDGE không đủ, đang thực hiện approve...", "hedgemony");
      const approveTx = await hedgeContract.approve(HEDGEMONY_SWAP_CONTRACT, ethers.MaxUint256);
      addLog(`Hedge Swap: Giao dịch approve đã gửi: ${getShortHash(approveTx.hash)}`, "hedgemony");
      await approveTx.wait();
      addLog("Hedge Swap: Approve thành công.", "hedgemony");
    }
  }

    const amountStr = amountBN.toString();
let payload;
if (swapToHEDGE) {
  payload = {
    chainId: 10143, // Mã chain ID
    inputTokens: [
      { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr } // Token đầu vào: MON
    ],
    outputTokens: [
      { address: HEDGE_ADDRESS, percent: 100 } // Token đầu ra: HEDGE 100%
    ],
    recipient: globalWallet.address, // Ví nhận token
    slippage: 0.5 // Độ trượt giá cho phép
  };
} else {
  payload = {
    chainId: 10143, // Mã chain ID
    inputTokens: [
      { address: HEDGE_ADDRESS, amount: amountStr } // Token đầu vào: HEDGE
    ],
    outputTokens: [
      { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", percent: 100 } // Token đầu ra: MON 100%
    ],
    recipient: globalWallet.address, // Ví nhận token
    slippage: 0.5 // Độ trượt giá cho phép
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
    addLog(`Hedge Swap: Dữ liệu giao dịch không đầy đủ.`, "hedgemony");
  } else {
    await addTransactionToQueue(async (nonce) => {
      const tx = await globalWallet.sendTransaction({
        nonce: nonce,
        to: multicallTx.to,
        value: multicallTx.value ? BigInt(multicallTx.value) : 0n,
        data: multicallTx.data,
      });
      addLog(`Hedge Swap: Đã gửi giao dịch!! Tx Hash: ${getShortHash(tx.hash)}`, "hedgemony");
      await tx.wait();
      addLog(`Hedge Swap: Giao dịch đã xác nhận!! Tx Hash: ${getShortHash(tx.hash)}`, "hedgemony");
      await updateWalletData();
      await sendHedgeTradeHistoryWithRetry(tx.hash, globalWallet, amountStr, swapToHEDGE);
    }, "Hedge Swap");

    addLog(`Hedge Swap: Vòng lặp ${i} đã hoàn thành.`, "hedgemony");
  }
} catch (error) {
  if (error.response && error.response.data) {
    addLog(`Hedge Swap: Lỗi: ${JSON.stringify(error.response.data)}`, "hedgemony");
  } else {
    addLog(`Hedge Swap: Lỗi: ${error.message}`, "hedgemony");
  }
}
if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`Hedge Swap: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện vòng lặp tiếp theo...`, "hedgemony");
  await waitWithCancel(delay, "hedgemony");
  if (hedgemonySwapCancelled) {
    addLog("Hedge Swap: Auto swap đã dừng trong thời gian chờ.", "hedgemony");
    break;
  }
}

hedgemonySwapRunning = false;
hedgemonySubMenu.setItems(getHedgemonyMenuItems());
mainMenu.setItems(getMainMenuItems());
screen.render();
addLog("Hedge Swap: Auto swap đã hoàn thành.", "hedgemony");
});
}

async function runHedgemonySwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap Hedgemony :", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "hedgemony");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount) || loopCount <= 0) {
      addLog("Hedgemony: Dữ liệu nhập không hợp lệ. Phải là số nguyên dương.", "hedgemony");
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
addLog(`Hedgemony: Bắt đầu auto swap tổng cộng ${loopCount} lần.`, "hedgemony");

const wmonContract = new ethers.Contract(WMON_ADDRESS, ERC20_ABI_APPROVE, globalWallet);

for (let i = 1; i <= loopCount; i++) {
  if (hedgemonySwapCancelled) {
    addLog(`Hedgemony: Auto swap đã dừng tại lần lặp thứ ${i}.`, "hedgemony");
    break;
  }
  const swapToWMON = (i % 2 === 1);
  const amountBN = getRandomAmountHedgemony();
  const amountStr = amountBN.toString();

  if (!swapToWMON) {
    const wmonBalance = await wmonContract.balanceOf(globalWallet.address);
    addLog(`Hedgemony: Sẽ swap WMON ➯ MON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
    if (wmonBalance < amountBN) {
      addLog(`Hedgemony: Số dư WMON không đủ. Bỏ qua lần lặp thứ ${i}.`, "hedgemony");
      continue;
    }
    const currentAllowance = await wmonContract.allowance(globalWallet.address, HEDGEMONY_SWAP_CONTRACT);
    if (currentAllowance < amountBN) {
      addLog("Hedgemony: Allowance của WMON không đủ, đang thực hiện approve...", "hedgemony");
      const approveTx = await wmonContract.approve(HEDGEMONY_SWAP_CONTRACT, ethers.MaxUint256);
      addLog(`Hedgemony: Giao dịch approve đã gửi: ${getShortHash(approveTx.hash)}`, "hedgemony");
      await approveTx.wait();
      addLog("Hedgemony: Approve thành công.", "hedgemony");
    }
      } else {
  addLog(`Hedgemony: Sẽ swap MON ➯ WMON với số lượng ${ethers.formatEther(amountBN)}`, "hedgemony");
}

let payload;
if (swapToWMON) {
  payload = {
    chainId: 10143, // Mã chain ID
    inputTokens: [
      { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", amount: amountStr } // Token đầu vào: MON
    ],
    outputTokens: [
      { address: WMON_ADDRESS, percent: 100 } // Token đầu ra: WMON 100%
    ],
    recipient: globalWallet.address, // Ví nhận token
    slippage: 0.5 // Độ trượt giá cho phép
  };
} else {
  payload = {
    chainId: 10143, // Mã chain ID
    inputTokens: [
      { address: WMON_ADDRESS, amount: amountStr } // Token đầu vào: WMON
    ],
    outputTokens: [
      { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", percent: 100 } // Token đầu ra: MON 100%
    ],
    recipient: globalWallet.address, // Ví nhận token
    slippage: 0.5 // Độ trượt giá cho phép
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
    addLog(`Hedgemony: Đã gửi giao dịch!! Tx Hash: ${getShortHash(tx.hash)}`, "hedgemony");
    await tx.wait();
    addLog(`Hedgemony: Giao dịch đã được xác nhận!! Tx Hash: ${getShortHash(tx.hash)}`, "hedgemony");
    await sendTradeHistoryWithRetry(tx.hash, globalWallet, amountStr, swapToWMON);
    await updateWalletData();
  }, "Hedgemony Swap");

  addLog(`Hedgemony: Swap ${i}/${loopCount} đã hoàn thành.`, "hedgemony");
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
  addLog(`HedgemonySwap: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện giao dịch tiếp theo...`, "hedgemony");
  await waitWithCancel(delay, "hedgemony");

  if (hedgemonySwapCancelled) {
    addLog("Hedgemony: Auto swap đã dừng trong thời gian chờ.", "hedgemony");
    break;
  }
}
}
    hedgemonySwapRunning = false;
hedgemonySubMenu.setItems(getHedgemonyMenuItems());
mainMenu.setItems(getMainMenuItems());
screen.render();
addLog("Hedgemony: Auto swap đã hoàn thành.", "hedgemony");
});
}

function stopHedgemonySwap() {
  if (hedgemonySwapRunning) {
    hedgemonySwapCancelled = true;
    addLog("Hedgemony: Đã nhận lệnh dừng giao dịch.", "hedgemony");
  } else {
    addLog("Hedgemony: Không có giao dịch nào đang chạy.", "hedgemony");
  }
}

async function runMondaSwapMonDak() {
  promptBox.setFront();
  promptBox.readInput("Nhập số vòng lặp để swap MON & DAK:", "", async (err, value) => {
    promptBox.hide();
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    if (err || !value) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "monda");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
      return;
    }
    addLog(`MondaSwap: Bạn đã nhập ${loopCount} vòng lặp để swap MON & DAK.`, "monda");
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
    addLog(`MondaSwap: Auto swap MON & DAK đã dừng tại lần lặp thứ ${i}.`, "monda");
    break;
  }

  if (i % 2 === 1) {
    const amountIn = getRandomAmountMonForSwap();
    const balanceMON = await provider.getBalance(globalWallet.address);
    if (balanceMON < amountIn) {
      addLog(`Monda: Số dư MON không đủ để swap MON → DAK.`, "monda");
      continue;
    }

    const expectedOutput = getRandomAmountDakForSwap();
    const amountOutMin = (expectedOutput * 980n) / 1000n;
    const deadline = Math.floor(Date.now() / 1000) + 300;
    let path = [routerWETH, DAK_ADDRESS];

    addLog(`Monda: Swap MON ➯ DAK với số lượng ${ethers.formatEther(amountIn)} MON`, "monda");

    await addTransactionToQueue(async (nonce) => {
      const tx = await mondaRouter.swapExactETHForTokens(
        amountOutMin,
        path,
        globalWallet.address,
        deadline,
        { value: amountIn, nonce: nonce }
      );

         addLog(`Monda: Đã gửi giao dịch: ${getShortHash(tx.hash)}`, "monda");
await tx.wait();
addLog(`Monda: Giao dịch đã được xác nhận.`, "monda");
await updateWalletData();
}, `Monda Swap MON ➯ DAK`);
} else {
  const amountIn = getRandomAmountDakForSwap();
  const tokenContract = new ethers.Contract(DAK_ADDRESS, ERC20_ABI, provider);
  const tokenBalance = await tokenContract.balanceOf(globalWallet.address);
  if (tokenBalance < amountIn) {
    addLog(`Monda: Số dư DAK không đủ để swap DAK → MON.`, "monda");
    continue;
  }

  const tokenContractApprove = new ethers.Contract(DAK_ADDRESS, ERC20_ABI_APPROVE, globalWallet);
  const currentAllowance = await tokenContractApprove.allowance(globalWallet.address, "0xc80585f78A6e44fb46e1445006f820448840386e");
  if (currentAllowance < amountIn) {
    addLog(`Monda: Đang approve DAK...`, "monda");
    const approveTx = await tokenContractApprove.approve("0xc80585f78A6e44fb46e1445006f820448840386e", ethers.MaxUint256);
    await approveTx.wait();
    addLog(`Monda: Approve DAK thành công.`, "monda");
  }

  const expectedOutput = getRandomAmountMonForSwap();
  const amountOutMin = (expectedOutput * 980n) / 1000n;
  const deadline = Math.floor(Date.now() / 1000) + 300;
  let path = [DAK_ADDRESS, routerWETH];

  addLog(`Monda: Swap DAK ➯ MON với số lượng ${ethers.formatUnits(amountIn,18)} DAK`, "monda");

  await addTransactionToQueue(async (nonce) => {
    const tx = await mondaRouter.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      globalWallet.address,
      deadline,
      { nonce: nonce }
    );
    addLog(`Monda: Đã gửi giao dịch: ${getShortHash(tx.hash)}`, "monda");
    await tx.wait();
    addLog(`Monda: Giao dịch đã được xác nhận.`, "monda");
    await updateWalletData();
  }, `Monda Swap DAK ➯ MON`);
}

        if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`MondaSwap: Cycle thứ ${i} đã hoàn thành`);
  addLog(`MondaSwap: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện cycle tiếp theo...`, "monda");
  await waitWithCancel(delay, "monda");
  if (mondaSwapCancelled) {
    addLog(`Monda: Auto swap đã dừng trong thời gian chờ.`, "monda");
    break;
  }
}

mondaSwapRunning = false;
mainMenu.setItems(getMainMenuItems());
mondaSubMenu.setItems(getMondaMenuItems());
screen.render();
addLog("MondaSwap: Auto swap MON & DAK đã hoàn thành.", "monda");
mondaSubMenu.focus();
});
}

async function runMondaSwapMonUsdcUsdt() {
  promptBox.show();
  promptBox.setFront();
  promptBox.readInput("Nhập số vòng lặp để swap MON/USDC/USDT:", "", async (err, value) => {
    promptBox.hide();
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    if (err || !value) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc đã huỷ.", "monda");
      return;
    }

    const loopCount = parseInt(value);
if (isNaN(loopCount)) {
  addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
  return;
}
addLog(`MondaSwap: Bạn đã nhập ${loopCount} vòng lặp để swap MON/USDC/USDT.`, "monda");

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
    addLog(`MondaSwap: Auto swap MON/USDC/USDT đã dừng tại lần lặp thứ ${i}.`, "monda");
    break;
  }

      let useUSDC = ((i - 1) % 4) < 2;
let targetToken = useUSDC ? USDC_ADDRESS : "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D";

if (i % 2 === 1) {
  const amountIn = getRandomAmountMonForUsdcUsdt();
  const balanceMON = await provider.getBalance(globalWallet.address);
  if (balanceMON < amountIn) {
    addLog(`Monda: Số dư MON không đủ để swap MON → ${useUSDC ? "USDC" : "USDT"}.`, "monda");
    continue;
  }
  const expectedOutput = useUSDC ? getRandomAmountUsdcForSwap() : getRandomAmountUsdtForSwap();
  const amountOutMin = 0n;
  const deadline = Math.floor(Date.now() / 1000) + 300;
  const path = [routerWETH, targetToken];
  addLog(`Monda: Swap MON ➯ ${useUSDC ? "USDC" : "USDT"} với số lượng: ${ethers.formatEther(amountIn)} MON`, "monda");

  await addTransactionToQueue(async (nonce) => {
    const tx = await mondaRouter.swapExactETHForTokens(
      amountOutMin,
      path,
      globalWallet.address,
      deadline,
      { value: amountIn, nonce: nonce }
    );
    addLog(`Monda: Đã gửi giao dịch: ${getShortHash(tx.hash)}`, "monda");
    await tx.wait();
    addLog(`Monda: Giao dịch đã được xác nhận.`, "monda");
    await updateWalletData();
  }, `Monda Swap MON ➯ ${useUSDC ? "USDC" : "USDT"}`);
} else {
  const decimals = 6;
  const amountIn = useUSDC ? getRandomAmountUsdcForSwap() : getRandomAmountUsdtForSwap();
  const tokenContract = new ethers.Contract(targetToken, ERC20_ABI, provider);
  const tokenBalance = await tokenContract.balanceOf(globalWallet.address);
  if (tokenBalance < amountIn) {
    addLog(`Monda: Số dư ${useUSDC ? "USDC" : "USDT"} không đủ để swap về MON.`, "monda");
    continue;
  }
      const tokenContractApprove = new ethers.Contract(targetToken, ERC20_ABI_APPROVE, globalWallet);
const currentAllowance = await tokenContractApprove.allowance(globalWallet.address, "0xc80585f78A6e44fb46e1445006f820448840386e");
if (currentAllowance < amountIn) {
  addLog(`Monda: Đang thực hiện approve ${useUSDC ? "USDC" : "USDT"}...`, "monda");
  const approveTx = await tokenContractApprove.approve("0xc80585f78A6e44fb46e1445006f820448840386e", ethers.MaxUint256);
  await approveTx.wait();
  addLog(`Monda: Approve ${useUSDC ? "USDC" : "USDT"} thành công.`, "monda");
}

const expectedOutput = getRandomAmountMonForUsdcUsdt();
const amountOutMin = 0n;
const deadline = Math.floor(Date.now() / 1000) + 300;
const path = [targetToken, routerWETH];

addLog(`Monda: Swap ${useUSDC ? "USDC" : "USDT"} ➯ MON với số lượng: ${ethers.formatUnits(amountIn, decimals)} ${useUSDC ? "USDC" : "USDT"}`, "monda");

await addTransactionToQueue(async (nonce) => {
  const tx = await mondaRouter.swapExactTokensForETH(
    amountIn,
    amountOutMin,
    path,
    globalWallet.address,
    deadline,
    { nonce: nonce }
  );
  addLog(`Monda: Đã gửi giao dịch: ${getShortHash(tx.hash)}`, "monda");
  await tx.wait();
  addLog(`Monda: Giao dịch đã được xác nhận ${getShortHash(tx.hash)}`, "monda");
  await updateWalletData();
}, `Monda Swap ${useUSDC ? "USDC" : "USDT"} ➯ MON`);

if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`Monda: Vòng lặp thứ ${i} đã hoàn thành`);
  addLog(`Monda: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện vòng lặp tiếp theo...`, "monda");
  await waitWithCancel(delay, "monda");
  if (mondaSwapCancelled) {
    addLog(`Monda: Auto swap đã dừng trong thời gian chờ.`, "monda");
    break;
  }
}
}
    mondaSwapRunning = false;
mainMenu.setItems(getMainMenuItems());
mondaSubMenu.setItems(getMondaMenuItems());
screen.render();
addLog("MondaSwap: Auto swap MON/USDC/USDT đã hoàn thành.", "monda");
mondaSubMenu.focus();
});
}

async function runMondaSwapMonMonda() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap Monda (Mon & Monda):", "", async (err, value) => {
    promptBox.hide();
    mondaSubMenu.show();
    mondaSubMenu.focus();
    screen.render();
    if (err || !value) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ hoặc đã bị hủy.", "monda");
      return;
    }
    const loopCount = parseInt(value);
    if (isNaN(loopCount)) {
      addLog("MondaSwap: Dữ liệu nhập không hợp lệ. Phải là số.", "monda");
      return;
    }
    addLog(`MondaSwap: Bạn đã nhập ${loopCount} lần auto swap Mon & Monda.`, "monda");
    if (mondaSwapRunning) {
      addLog("MondaSwap: Đang có giao dịch đang chạy. Vui lòng dừng giao dịch trước khi tiếp tục.", "monda");
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
        addLog(`MondaSwap: Auto swap Mon & Monda đã dừng tại vòng lặp thứ ${i}.`, "monda");
        break;
      }

     await addTransactionToQueue(async (nonce) => {
  addLog(`MondaSwap: Vòng lặp thứ ${i}: Thực hiện swap Mon & Monda.`, "monda");
  await new Promise(resolve => setTimeout(resolve, 1000));
}, `Monda Swap Mon ➯ Monda`);

if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`MondaSwap: Vòng lặp thứ ${i} đã hoàn thành`, "monda");
  addLog(`MondaSwap: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện giao dịch tiếp theo...`, "monda");
  await waitWithCancel(delay, "monda");
  if (mondaSwapCancelled) {
    addLog("Monda: Auto swap đã dừng trong thời gian chờ.", "monda");
    break;
  }
}

mondaSwapRunning = false;
mainMenu.setItems(getMainMenuItems());
mondaSubMenu.setItems(getMondaMenuItems());
screen.render();
addLog("MondaSwap: Auto swap Mon & Monda đã hoàn thành.", "monda");
mondaSubMenu.focus();
});
}

async function runBubbleFiAutoSwap() {
  promptBox.setFront();
  promptBox.readInput("Nhập số lần swap BubbleFi:", "", async (err, value) => {
    promptBox.hide();
    screen.render();
    if (err || !value) {
      addLog("BubbleFi: Dữ liệu nhập không hợp lệ hoặc đã bị hủy.", "bubblefi");
      return;
    }

   const loopCount = parseInt(value);
if (isNaN(loopCount) || loopCount <= 0) {
  addLog("BubbleFi: Dữ liệu nhập không hợp lệ. Phải là số nguyên dương.", "bubblefi");
  return;
}
addLog(`BubbleFi: Bạn đã nhập ${loopCount} lần swap BubbleFi.`, "bubblefi");

if (bubbleFiSwapRunning) {
  addLog("BubbleFi: Đang có giao dịch đang chạy. Vui lòng dừng giao dịch trước khi tiếp tục.", "bubblefi");
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
  addLog(`BubbleFi: Đã lấy được session cho user id ${userId}`, "bubblefi");
} catch (error) {
  addLog(`BubbleFi: Lấy session thất bại: ${error.message}`, "bubblefi");
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
    addLog(`BubbleFi: Swap đã bị huỷ tại vòng lặp thứ ${i}.`, "bubblefi");
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
    addLog(`BubbleFi: Số dư ${fromToken.name} (${ethers.formatUnits(balance, 18)}) không đủ để swap ${ethers.formatUnits(amountToSwap, 18)}. Bỏ qua vòng lặp này.`, "bubblefi");
    continue;
  }


     addLog(`BubbleFi: Swap ${fromToken.name} ➯ ${toToken.name} với số lượng ${ethers.formatUnits(amountToSwap, 18)}`, "bubblefi");

await addTransactionToQueue(async (nonce) => {
  const fromTokenContractApprove = new ethers.Contract(fromToken.address, ERC20_ABI_APPROVE, globalWallet);
  const currentAllowance = await fromTokenContractApprove.allowance(globalWallet.address, BUBBLEFI_ROUTER_ADDRESS);
  if (currentAllowance < amountToSwap) {
    addLog(`BubbleFi: Cần thực hiện Approval cho ${fromToken.name}.`, "bubblefi");
    const approveTx = await fromTokenContractApprove.approve(BUBBLEFI_ROUTER_ADDRESS, ethers.MaxUint256, { nonce });
    addLog(`BubbleFi: Gửi tx approval ${fromToken.name}: ${getShortHash(approveTx.hash)}`, "bubblefi");
    await approveTx.wait();
    addLog(`BubbleFi: Approval ${fromToken.name} thành công.`, "bubblefi");
  }

  const bubbleFiRouter = new ethers.Contract(BUBBLEFI_ROUTER_ADDRESS, BUBBLEFI_ROUTER_ABI, globalWallet);
  const swapPath = [fromToken.address, toToken.address];
  let estimatedAmounts;
  try {
    estimatedAmounts = await bubbleFiRouter.getAmountsOut(amountToSwap, swapPath);
  } catch (error) {
    addLog(`BubbleFi: Lấy getAmountsOut thất bại: ${error.message}`, "bubblefi");
    return;
  }

  const outputEstimated = estimatedAmounts[estimatedAmounts.length - 1];
  if (outputEstimated === 0n) {
    addLog(`BubbleFi: Kết quả ước lượng đầu ra bằng 0, đường swap không hợp lệ.`, "bubblefi");
    return;
  }

  const amountOutMin = outputEstimated * 997n / 1000n;
  const deadline = Math.floor(Date.now() / 1000) + 300;
  addLog(`BubbleFi: Bắt đầu swap ${fromToken.name} ➯ ${toToken.name} với số lượng ${ethers.formatUnits(amountToSwap, 18)}`, "bubblefi");

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
addLog(`BubbleFi: Đã gửi Tx swap: ${getShortHash(swapTx.hash)}`, "bubblefi");
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
  addLog(`BubbleFi: Điểm thưởng nhận được: Điểm = ${pointsAwarded}, Tổng điểm = ${totalPoints}`, "bubblefi");
  await updateWalletData();
  addLog(`BubbleFi: Swap ${fromToken.name} ➯ ${toToken.name} hoàn tất.`, "bubblefi");
} catch (postError) {
  addLog(`BubbleFi: Xử lý điểm thưởng thất bại: ${postError.message}`, "bubblefi");
}

     }, `BubbleFi Swap ${fromToken.name} ➯ ${toToken.name}`);
      
if (i < loopCount) {
  const delay = getRandomDelay();
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  addLog(`BubbleFiSwap: Chu kỳ thứ ${i} đã hoàn thành`, "bubblefi");
  addLog(`BubbleFiSwap: Đang chờ ${minutes} phút ${seconds} giây trước khi thực hiện giao dịch tiếp theo...`, "bubblefi");
  
  await waitWithCancel(delay, "bubblefi");
  
  if (bubbleFiSwapCancelled) {
    addLog("BubbleFi: Auto swap đã bị dừng trong thời gian chờ.", "bubblefi");
    break;
  } 
}

} 

bubbleFiSwapRunning = false;
bubbleFiSubMenu.setItems(getBubbleFiMenuItems());
mainMenu.setItems(getMainMenuItems());
screen.render();
addLog("BubbleFi: Auto swap đã hoàn thành.", "bubblefi");

});
}

mainMenu.on("select", (item) => {
  const selected = item.getText();
  
  if (selected === "Stop All Transactions") {
    stopAllTransactions();
    mainMenu.setItems(getMainMenuItems());
    mainMenu.focus();
    screen.render();
  } else if (selected === "Rubic Swap") {
    rubicSubMenu.show();
    rubicSubMenu.focus();
    screen.render();
  } else if (selected === "Taya Swap") {
    runTayaSwap();
  } else if (selected === "Hedgemony Swap") {
    hedgemonySubMenu.show();
    hedgemonySubMenu.focus();
    screen.render();
  } else if (selected === "Monda Swap") {
    mainMenu.hide();
    mondaSubMenu.setItems(getMondaMenuItems());
    mondaSubMenu.show();
    setTimeout(() => {
      mondaSubMenu.focus();
      screen.render();
    }, 100)
  } else if (selected === "BubbleFi Swap") {
    mainMenu.hide();
    bubbleFiSubMenu.setItems(getBubbleFiMenuItems());
    bubbleFiSubMenu.show();
    setTimeout(() => {
      bubbleFiSubMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Antrian Transaksi") {
    showTransactionQueueMenu();
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Refresh") {
    updateWalletData();
    updateLogs();
    screen.render();
    addLog("Làm mới dữ liệu thành công.", "system");
    mainMenu.focus();
  } else if (selected === "Exit") {
    process.exit(0);
  }
});

rubicSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap Mon & WMON") {
    runAutoSwap();
  } else if (selected === "Stop Transaction") {
    if (autoSwapRunning) {
      autoSwapCancelled = true;
      addLog("Rubic: Đã nhận lệnh Dừng Giao Dịch.", "rubic");
    } else {
      addLog("Rubic: Không có giao dịch nào đang chạy.", "rubic");
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    rubicSubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Exit") {
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
  if (selected === "Auto Swap Random Token") {
    runTayaAutoSwapRandom();
  } else if (selected === "Auto Swap MON & WMON") {
    runTayaWrapCycle();
  } else if (selected === "Stop Transaction") {
    if (tayaSwapRunning) {
      tayaSwapCancelled = true;
      addLog("Taya: Đã nhận lệnh Dừng Giao Dịch.", "taya");
    } else {
      addLog("Taya: Không có giao dịch nào đang chạy.", "taya");
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    tayaSubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Exit") {
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
  if (selected === "Auto Swap Mon & WMON") {
    runHedgemonySwap();
  } else if (selected === "Auto Swap Mon & HEDGE") {
    runHedgeSwap();
  } else if (selected === "Stop Transaction") {
    if (hedgemonySwapRunning) {
      hedgemonySwapCancelled = true;
      addLog("Hedgemony: Đã nhận lệnh Dừng Giao Dịch.", "hedgemony");
    } else {
      addLog("Hedgemony: Không có giao dịch nào đang chạy.", "hedgemony");
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    hedgemonySubMenu.hide();
    mainMenu.show();
    mainMenu.focus();
    screen.render();
  } else if (selected === "Exit") {
    process.exit(0);
  }
});


mondaSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap Mon & Dak") {
    runMondaSwapMonDak();
  } else if (selected === "Auto Swap Mon & USDC/USDT") {
    runMondaSwapMonUsdcUsdt();
  } else if (selected === "Auto Swap Mon & Monda") {
    addLog("MondaSwap: Tính năng Auto Swap Mon & Monda sắp ra mắt.", "monda");
    mondaSubMenu.focus();
    return;
  } else if (selected === "Stop Transaction") {
    if (mondaSwapRunning) {
      mondaSwapCancelled = true;
      addLog("MondaSwap: Đã nhận lệnh Dừng Giao Dịch.", "monda");
    } else {
      addLog("MondaSwap: Không có giao dịch nào đang chạy.", "monda");
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    mondaSubMenu.hide();
    mainMenu.show();
    setTimeout(() => {
      mainMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Exit") {
    process.exit(0);
  }
});

bubbleFiSubMenu.on("select", (item) => {
  const selected = item.getText();
  if (selected === "Auto Swap Pepe & Mldk & Myk") {
    runBubbleFiAutoSwap();
  } else if (selected === "Stop Transaction") {
    if (bubbleFiSwapRunning) {
      bubbleFiSwapCancelled = true;
      addLog("BubbleFiSwap: Đã nhận lệnh Dừng Giao Dịch.", "bubblefi");
    } else {
      addLog("BubbleFiSwap: Không có giao dịch nào đang chạy.", "bubblefi");
    }
  } else if (selected === "Clear Transaction Logs") {
    clearTransactionLogs();
  } else if (selected === "Back To Main Menu") {
    bubbleFiSubMenu.hide();
    mainMenu.show();
    setTimeout(() => {
      mainMenu.focus();
      screen.render();
    }, 100);
  } else if (selected === "Exit") {
    process.exit(0);
  }
});

screen.key(["C-up"], () => { logsBox.scroll(-1); safeRender(); });
screen.key(["C-down"], () => { logsBox.scroll(1); safeRender(); });
safeRender();
mainMenu.focus();
updateLogs();
screen.render();

