import request from "../utils/request.js";

// 获取账单列表
export function getAdminBillList(params) {
  return request({
    url: "/admin/bill/list", // 这里的路径会自动拼接到 baseURL 的 /api 后面
    method: "get",
    params,
  });
}

// 获取平台资金统计
export function getBillStatistics() {
  return request({
    url: "/admin/bill/statistics",
    method: "get",
  });
}
// 人工确认账单成功
export function KF(billId) {
  return request({
    url: "/admin/manual-bill-success?billId=" + billId,
    method: "post",
  });
}
