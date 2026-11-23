import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import gh_calls  # noqa: E402

TOOLS = [
    {
        "name": "zenith_pr_board",
        "description": "Open PRs by author in the Zenith repo with CI state (green/red/pending).",
        "inputSchema": {"type": "object", "properties": {"author": {"type": "string"}}},
    },
    {
        "name": "zenith_ci_failure",
        "description": "First error lines of a failed GitHub Actions run.",
        "inputSchema": {
            "type": "object",
            "properties": {"repo": {"type": "string"}, "run_id": {"type": "string"}},
            "required": ["repo", "run_id"],
        },
    },
]


def call(name, args):
    if name == "zenith_pr_board":
        return gh_calls.pr_board(args.get("author", "@me"))
    if name == "zenith_ci_failure":
        return gh_calls.ci_failure(args["repo"], args["run_id"])
    raise KeyError(name)


def handle(message):
    method, ident = message.get("method"), message.get("id")
    if ident is None:
        return None
    if method == "initialize":
        result = {
            "protocolVersion": message["params"].get("protocolVersion", "2025-06-18"),
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "zenith-gh", "version": "1"},
        }
    elif method == "tools/list":
        result = {"tools": TOOLS}
    elif method == "tools/call":
        params = message["params"]
        try:
            text, error = json.dumps(call(params["name"], params.get("arguments") or {}), separators=(",", ":")), False
        except (RuntimeError, KeyError, OSError) as exc:
            text, error = f"{type(exc).__name__}: {exc}", True
        result = {"content": [{"type": "text", "text": text}], "isError": error}
    else:
        return {"jsonrpc": "2.0", "id": ident, "error": {"code": -32601, "message": "method not found"}}
    return {"jsonrpc": "2.0", "id": ident, "result": result}


if __name__ == "__main__":
    for line in sys.stdin:
        if line.strip():
            reply = handle(json.loads(line))
            if reply:
                sys.stdout.write(json.dumps(reply) + "\n")
                sys.stdout.flush()
