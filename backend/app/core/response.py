"""统一响应格式

响应格式：
{
    "h": {
        "c": 0,          # 状态码，0=成功
        "e": "",         # 错误信息
        "s": "success",  # 状态文本
        "t": 1234567890, # 时间戳
        "apm": {}        # 分页信息（可选）
    },
    "c": {}              # 响应数据
}
"""

import time
from typing import Any, Optional

from fastapi.responses import JSONResponse


class ResponseCode:
    """响应状态码"""

    SUCCESS = 0
    INVALID_PARAMS = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    VERSION_CONFLICT = 409
    SERVER_ERROR = 500


def make_response(
    code: int = ResponseCode.SUCCESS,
    message: str = "",
    data: Any = None,
    pagination: Optional[dict] = None,
) -> dict:
    """构建统一响应"""
    status_map = {
        ResponseCode.SUCCESS: "success",
        ResponseCode.INVALID_PARAMS: "invalid_params",
        ResponseCode.UNAUTHORIZED: "unauthorized",
        ResponseCode.FORBIDDEN: "forbidden",
        ResponseCode.NOT_FOUND: "not_found",
        ResponseCode.VERSION_CONFLICT: "version_conflict",
        ResponseCode.SERVER_ERROR: "server_error",
    }

    response = {
        "h": {
            "c": code,
            "e": message,
            "s": status_map.get(code, "unknown"),
            "t": int(time.time()),
        },
        "c": data,
    }

    if pagination:
        response["h"]["apm"] = pagination

    return response


def success(data: Any = None, pagination: Optional[dict] = None) -> dict:
    """成功响应"""
    return make_response(ResponseCode.SUCCESS, "", data, pagination)


def success_with_pagination(
    data: Any, total: int, page: int, page_size: int
) -> dict:
    """带分页的成功响应"""
    pagination = {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0,
    }
    return make_response(ResponseCode.SUCCESS, "", data, pagination)


def error(code: int, message: str) -> dict:
    """错误响应"""
    return make_response(code, message, None)


def invalid_params(message: str = "参数错误") -> dict:
    """参数错误"""
    return error(ResponseCode.INVALID_PARAMS, message)


def unauthorized(message: str = "未授权") -> dict:
    """未授权"""
    return error(ResponseCode.UNAUTHORIZED, message)


def forbidden(message: str = "禁止访问") -> dict:
    """禁止访问"""
    return error(ResponseCode.FORBIDDEN, message)


def not_found(message: str = "资源不存在") -> dict:
    """资源不存在"""
    return error(ResponseCode.NOT_FOUND, message)


def version_conflict(data: Any = None, message: str = "版本冲突") -> dict:
    """版本冲突"""
    return make_response(ResponseCode.VERSION_CONFLICT, message, data)


def server_error(message: str = "服务器错误") -> dict:
    """服务器错误"""
    return error(ResponseCode.SERVER_ERROR, message)
