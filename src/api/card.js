import request from "../utils/request.js";

// 获取批次列表
export function getBatchList(data) {
  return request({
    url: "/admin/card/batch/list",
    method: "post",
    data,
  });
}

// 新增批次
export function addBatch(data) {
  return request({
    url: "/admin/card/batch/add",
    method: "post",
    data,
  });
}

// 修改批次
export function updateBatch(data) {
  return request({
    url: "/admin/card/batch/update",
    method: "post",
    data,
  });
}

// 删除批次
export function deleteBatch(id) {
  return request({
    url: `/admin/card/batch/delete/${id}`,
    method: "get",
  });
}

// 激活批次
export function activeBatch(id) {
  return request({
    url: `/admin/card/batch/active/${id}`,
    method: "post",
  });
}

// 获取三种卡牌当前激活批次
export function getActiveBatchInfo() {
  return request({
    url: "/admin/card/batch/active-info",
    method: "get",
  });
}
