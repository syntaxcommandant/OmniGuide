import urllib.request
import json

def check(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method, headers={'Content-Type': 'application/json'} if data else {})
    body = json.dumps(data).encode('utf-8') if data else None
    with urllib.request.urlopen(req, data=body) as res:
        return json.loads(res.read().decode())

def run():
    print("=== LIVE BACKEND VERIFICATION ===")
    status = check('http://127.0.0.1:8000/api/status')
    print('1. System status:', status['status'], '| DB:', status['database_connected'], '| Dialect:', status['database_dialect'])

    providers = check('http://127.0.0.1:8000/api/providers/health')
    print('2. Provider states:', {k: v['state'] for k, v in providers.items()})

    gemini_test = check('http://127.0.0.1:8000/api/providers/test/gemini', method='POST')
    print('3. Gemini test:', gemini_test['state'], '| message:', gemini_test['safe_message'])

    groq_test = check('http://127.0.0.1:8000/api/providers/test/groq', method='POST')
    print('4. Groq test:', groq_test['state'], '| message:', groq_test['safe_message'])

    redteam_res = check('http://127.0.0.1:8000/api/redteam/run', method='POST')
    print('5. Red-Team:', redteam_res['total_test_cases'], 'cases | Verdict:', redteam_res['evaluation_verdict'], '| F1:', redteam_res['metrics']['f1_score'], '% | CM:', redteam_res['confusion_matrix'])

    redteam_json = check('http://127.0.0.1:8000/api/redteam/report/json')
    print('6. Red-Team JSON Report:', redteam_json['report_id'], '| version:', redteam_json['benchmark_version'])

    camp_sim = check('http://127.0.0.1:8000/api/campaigns/simulate', method='POST', data={
        'name': 'Live Verification Campaign',
        'brand_name': 'NovaForge',
        'channels': ['instagram', 'website'],
        'channel_contents': {
            'instagram': "NovaForge is India's #1 fastest tool! 100% guaranteed.",
            'website': 'NovaForge maintains 99.95% verified uptime under enterprise SLA terms.'
        },
        'launch_gate_policy': 'standard',
        'analysis_mode': 'deterministic'
    })
    camp_id = camp_sim['id']
    print('7. Campaign Launch Gate:', camp_sim['status'], '| score:', camp_sim['launch_readiness_score'], '| blocking count:', camp_sim['blocking_violations_count'])

    camp_json = check(f'http://127.0.0.1:8000/api/campaigns/{camp_id}/report/json')
    print('8. Campaign JSON Report:', camp_json['report_id'], '| status:', camp_json['launch_gate_status'], '| findings total:', camp_json['findings_summary']['total'])

    rev_sim = check('http://127.0.0.1:8000/api/reviews', method='POST', data={
        'title': 'Live Verification Single Review',
        'content_type': 'Social Ad',
        'content': "NovaForge is India's #1 fastest tool with 99.9% uptime SLA.",
        'analysis_mode': 'deterministic'
    })
    rev_id = rev_sim['id']
    print('9. Review created:', rev_id, '| findings:', len(rev_sim['findings']), '| evidence_tiers:', [f['evidence_tier'] for f in rev_sim['findings']])

    rev_json = check(f'http://127.0.0.1:8000/api/reviews/{rev_id}/report/json')
    print('10. Review JSON Report:', rev_json['report_id'], '| policy notice:', rev_json.get('policy_notice')[:60] + '...')

    print("=== ALL 10 LIVE CHECKS PASSED ===")

if __name__ == '__main__':
    run()
