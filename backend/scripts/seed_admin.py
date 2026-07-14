#!/usr/bin/env python3
"""Bootstrap an admin user (development / first deploy helper).

Usage:
  cd backend && source .venv/bin/activate
  python scripts/seed_admin.py --email admin@example.com --password 'changeme12' --name Admin

Uses ADMIN_REGISTRATION_SECRET via X-Admin-Secret when configured.
"""
from __future__ import annotations

import argparse
import sys

import httpx


def main() -> int:
    parser = argparse.ArgumentParser(description="Register a VitalPlan admin user")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", default="Admin")
    parser.add_argument("--admin-secret", default="", help="Value for X-Admin-Secret")
    args = parser.parse_args()

    headers = {}
    if args.admin_secret:
        headers["X-Admin-Secret"] = args.admin_secret

    response = httpx.post(
        f"{args.base_url.rstrip('/')}/api/admin/register",
        json={"email": args.email, "password": args.password, "name": args.name, "is_admin": True},
        headers=headers,
        timeout=20.0,
    )
    print(response.status_code, response.text)
    return 0 if response.status_code < 400 else 1


if __name__ == "__main__":
    sys.exit(main())
