"""In-memory data store – holds parsed wells and replay engines."""

from __future__ import annotations

from pathlib import Path

from app.engines.replay import ReplayEngine
from app.models.schemas import DetectionSettings, WellInfo, WitsmlRecord
from app.parsers.witsml_parser import WitsmlParser


class DataStore:
    """Singleton-ish store initialised at app startup."""

    def __init__(self) -> None:
        self.wells: dict[str, WellInfo] = {}
        self.records: dict[str, list[WitsmlRecord]] = {}
        self.replays: dict[str, ReplayEngine] = {}
        self.settings = DetectionSettings()
        self._parser = WitsmlParser()

    def load_directory(self, data_dir: Path) -> None:
        """Scan *data_dir* for .xml files and parse them."""
        if not data_dir.is_dir():
            return
        for xml_file in sorted(data_dir.glob("*.xml")):
            well, recs = self._parser.parse_file(xml_file)
            self.wells[well.id] = well
            self.records[well.id] = recs

    def get_replay(self, well_id: str) -> ReplayEngine | None:
        if well_id not in self.records:
            return None
        if well_id not in self.replays:
            self.replays[well_id] = ReplayEngine(
                self.records[well_id], self.settings
            )
        return self.replays[well_id]

    async def reset_replay(self, well_id: str) -> ReplayEngine | None:
        """Reset replay state in-place so existing WebSocket references stay valid."""
        engine = self.get_replay(well_id)
        if engine is not None:
            await engine.reset()
        return engine
