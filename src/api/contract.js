import request from "../utils/request.js";

// 查询合约基础信息
export function getContractMeta() {
  return request({
    url: "/admin/contract/payment-usdt/meta",
    method: "get",
  });
}

// 设置收款地址
export function updateTreasury(address) {
  return request({
    url: "/admin/contract/payment-usdt/treasury",
    method: "post",
    data: { address },
  });
}

// 设置最小扣款金额 (后端使用 @RequestParam BigInteger amount)
export function setMinAmount(amount) {
  return request({
    url: "/admin/contract/payment-usdt/min-amount",
    method: "post",
    params: { amount }, // 注意：@RequestParam 在 axios 中对应 params
  });
}