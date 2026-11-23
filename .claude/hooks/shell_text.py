import re

TAG = re.compile(r"<<-?\s*(['\"]?)(\w+)\1")


def command_text(command):
    out, i, quote = [], 0, ""
    while i < len(command):
        char = command[i]
        if quote:
            if char == "\\" and quote == '"':
                out.append(command[i : i + 2])
                i += 2
                continue
            quote = "" if char == quote else quote
        elif char in "'\"":
            quote = char
        elif command.startswith("\\\n", i):
            i += 2
            continue
        elif char == "\n":
            char = ";"
        elif command.startswith("<<", i) and not command.startswith("<<<", i):
            tag = TAG.match(command, i)
            eol = command.find("\n", tag.end()) if tag else -1
            if eol != -1:
                out.append(command[i:eol])
                end = re.compile(rf"\n[ \t]*{tag.group(2)}[ \t]*(?=\n|$)").search(command, eol)
                i = end.end() if end else len(command)
                continue
        out.append(char)
        i += 1
    return "".join(out)
