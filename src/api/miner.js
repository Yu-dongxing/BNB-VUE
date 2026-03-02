import request from "../utils/request.js";

/**
 * 分页查询矿机列表
 * @param {Object} data 对应后端的 MinerQueryDTO
 */
export function getMinerList(data) {
  return request({
    url: '/admin/miner/list',
    method: 'post',
    data: data
  })
}