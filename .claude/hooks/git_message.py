import re

from hookio import RULES

HEREDOC = re.compile(r"<<-?\s*'?(\w+)'?\n(.*?)\n\s*\1\b", re.S)


def message_of(token):
    found = HEREDOC.search(token)
    return found.group(2) if found else token


def commit_messages(args):
    messages, i = [], 0
    while i < len(args):
        arg = args[i]
        if arg in ("-m", "--message") and i + 1 < len(args):
            messages.append(message_of(args[i + 1]))
            i += 1
        elif arg.startswith("--message="):
            messages.append(message_of(arg.split("=", 1)[1]))
        elif arg.startswith("-m") and len(arg) > 2 and not arg.startswith("--"):
            messages.append(message_of(arg[2:]))
        i += 1
    return messages


def forbidden_in(text):
    return next((bad for bad in RULES["forbidden_text"] if bad in text), None)
