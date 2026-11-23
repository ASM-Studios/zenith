import json
import shlex
import sys
from pathlib import Path

RULES = json.loads((Path(__file__).parent / "rules.json").read_text())


def read_payload():
    try:
        return json.load(sys.stdin)
    except ValueError:
        return {}


def command_of(payload):
    return (payload.get("tool_input") or {}).get("command", "") or ""


def split_segments(command):
    lexer = shlex.shlex(command, posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    lexer.commenters = ""
    try:
        tokens = list(lexer)
    except ValueError:
        return [command.split()]
    segments, current = [], []
    for token in tokens:
        if token and set(token) <= set("&|;()\n"):
            segments.append(current)
            current = []
        else:
            current.append(token)
    segments.append(current)
    return [s for s in segments if s]


def block(rule, fix):
    sys.stderr.write(f"zenith guidelines blocked this command: {rule}. {fix}\n")
    sys.exit(2)
