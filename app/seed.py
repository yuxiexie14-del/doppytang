"""Database seed script."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Batch, Contract, Customer, Delivery, Feeding, Medication, RearingPlan, Settlement, Weighing


def seed(db: Session) -> None:
    if db.query(Customer).count() > 0:
        return

    customer = Customer(
        customer_code="21001",
        name="测试客户",
        phones=["13900000000"],
        recipient_name="张三",
        address="四川省广安市前锋区幸福街1号",
        area_code="21",
        first_purchase_date=date(2024, 1, 1),
    )
    db.add(customer)
    db.flush()

    contract = Contract(
        contract_code="CON-2024-001",
        customer_id=customer.id,
        package_name="山野草鸡定养",
        hen_type="草鸡母",
        egg_type="山野草鸡蛋",
        total_eggs=200,
        remaining_eggs=170,
        price=466.0,
        start_date=date(2024, 1, 2),
        hen_delivered=True,
        description="年度定养套餐",
    )
    db.add(contract)
    db.flush()

    batch = Batch(
        contract_id=contract.id,
        name="2024春季批次",
        start_date=date(2024, 1, 3),
        status="active",
        notes="首批投放",
    )
    db.add(batch)
    db.flush()

    plan = RearingPlan(
        batch_id=batch.id,
        scheduled_date=date(2024, 1, 5),
        activity="观察鸡群健康并补充营养",
        feed_amount=15.0,
    )
    feeding = Feeding(
        batch_id=batch.id,
        feed_type="有机玉米",
        quantity_kg=12.5,
        fed_at=datetime(2024, 1, 6, 8, 0, 0, tzinfo=timezone.utc),
    )
    medication = Medication(
        batch_id=batch.id,
        medication_name="维生素补剂",
        dosage="5ml",
        administered_at=datetime(2024, 1, 10, 9, 0, 0, tzinfo=timezone.utc),
    )
    weighing = Weighing(
        batch_id=batch.id,
        weight_kg=1.85,
        recorded_at=datetime(2024, 1, 12, 10, 0, 0, tzinfo=timezone.utc),
    )
    db.add_all([plan, feeding, medication, weighing])
    db.flush()

    delivery = Delivery(
        contract_id=contract.id,
        batch_id=batch.id,
        delivered_at=datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
        eggs_delivered=30,
        packaging="普通家庭装30枚",
        vegetables="油麦菜",
        kitchen_gift="洗碗布",
        delivered_by="配送员A",
        hen_delivered=True,
    )
    db.add(delivery)

    settlement = Settlement(
        contract_id=contract.id,
        settlement_date=date(2024, 1, 20),
        eggs_delivered_total=30,
        amount_due=69.9,
        amount_paid=69.9,
        status="paid",
        notes="首批配送结算",
    )
    db.add(settlement)

    db.commit()


def main() -> None:
    with SessionLocal() as session:
        seed(session)


if __name__ == "__main__":
    main()
