"""Compatibility entry point. Current acceptance suite lives in stage.py."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('stage.py')), run_name='__main__')
