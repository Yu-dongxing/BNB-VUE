import request from "../utils/request.js";

// 获取管理端提现列表 (多条件分页查询)
export function getAdminWithdrawList(data) {
  return request({
    url: "/admin/user/withdraw/list", 
    method: "post",
    data,
  });
}

// 提现审核
export function auditWithdraw(data) {
  return request({
    url: "/admin/user/withdraw/audit", 
    method: "post",
    data,
  });
}