#!/usr/bin/env python3
"""Read jscpd JSON report and print the total duplication percentage."""

import json
import sys


def compute_duplication(report_path: str) -> float:
    """Return total duplication percentage from a jscpd JSON report."""
    try:
        with open(report_path, 'r') as file:
            data = json.load(file)
        return float(data['statistics']['total']['percentage'])
    except (FileNotFoundError, KeyError, json.JSONDecodeError):
        return 0.0


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f'Usage: {sys.argv[0]} <jscpd-report.json>', file=sys.stderr)
        sys.exit(1)
    print(compute_duplication(sys.argv[1]))
