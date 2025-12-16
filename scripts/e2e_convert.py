import requests
import sys
BASE='http://localhost:8003'
email='e2e-test+1@example.com'
password='Password123!'
# login
r = requests.post(BASE+'/auth/login', json={'email':email,'password':password})
print('login', r.status_code, r.text[:200])
if r.status_code!=200:
    sys.exit(1)

token = r.json().get('access_token')
print('token len', len(token))
# set plan
h={'Authorization':f'Bearer {token}'}
pr = requests.put(BASE+'/auth/me/plan', headers=h, json={'plan_key':'plan:1'})
print('set plan', pr.status_code, pr.text[:200])
# upload pacc.pdf
files={'file': open('c:/DocuFlowAI/pacc.pdf','rb')}
data={'type':'pdf-word','mode':'ocr'}
resp = requests.post(BASE+'/convert', headers=h, files=files, data=data, stream=True)
print('convert status', resp.status_code)
if resp.status_code==200:
    out='c:/DocuFlowAI/pacc_result.docx'
    with open(out,'wb') as f:
        for chunk in resp.iter_content(8192):
            if chunk: f.write(chunk)
    print('Saved to', out)
else:
    print('Response text:', resp.text)
