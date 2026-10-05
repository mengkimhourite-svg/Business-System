import subprocess
import sys
import os

def main():
    ai_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai')
    os.chdir(ai_dir)
    
    print("Starting FastAPI AI service on http://127.0.0.1:8001 ...")
    subprocess.run([
        sys.executable, '-m', 'uvicorn', 'app.main:app',
        '--host', '127.0.0.1', '--port', '8001', '--reload'
    ], check=True)

if __name__ == '__main__':
    main()
