import json
import sys

args = sys.argv[1:]
if args[:2] == ["pr", "list"]:
    repo = args[args.index("-R") + 1]
    prs = [] if not repo.endswith("zenith") else [
        {"url": "https://github.com/ASM-Studios/zenith/pull/1", "title": "feat(a): b",
         "baseRefName": "dev", "isDraft": False,
         "statusCheckRollup": [{"conclusion": "SUCCESS"}, {"conclusion": "FAILURE"}]}
    ]
    print(json.dumps(prs))
elif args[:2] == ["run", "view"]:
    print("job\tstep\tall fine\njob\tstep\tERROR: build timed out\njob\tstep\tmore")
