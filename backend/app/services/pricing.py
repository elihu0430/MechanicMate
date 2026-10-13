from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List
from backend.app.models.customer import Customer
from backend.app.models.workshop import Workshop

def quantize_money(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class PricingEngine:
    @staticmethod
    def calculate_totals(
        subtotal_parts: Decimal,
        subtotal_labour: Decimal,
        tax_rate_percent: Decimal = Decimal("15.00"),
        is_tax_exempt: bool = False,
        discount_percent: Decimal = Decimal("0.00")
    ) -> dict:
        gross_subtotal = subtotal_parts + subtotal_labour
        
        # Apply account discount if applicable
        if discount_percent > Decimal("0.00"):
            discount_amount = quantize_money(gross_subtotal * (discount_percent / Decimal("100.00")))
            discounted_subtotal = gross_subtotal - discount_amount
        else:
            discount_amount = Decimal("0.00")
            discounted_subtotal = gross_subtotal

        # Calculate VAT (15% or 0% for tax-exempt)
        if is_tax_exempt:
            tax_amount = Decimal("0.00")
            effective_tax_rate = Decimal("0.00")
        else:
            effective_tax_rate = tax_rate_percent
            tax_amount = quantize_money(discounted_subtotal * (effective_tax_rate / Decimal("100.00")))

        total = discounted_subtotal + tax_amount

        return {
            "subtotal_parts": float(quantize_money(subtotal_parts)),
            "subtotal_labour": float(quantize_money(subtotal_labour)),
            "discount_amount": float(discount_amount),
            "discounted_subtotal": float(quantize_money(discounted_subtotal)),
            "tax_rate_percent": float(effective_tax_rate),
            "tax_amount": float(tax_amount),
            "total_amount": float(quantize_money(total)),
        }

    @staticmethod
    def resolve_hourly_rate(workshop: Workshop, customer: Optional[Customer]) -> Decimal:
        if customer and customer.has_labor_rate_override and customer.custom_labor_rate_hourly:
            return Decimal(str(customer.custom_labor_rate_hourly))
        return Decimal(str(workshop.labour_rate_hourly or 480.00))

    @staticmethod
    def resolve_tax_exemption(workshop: Workshop, customer: Optional[Customer]) -> tuple[Decimal, bool]:
        if customer and customer.is_tax_exempt:
            return Decimal("0.00"), True
        return Decimal(str(workshop.tax_rate_percent or 15.00)), False
