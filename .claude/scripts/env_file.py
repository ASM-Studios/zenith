import secrets
import sys
from pathlib import Path

from repo import toplevel

SECRET_HINT = "openssl rand -hex 32"


def fill_secrets(template, token=lambda: secrets.token_hex(32)):
    lines, hinted = [], False
    for line in template.splitlines():
        key, sep, value = line.partition("=")
        if hinted and sep and not value.strip():
            line = f"{key}={token()}"
        hinted = line.lstrip().startswith("#") and SECRET_HINT in line
        lines.append(line)
    return "\n".join(lines) + "\n"


def ensure_env(root):
    env, example = Path(root) / ".env", Path(root) / ".env.example"
    if env.exists():
        return env, False
    if not example.is_file():
        sys.exit(f"no .env.example in {root}")
    env.write_text(fill_secrets(example.read_text()))
    return env, True


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    env, created = ensure_env(root)
    print(f"created {env} with generated secrets" if created else f"{env} already exists, left untouched")


if __name__ == "__main__":
    main()
