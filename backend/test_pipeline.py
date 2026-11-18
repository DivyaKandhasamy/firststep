import unittest
from unittest.mock import Mock, patch

from google.genai.errors import APIError

import pipeline


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.job = pipeline.RawJob(
            source_url="https://example.com/job",
            title="Software Intern",
            company="Example",
            description="",
            portal="Example",
        )

    def test_quota_error_stops_tag_retries(self):
        client = Mock()
        client.models.generate_content.side_effect = APIError(
            429,
            {"error": {"status": "RESOURCE_EXHAUSTED", "message": "quota exceeded"}},
        )

        with patch("pipeline.time.sleep") as sleep:
            with self.assertRaises(pipeline.GeminiQuotaExceeded):
                pipeline.tag_job(client, self.job)

        client.models.generate_content.assert_called_once()
        sleep.assert_not_called()

    def test_quota_error_prevents_database_write_and_cleanup(self):
        database = Mock()
        with patch.object(pipeline, "get_supabase", return_value=database), \
             patch.object(pipeline, "scrape_all", return_value=[self.job]), \
             patch.object(pipeline, "existing_urls", return_value=set()), \
             patch.object(pipeline, "make_gemini", return_value=Mock()), \
             patch.object(
                 pipeline,
                 "tag_job",
                 side_effect=pipeline.GeminiQuotaExceeded("quota exceeded"),
             ), \
             patch.object(pipeline, "purge_old") as purge:
            result = pipeline.run(dry_run=False, only=None)

        self.assertEqual(result, 1)
        database.table.assert_not_called()
        purge.assert_not_called()


if __name__ == "__main__":
    unittest.main()
