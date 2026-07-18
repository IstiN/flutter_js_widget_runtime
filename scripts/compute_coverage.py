#!/usr/bin/env python3
"""Compute line coverage percentage from an lcov.info file."""

import sys


def compute_coverage(lcov_path: str) -> float:
    """Return the line coverage percentage for the given lcov file."""
    with open(lcov_path, 'r') as file:
        content = file.read()

    total_found = 0
    total_hit = 0
    for section in content.split('SF:')[1:]:
        for line in section.strip().split('\n')[1:]:
            if line.startswith('DA:'):
                total_found += 1
                hit = int(line[3:].split(',')[1])
                if hit > 0:
                    total_hit += 1

    if total_found == 0:
        return 0.0
    return (total_hit / total_found) * 100


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f'Usage: {sys.argv[0]} <lcov.info>', file=sys.stderr)
        sys.exit(1)
    print(f'{compute_coverage(sys.argv[1]):.1f}')
