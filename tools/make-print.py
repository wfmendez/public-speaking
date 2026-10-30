"""
Makes the PDFs of the emotions lesson (public/emotions/*.pdf) from the page /emotions/print.

Start the site first (npm run dev), then, from this folder's parent:
    python tools/make-print.py            # the site on http://localhost:5173
    python tools/make-print.py 5176       # the site on another port

Uses Chrome (or Edge) in headless mode; nothing else to install.
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'emotions'
PORT = sys.argv[1] if len(sys.argv) > 1 else '5173'
PARTS = {'worksheet': 'emotions-worksheet', 'cards': 'emotions-cards', 'key': 'emotions-teacher-page'}
BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'google-chrome', 'chromium',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',  # its launcher returns before the PDF is written
]


def browser() -> str:
    for b in BROWSERS:
        if Path(b).exists() or shutil.which(b):
            return b
    sys.exit('Chrome or Edge not found')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    exe = browser()
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:
        for part, name in PARTS.items():
            subprocess.run([
                exe, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', f'--user-data-dir={profile}',
                '--virtual-time-budget=6000', f'--print-to-pdf={OUT / (name + ".pdf")}',
                f'http://localhost:{PORT}/emotions/print?part={part}',
            ], check=True, capture_output=True, timeout=90)
            print(name)


if __name__ == '__main__':
    main()
