### 分页查询我的矿机列表
  POST /api/user/miner/list
  接口ID：416668658
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-416668658
请求参数：
示例
{
    "page": 1,页码
    "size": 10,内容大小
    "minerType": "string",  矿机类型
    "status": 0, 激活状态 (0:待激活, 1:已激活)
    "isElectricityPaid": 0, 是否已交电费 (0:否, 1:是)
    "isAccelerated": 0,  是否已加速 (0:否, 1:是)
    "minerId": "string",  矿机ID
    "startTime": "string", 时间范围筛选：开始时间
    "endTime": "string"时间范围筛选 结束时间
}
返回参数：{
  "userId": "用户id",
  "walletAddress": "用户钱包地址",
  "minerId": "矿机id",
  "minerType": "矿机类型0,1,2,3",
  "nftBurnStatus": "卡牌NFT销毁状态 0:未销毁, 1:已销毁",
  "isElectricityPaid": "是否已交电费 0:否, 1:是",
  "paymentDate": "交费日期",
  "status": "矿机状态 0:待激活, 1:运行中, 2:已过期",
  "eligibleDate": "收益起算日期",
  "isAccelerated": "是否已购买加速包 0:否, 1:是"
}

### 购买矿机
  POST /api/user/miner/purchase
  接口ID：416668659
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-416668659
请求参数：{
  "minerType": "矿机类型",   "0" ：小形矿机，"1"  ：中形矿机，"2" ：大形矿机，"3"：特殊矿机
  "quantity": "购买数量"
}
返回参数：购买成功


### 领取矿机收益
  POST /api/user/miner/claim-tokens
  接口ID：417189444
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-417189444
请求参数：{
  "address": "用户钱包地址",
  "lockType": "仓位类型: 1(L1), 2(L2), 3(L3)",
  "orderId": "业务订单号",
}
返回参数：领取成功

### 兑换未解锁碎片
  POST /api/user/miner/exchange-locked
  接口ID：417189445
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-417189445
{
  "address": "用户钱包地址",
  "lockType": "仓位类型: 1(L1), 2(L2), 3(L3)",
  "orderId": "业务订单号 (用户维度唯一)",
  "amount": "目标兑换数量 "
}

### 兑换已解锁碎片
  POST /api/user/miner/exchange-unlocked
  接口ID：417189446
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-417189446
{
  "address": "用户钱包地址",
  "lockType": "仓位类型: 1(L1), 2(L2), 3(L3)",
  "orderId": "业务订单号 (用户维度唯一)",
  "amount": "目标兑换数量 "
}

### 用户使用碎片兑换卡牌
  POST /api/user/miner/exchange-nft
  接口ID：417189447
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-417189447
请求参数：{
  "quantity": "想要兑换的卡牌数量"
}

### 缴纳电费 (激活/续费)
  POST /api/user/miner/pay-electricity
  接口ID：416668660
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-416668660
请求参数：{
  "mode": "交费模式：1 - 待激活交费（根据类型）, 2 - 即将到期交费（根据天数、数量、类型）, 3 - 已到期交费（根据类型）, 4 - 全部已到期交费",
  "minerType": "矿机类型： 模式 1, 2, 3 必填",
  "days": "模式 2 必填（如剩余3天到期的）剩余到期天数",
  "quantity": "模式 2 选填（交多少台的电费）"
}

### 购买加速包
  POST /api/user/miner/buy-acceleration
  接口ID：416668661
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-416668661
请求参数：{
  "mode": "加速模式：1 - 按矿机类型加速（全部处于等待期的该类型矿机）, 2 - 按矿机类型+数量加速（处于等待期的该类型矿机，指定数量）, 3 - 全部加速（所有处于等待期的矿机）, 4 - 单台加速（指定 userMinerId）",
  "minerType": "模式 1, 2 必填 矿机类型",
  "quantity": "模式 2 必填 矿机数量",
  "userMinerId": "模式 4 必填 矿机id"
}

### 条件筛选矿机收益记录表
  POST /api/user/miner/miner-profit-record/list
  接口ID：417230722
  接口地址：https://app.apifox.com/link/project/7774279/apis/api-417230722

请求参数：{
  "pageNo": "当前页码",
  "pageSize": "每页条数",
  "walletAddress": "用户钱包地址",
  "minerType": "矿机类型",
  "payoutStatus": "合约分发状态 (0:未发放, 1:已发放)",
  "lockType": "锁仓类型 (0:直接分发, 1:L1, 2:L2, 3:L3)",
  "distType": "分发类型 (1:入仓, 2:直接分发)",
  "startTime": "开始时间 (支持各种格式: yyyy-MM-dd, yyyy/MM/dd HH:mm:ss 等)",
  "endTime": "结束时间 (支持各种格式: yyyy-MM-dd, yyyy/MM/dd HH:mm:ss 等)",
  "txId": "交易哈希"
}
返回参数：
{
  "userId": "用户ID",
  "walletAddress": "用户钱包地址",
  "amount": "收益金额",
  "minerType": "矿机类型",
  "minerId": "矿机id",
  "lockMonths": "锁仓月份",
  "payoutStatus": "合约分发状态 0:未发放, 1:已发放",
  "chainResponse": "链上返回响应",
  "txId": "交易哈希",
  "status": "记录状态 0:无效, 1:有效",
  "lockType": "锁仓类型 0:直接分发, 1:L1, 2:L2, 3:L3",
  "distType": "分发类型 1:入仓, 2:直接分发",
  "actualOrderId": "实际生成的订单号(传给合约)"
}