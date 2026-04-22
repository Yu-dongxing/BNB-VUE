import request from "../utils/request.js";

// 获取用户列表
export function getAdminUserList(params) {
  return request({
    url: "/admin/user/list", // 去掉重复的 /api
    method: "get",
    params,
  });
}

// 管理员登录
export function loginAdmin(data) {
  return request({
    url: "/admin/user/admin/login",
    method: "post",
    data,
  });
}

// 添加用户
export function addAdminUser(data) {
  return request({
    url: "/admin/user/add",
    method: "post",
    data,
  });
}

// 修改用户
export function updateAdminUser(data) {
  return request({
    url: "/admin/user/update",
    method: "put",
    data,
  });
}

// 删除用户 (注意：后端 Controller 用的是 @GetMapping)
export function deleteAdminUser(id) {
  return request({
    url: `/admin/user/delete/${id}`,
    method: "get",
  });
}

/**
 * 查询用户链上卡牌余额
 * @param {Number} userId 
 */
export function getChainNftBalance(userId,cardId) {
  return request({
    url: "/admin/user/chain-nft-balance",
    method: "get",
    params:{ userId, cardId }
  });
}

/**
 * 管理员分发 NFT 给用户
 * @param {Object} data { userId: Long, amount: Integer }
 */
export function distributeNft(data) {
  return request({
    url: "/admin/user/distribute-nft",
    method: "post",
    data,
  });
}

/**
 * 设置或清除用户后台自定义等级
 * @param {{ userId: number, customUserGrade?: number | null }} data
 */
export function setUserCustomGrade(data) {
  return request({
    url: "/admin/user/grade/set",
    method: "post",
    data,
  });
}

/**
 * 后台下发业绩 / 人工充值
 * @param {{ userId: number, amount: string, source?: string }} data
 */
export function depositUserAmount(data) {
  return request({
    url: "/admin/user/amount/deposit",
    method: "post",
    data,
  });
}

// 修改个人资料
export function updateMyProfile(data) {
  return request({
    url: "/admin/rbac/profile/update",
    method: "post",
    data
  });
}
