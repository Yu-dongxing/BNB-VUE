import request from "../utils/request.js";

// --- 当前用户信息 ---
export function getCurrentAdminInfo() {
  return request({ url: "/admin/rbac/current-info", method: "get" });
}

// --- 管理员账号管理 ---
export function getAdminList() {
  return request({ url: "/admin/rbac/user/list", method: "get" });
}
export function addAdminAccount(data) {
  return request({ url: "/admin/rbac/user/add", method: "post", data });
}
export function updateAdminAccount(data) {
  return request({ url: "/admin/rbac/user/update", method: "put", data });
}
export function deleteAdminAccount(id) {
  return request({ url: `/admin/rbac/user/delete/${id}`, method: "get" }); // 改为 GET
}

// --- 角色管理 ---
export function getRoleList() {
  return request({ url: "/admin/rbac/role/list", method: "get" });
}
export function addRole(data) {
  return request({ url: "/admin/rbac/role/add", method: "post", data });
}
export function deleteRole(id) {
  return request({ url: `/admin/rbac/role/delete/${id}`, method: "get" }); // 改为 GET
}
export function assignRolePermissions(data) {
  return request({ url: "/admin/rbac/role/assign-permissions", method: "post", data });
}
// 新增：获取带权限ID的角色列表
export function getRoleListWithPerms() {
  return request({ 
    url: "/admin/rbac/role/list-with-perms", // 指向新写的后端接口
    method: "get" 
  });
}
// --- 权限管理 ---
export function getPermissionList() {
  return request({ url: "/admin/rbac/permission/list", method: "get" });
}
export function addPermission(data) {
  return request({ url: "/admin/rbac/permission/add", method: "post", data });
}
export function deletePermission(id) {
  return request({ url: `/admin/rbac/permission/delete/${id}`, method: "get" }); // 改为 GET
}
// 修改个人资料
export function updateMyProfile(data) {
  return request({
    url: "/admin/user/profile/update",
    method: "post",
    data
  });
}