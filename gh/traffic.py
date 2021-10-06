import re
import os
import json
import datetime
import argparse
import requests

dir = os.path.dirname(os.path.realpath(__file__))

def log(msg):
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def get_traffic(repo, auth, all):

    if repo in all:
        out = all[repo]
    else:
        out = all[repo] = {}

    def save(json, key):
        if key not in out:
            out[key] = []

        for item in json[key]:
            exist = None
            for x in out[key]:
                if x['timestamp'] == item['timestamp']:
                    exist = x
                    break

            if exist:
                exist['count'] = item['count']
                exist['uniques'] = item['uniques']
            else:
                out[key].append(item)

    res = requests.get(f'https://api.github.com/repos/{repo}/traffic/views', auth=(None,auth))
    log(f'{repo} traffic/views {"OK" if res.ok else res.status_code}')

    if res.ok:
        save(res.json(), "views")

    res = requests.get(f'https://api.github.com/repos/{repo}/traffic/clones', auth=(None,auth))
    log(f'{repo} traffic/clones {"OK" if res.ok else res.status_code}')
    
    if res.ok:
        save(res.json(), "clones")

def main():
    parser = argparse.ArgumentParser()

    parser.add_argument('--token', required=True, help="User token")
    parser.add_argument('--repos', required=True, help="Path to text file containing owner/repo lines")

    args = parser.parse_args()

    with open(args.repos, 'r') as f:
        repos = f.readlines()

    print(dir)

    try:
        out = json.load(open(os.path.join(dir, 'traffic.json'), 'r'))
    except:
        out = {}

    for repo in repos:
        repo = repo.replace('\n', '').replace('https://github.com/', '')
        
        if re.match(r'^\S+\/\S+$', repo):
            get_traffic(repo, args.token, out)
        else:
            log(f'"{repo}" does not match owner/repo regex')

    json.dump(out, open(os.path.join(dir, 'traffic.json'), 'w'), indent=4)

if __name__ == "__main__":
    main()
