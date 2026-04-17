import os
import requests
import sys
import time

# Configuración
USERNAME = os.environ.get('NOIP_USERNAME', '')
PASSWORD = os.environ.get('NOIP_PASSWORD', '')
HOSTNAME = os.environ.get('NOIP_HOSTNAME', 'news-portal.ddns.net')
UPDATE_URL = 'https://dynupdate.no-ip.com/nic/update'

def get_public_ip():
    try:
        response = requests.get('https://api.ipify.org')
        return response.text.strip()
    except requests.RequestException as e:
        print(f"Error al obtener la IP pública: {e}", file=sys.stderr)
        return None

def update_noip_ddns(ip_address):
    try:
        auth = (USERNAME, PASSWORD)
        params = {'hostname': HOSTNAME, 'myip': ip_address}
        response = requests.get(UPDATE_URL, auth=auth, params=params)
        
        if response.status_code == 200:
            result = response.text.split()[0]
            if result == 'good':
                print("Record Updated Successfully")
                return True
            elif result == 'nochg':
                print("No change in IP, record not updated")
                return True
            elif result == 'badauth':
                print("Authentication failed. Check your credentials.", file=sys.stderr)
                return False
            elif result == 'badagent':
                print("User agent banned. Contact No-IP support.", file=sys.stderr)
                return False
            elif result == 'abuse':
                print("Abuse detected. Contact No-IP support.", file=sys.stderr)
                return False
            elif result == 'nohost':
                print("Hostname does not exist. Check your hostname.", file=sys.stderr)
                return False
            else:
                print(f"Unexpected response from No-IP: {response.text}", file=sys.stderr)
                return False
        else:
            print(f"Error en la solicitud: {response.status_code} - {response.text}", file=sys.stderr)
            return False
    except requests.RequestException as e:
        print(f"Error en la actualización de No-IP: {e}", file=sys.stderr)
        return False

def main():
    print("Service Running")
    while True:
        print("Checking public IP")
        current_ip = get_public_ip()
        if current_ip:
            update_noip_ddns(current_ip)
        else:
            print("Failed to get public IP", file=sys.stderr)
        
        # Esperar 5 minutos antes de la próxima actualización
        try:
            time.sleep(300)  # 300 segundos = 5 minutos
        except KeyboardInterrupt:
            print("\nScript detenido por el usuario.")
            sys.exit(0)

if __name__ == "__main__":
    main()