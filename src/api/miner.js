import request from "../utils/request.js";

/**
 * 分页查询矿机列表
 * @param {Object} data 对应后端的 MinerQueryDTO
 */
export function getMinerList(data) {
  return request({
    url: '/admin/miner/list',
    method: 'post',
    data
  })
}

/**
 * 用户矿机统计
 * @param {Object} data
 */
export function getMinerUserStatistics(data) {
  return request({
    url: '/admin/miner/user-statistics',
    method: 'post',
    data
  })
}

/**
 * 为指定用户发放特殊矿机
 * @param {{ userId: number, quantity: number, remark?: string }} data
 */
export function assignSpecialMiner(data) {
  return request({
    url: '/admin/miner/assign-special',
    method: 'post',
    data
  })
}
