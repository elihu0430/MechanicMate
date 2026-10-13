import sys
from pathlib import Path

# Add backend directory so 'app' can be imported anywhere
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
root = backend_dir.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

