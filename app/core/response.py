from fastapi.responses import JSONResponse


def envelope(ok: bool, data=None, error=None, status: int = 200):
    return JSONResponse({"ok": ok, "data": data, "error": error}, status_code=status)
