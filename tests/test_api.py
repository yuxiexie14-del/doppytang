from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient


CUSTOMER_PAYLOAD = {
    "customer_code": "21001",
    "name": "测试客户",
    "phones": ["13900000000"],
    "recipient_name": "张三",
    "address": "四川省广安市前锋区幸福街1号",
    "area_code": "21",
    "first_purchase_date": "2024-01-01",
}


def create_customer(client: TestClient) -> dict:
    response = client.post("/customers/", json=CUSTOMER_PAYLOAD)
    assert response.status_code == 201
    return response.json()


def create_contract(client: TestClient, customer_id: int) -> dict:
    payload = {
        "contract_code": "CON-2024-001",
        "customer_id": customer_id,
        "package_name": "山野草鸡定养",
        "hen_type": "草鸡母",
        "egg_type": "山野草鸡蛋",
        "total_eggs": 200,
        "price": 466.0,
        "start_date": "2024-01-02",
    }
    response = client.post("/contracts/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_batch(client: TestClient, contract_id: int) -> dict:
    payload = {
        "contract_id": contract_id,
        "name": "2024春季批次",
        "start_date": "2024-01-03",
        "status": "active",
    }
    response = client.post("/batches/", json=payload)
    assert response.status_code == 201
    return response.json()


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_customer_and_fetch(client: TestClient) -> None:
    customer = create_customer(client)
    response = client.get(f"/customers/{customer['id']}")
    assert response.status_code == 200
    assert response.json()["customer_code"] == CUSTOMER_PAYLOAD["customer_code"]


def test_duplicate_customer_code_rejected(client: TestClient) -> None:
    create_customer(client)
    response = client.post("/customers/", json=CUSTOMER_PAYLOAD)
    assert response.status_code == 400


def test_customer_update_and_delete(client: TestClient) -> None:
    customer = create_customer(client)
    update = client.put(
        f"/customers/{customer['id']}",
        json={"name": "更新客户", "phones": ["13900000001", "13900000002"]},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "更新客户"
    delete = client.delete(f"/customers/{customer['id']}")
    assert delete.status_code == 204
    not_found = client.get(f"/customers/{customer['id']}")
    assert not_found.status_code == 404


def test_contract_creation_and_listing(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    assert contract["remaining_eggs"] == 200
    list_response = client.get("/contracts/")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_batch_and_plan_flow(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    batch = create_batch(client, contract["id"])
    plan_payload = {
        "batch_id": batch["id"],
        "scheduled_date": "2024-01-05",
        "activity": "补充营养",
        "feed_amount": 15.5,
    }
    response = client.post("/rearing-plans/", json=plan_payload)
    assert response.status_code == 201
    plan = response.json()
    assert plan["activity"] == "补充营养"


def test_feeding_medication_weighing_records(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    batch = create_batch(client, contract["id"])

    feeding_payload = {
        "batch_id": batch["id"],
        "feed_type": "有机玉米",
        "quantity_kg": 12.0,
        "fed_at": "2024-01-06T08:00:00",
    }
    feeding = client.post("/feedings/", json=feeding_payload)
    assert feeding.status_code == 201

    medication_payload = {
        "batch_id": batch["id"],
        "medication_name": "维生素补剂",
        "dosage": "5ml",
        "administered_at": "2024-01-08T09:00:00",
    }
    medication = client.post("/medications/", json=medication_payload)
    assert medication.status_code == 201

    weighing_payload = {
        "batch_id": batch["id"],
        "weight_kg": 1.85,
        "recorded_at": "2024-01-09T10:00:00",
    }
    weighing = client.post("/weighings/", json=weighing_payload)
    assert weighing.status_code == 201

    assert client.get("/feedings/").status_code == 200
    assert client.get("/medications/").status_code == 200
    assert client.get("/weighings/").status_code == 200


def test_delivery_updates_remaining_eggs(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    delivery_payload = {
        "contract_id": contract["id"],
        "eggs_delivered": 30,
        "packaging": "普通家庭装30枚",
        "delivered_by": "配送员A",
        "vegetables": "油麦菜",
        "kitchen_gift": "洗碗布",
        "hen_delivered": True,
    }
    delivery = client.post("/deliveries/", json=delivery_payload)
    assert delivery.status_code == 201
    updated_contract = client.get(f"/contracts/{contract['id']}").json()
    assert updated_contract["remaining_eggs"] == 170
    assert updated_contract["hen_delivered"] is True


def test_delivery_prevents_overdraw(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    delivery_payload = {
        "contract_id": contract["id"],
        "eggs_delivered": 300,
        "packaging": "散装",
    }
    response = client.post("/deliveries/", json=delivery_payload)
    assert response.status_code == 400


def test_settlement_trial_and_create(client: TestClient) -> None:
    customer = create_customer(client)
    contract = create_contract(client, customer["id"])
    client.post(
        "/deliveries/",
        json={
            "contract_id": contract["id"],
            "eggs_delivered": 30,
            "packaging": "普通家庭装30枚",
        },
    )
    trial = client.post(
        "/settlements/trial",
        json={"contract_id": contract["id"]},
    )
    assert trial.status_code == 200
    data = trial.json()
    assert data["eggs_delivered_total"] == 30

    settlement_payload = {
        "contract_id": contract["id"],
        "settlement_date": str(date(2024, 1, 20)),
        "eggs_delivered_total": 30,
        "amount_due": 69.9,
        "amount_paid": 69.9,
        "status": "paid",
    }
    settlement = client.post("/settlements/", json=settlement_payload)
    assert settlement.status_code == 201
    listing = client.get("/settlements/")
    assert listing.status_code == 200
    assert len(listing.json()) == 1
