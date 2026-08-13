from datetime import date, timedelta

from fastapi.testclient import TestClient


class TestAnalyticsAPI:
    """Integration tests for the analytics API."""

    def test_analytics_empty_state(self, client: TestClient):
        """Test analytics response when no habits exist."""
        response = client.get("/api/analytics")

        assert response.status_code == 200
        data = response.json()
        assert data["total_habits"] == 0
        assert data["completed_today"] == 0
        assert data["overall_completion_rate"] == 0.0
        assert data["current_longest_streak"] == 0
        assert data["best_streak"] == 0
        assert data["total_completions"] == 0
        assert len(data["weekly"]) == 7
        assert len(data["daily_30"]) == 30
        assert all(day["completed_count"] == 0 for day in data["weekly"])

    def test_analytics_counts_total_habits(self, client: TestClient):
        """Test that total_habits reflects active (non-archived) habits only."""
        client.post("/api/habits", json={"name": "Exercise"})
        archived = client.post("/api/habits", json={"name": "Old Habit"}).json()
        client.patch(f"/api/habits/{archived['id']}/archive")

        response = client.get("/api/analytics")

        assert response.status_code == 200
        assert response.json()["total_habits"] == 1

    def test_analytics_reflects_completions(self, client: TestClient):
        """Test that completing a habit today updates completed_today and totals."""
        habit = client.post("/api/habits", json={"name": "Read"}).json()
        today = date.today().isoformat()

        client.post(f"/api/habits/{habit['id']}/complete", json={"date": today})

        response = client.get("/api/analytics")
        data = response.json()

        assert data["completed_today"] == 1
        assert data["total_completions"] == 1
        assert data["weekly"][-1]["date"] == today
        assert data["weekly"][-1]["completed_count"] == 1
        assert data["daily_30"][-1]["completed_count"] == 1

    def test_analytics_streaks(self, client: TestClient):
        """Test that current and best streaks are computed across habits."""
        habit = client.post("/api/habits", json={"name": "Meditate"}).json()
        today = date.today()

        for offset in range(3):
            day = (today - timedelta(days=offset)).isoformat()
            client.post(f"/api/habits/{habit['id']}/complete", json={"date": day})

        response = client.get("/api/analytics")
        data = response.json()

        assert data["current_longest_streak"] == 3
        assert data["best_streak"] == 3
