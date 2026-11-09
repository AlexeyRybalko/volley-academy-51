"""Configure the dedicated website bucket; credentials remain in Actions secrets."""
import json
import os
import re
import subprocess

bucket = os.environ['CLOUDRU_BUCKET']
if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,61}[a-z0-9]', bucket):
    raise SystemExit('Invalid website bucket name')

policy = {
    'Version': '2012-10-17',
    'Statement': [{
        'Sid': 'PublicReadVolleyballWebsite',
        'Effect': 'Allow',
        'Principal': '*',
        'Action': 's3:GetObject',
        'Resource': f'arn:aws:s3:::{bucket}/*',
    }],
}
website = {'IndexDocument': {'Suffix': 'index.html'}}
base = ['aws', '--endpoint-url', 'https://s3.cloud.ru', 's3api']
subprocess.run(base + ['put-bucket-website', '--bucket', bucket,
                       '--website-configuration', json.dumps(website)], check=True)
subprocess.run(base + ['put-bucket-policy', '--bucket', bucket,
                       '--policy', json.dumps(policy)], check=True)
print('Website entry point and anonymous read-only access configured.')
