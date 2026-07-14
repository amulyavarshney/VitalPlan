"""Authoritative order pricing (subtotal + delivery + tax)."""
from __future__ import annotations

from typing import Dict, Iterable, Mapping, Union

VENDOR_DELIVERY_FEES: Dict[str, float] = {
    "amazon": 5.99,
    "walmart": 3.95,
    "local": 2.99,
}

TAX_RATE = 0.08
TOTAL_TOLERANCE = 0.02


def _item_line_total(item: Union[Mapping, object]) -> float:
    if isinstance(item, Mapping):
        price = float(item.get("price", 0))
        quantity = int(item.get("quantity", 0))
    else:
        price = float(getattr(item, "price", 0))
        quantity = int(getattr(item, "quantity", 0))
    return price * quantity


def compute_order_totals(*, items: Iterable, vendor: str) -> Dict[str, float]:
    subtotal = round(sum(_item_line_total(item) for item in items), 2)
    delivery_fee = float(VENDOR_DELIVERY_FEES.get(vendor, VENDOR_DELIVERY_FEES["local"]))
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + delivery_fee + tax, 2)
    return {
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "tax": tax,
        "tax_rate": TAX_RATE,
        "total": total,
    }


def totals_match(client_total: float, expected_total: float) -> bool:
    return abs(round(client_total, 2) - expected_total) <= TOTAL_TOLERANCE
