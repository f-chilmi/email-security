

import sys
import json
import dns.resolver  # type: ignore
import dns.exception # type: ignore
import smtplib
import time
import re
import socket
from email.mime.text import MIMEText

def test_dmarc(domain):
    """Test DMARC configuration"""
    try:
        dmarc_domain = f"_dmarc.{domain}"
        answers = dns.resolver.resolve(dmarc_domain, 'TXT')
        
        dmarc_record = None
        for answer in answers:
            txt_record = str(answer).strip('"')
            if txt_record.startswith('v=DMARC1'):
                dmarc_record = txt_record
                break
        
        if not dmarc_record:
            return {
                "data": {
                    "isConfigured": False,
                    "policy": None,
                    "subdomainPolicy": None,
                    "percentage": None,
                    "reportingEmails": []
                },
                "score": 0,
                "recommendations": [
                    "No DMARC record found. Implement DMARC policy to protect against email spoofing.",
                    "Start with 'p=none' policy to monitor email authentication.",
                    "Add aggregate reporting (rua) to monitor DMARC compliance."
                ]
            }
        
        # Parse DMARC record
        policy = None
        subdomain_policy = None
        percentage = 100
        reporting_emails = []
        
        parts = dmarc_record.split(';')
        for part in parts:
            part = part.strip()
            if part.startswith('p='):
                policy = part.split('=')[1]
            elif part.startswith('sp='):
                subdomain_policy = part.split('=')[1]
            elif part.startswith('pct='):
                percentage = int(part.split('=')[1])
            elif part.startswith('rua='):
                emails = part.split('=')[1].split(',')
                reporting_emails.extend([email.strip() for email in emails])
        
        # Calculate score
        score = 30  # Base score for having DMARC
        if policy == 'quarantine':
            score += 30
        elif policy == 'reject':
            score += 50
        if reporting_emails:
            score += 20
        
        recommendations = []
        if policy == 'none':
            recommendations.append("Consider upgrading DMARC policy from 'none' to 'quarantine' or 'reject'")
        if not reporting_emails:
            recommendations.append("Add aggregate reporting (rua) to monitor DMARC compliance")
        if percentage < 100:
            recommendations.append("Consider increasing DMARC percentage to 100% for full protection")
        
        return {
            "data": {
                "isConfigured": True,
                "policy": policy,
                "subdomainPolicy": subdomain_policy,
                "percentage": percentage,
                "reportingEmails": reporting_emails,
                "record": dmarc_record
            },
            "score": min(score, 100),
            "recommendations": recommendations if recommendations else ["DMARC is properly configured"]
        }
        
    except dns.exception.DNSException as e:
        return {
            "data": {"isConfigured": False, "error": str(e)},
            "score": 0,
            "recommendations": ["No DMARC record found. Implement DMARC policy to protect against email spoofing."]
        }

def test_spf(domain):
    """Test SPF configuration"""
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        
        spf_record = None
        for answer in answers:
            txt_record = str(answer).strip('"')
            if txt_record.startswith('v=spf1'):
                spf_record = txt_record
                break
        
        if not spf_record:
            return {
                "data": {
                    "isValid": False,
                    "record": None,
                    "mechanisms": [],
                    "includesCount": 0,
                    "dnsLookupCount": 0
                },
                "score": 0,
                "recommendations": [
                    "No SPF record found. Implement SPF to specify authorized mail servers.",
                    "Add SPF record starting with 'v=spf1' followed by authorized mechanisms.",
                    "End SPF record with '-all' or '~all' to handle unauthorized senders."
                ]
            }
        
        # Parse SPF mechanisms
        mechanisms = spf_record.split()[1:]  # Skip 'v=spf1'
        includes_count = len([m for m in mechanisms if m.startswith('include:')])
        
        # Estimate DNS lookup count (simplified)
        dns_lookup_count = includes_count + len([m for m in mechanisms if m.startswith(('a:', 'mx:', 'exists:'))])
        
        # Calculate score
        score = 40  # Base score for having SPF
        if spf_record.endswith('-all'):
            score += 40
        elif spf_record.endswith('~all'):
            score += 30
        elif spf_record.endswith('?all'):
            score += 10
        if dns_lookup_count <= 10:
            score += 20
        
        recommendations = []
        if not spf_record.endswith(('-all', '~all')):
            recommendations.append("End SPF record with '-all' or '~all' to handle unauthorized senders")
        if dns_lookup_count > 10:
            recommendations.append("SPF record may exceed DNS lookup limit (10). Consider consolidating mechanisms.")
        if includes_count > 5:
            recommendations.append("Consider reducing number of include mechanisms for better performance")
        
        return {
            "data": {
                "isValid": True,
                "record": spf_record,
                "mechanisms": mechanisms,
                "includesCount": includes_count,
                "dnsLookupCount": dns_lookup_count
            },
            "score": min(score, 100),
            "recommendations": recommendations if recommendations else ["SPF is properly configured"]
        }
        
    except dns.exception.DNSException as e:
        return {
            "data": {"isValid": False, "error": str(e)},
            "score": 0,
            "recommendations": ["No SPF record found. Implement SPF to specify authorized mail servers."]
        }

def test_dkim(domain):
    """Test DKIM configuration"""
    try:
        # Add this to complete test_dkim function (replace "# Common DKIM" line):

        # Common DKIM selectors to check
        selectors = ['default', 'selector1', 'selector2', 'google', 'k1', 'dkim', 'mail']
        
        dkim_found = False
        dkim_data = {}
        
        for selector in selectors:
            try:
                dkim_domain = f"{selector}._domainkey.{domain}"
                answers = dns.resolver.resolve(dkim_domain, 'TXT')
                
                for answer in answers:
                    txt_record = str(answer).strip('"')
                    if 'k=' in txt_record or 'p=' in txt_record:
                        dkim_found = True
                        dkim_data = {
                            "selector": selector,
                            "record": txt_record,
                            "isValid": True
                        }
                        break
                
                if dkim_found:
                    break
                    
            except dns.exception.DNSException:
                continue
        
        if not dkim_found:
            return {
                "data": {
                    "isValid": False,
                    "selector": None,
                    "keyLength": None,
                    "algorithm": None
                },
                "score": 0,
                "recommendations": [
                    "No DKIM record found. Implement DKIM signing for email authentication.",
                    "Configure your mail server to sign outgoing emails with DKIM.",
                    "Publish DKIM public key in DNS records."
                ]
            }
        
        # Basic DKIM validation
        score = 70  # Base score for having DKIM
        recommendations = ["DKIM is configured"]
        
        return {
            "data": dkim_data,
            "score": score,
            "recommendations": recommendations
        }
        
    except Exception as e:
        return {
            "data": {"isValid": False, "error": str(e)},
            "score": 0,
            "recommendations": ["Failed to check DKIM configuration. Verify DNS settings."]
        }

def test_mail_server(domain):
    """Test mail server connectivity"""
    try:
        # Get MX records
        mx_records = []
        try:
            answers = dns.resolver.resolve(domain, 'MX')
            mx_records = [str(answer).split()[-1] for answer in answers]
        except dns.exception.DNSException:
            return {
                "data": {
                    "mxRecords": [],
                    "echoTest": {"success": False, "errorMessage": "No MX records found"}
                },
                "score": 0,
                "recommendations": ["Configure MX records for email delivery."]
            }
        
        # Test SMTP connectivity to first MX record
        if mx_records:
            mx_host = mx_records[0].rstrip('.')
            start_time = time.time()
            
            try:
                sock = socket.create_connection((mx_host, 25), timeout=10)
                response_time = int((time.time() - start_time) * 1000)
                sock.close()
                
                echo_test = {
                    "success": True,
                    "responseTime": response_time
                }
                score = 80
                recommendations = ["Mail server is accessible"]
                
            except (socket.error, socket.timeout):
                echo_test = {
                    "success": False,
                    "errorMessage": "Cannot connect to mail server"
                }
                score = 30
                recommendations = ["Mail server connectivity issues detected."]
        else:
            echo_test = {"success": False, "errorMessage": "No MX records"}
            score = 0
            recommendations = ["Configure MX records."]
        
        return {
            "data": {
                "mxRecords": mx_records,
                "echoTest": echo_test
            },
            "score": score,
            "recommendations": recommendations
        }
        
    except Exception as e:
        return {
            "data": {
                "mxRecords": [],
                "echoTest": {"success": False, "errorMessage": str(e)}
            },
            "score": 0,
            "recommendations": ["Failed to test mail server connectivity."]
        }

def main():
    """Main function to run tests"""
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python email_tests.py <test_type> <domain>"}))
        sys.exit(1)
    
    test_type = sys.argv[1].lower()
    domain = sys.argv[2]
    
    try:
        if test_type == 'dmarc':
            result = test_dmarc(domain)
        elif test_type == 'spf':
            result = test_spf(domain)
        elif test_type == 'dkim':
            result = test_dkim(domain)
        elif test_type == 'mail_server':
            result = test_mail_server(domain)
        else:
            result = {"error": f"Unknown test type: {test_type}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "data": {"error": str(e)},
            "score": 0,
            "recommendations": [f"Test failed: {str(e)}"]
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()