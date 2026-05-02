"""Parse WITSML XML log files and extract curve data."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from lxml import etree

from app.models.schemas import ChannelInfo, ConfidenceLevel, WellInfo, WitsmlRecord
from app.parsers.channel_mapper import ChannelMapper


def _strip_ns(tag: str) -> str:
    """Remove XML namespace prefix from a tag name."""
    return re.sub(r"\{[^}]+\}", "", tag)


def _parse_log_data(
    log_el: etree._Element,
    ns: dict[str, str],
    mapper: ChannelMapper,
) -> tuple[list[str], list[WitsmlRecord]]:
    """Return (curve_mnemonics, records) from a single <log> element."""

    # Determine curve mnemonics ------------------------------------------
    curve_names: list[str] = []

    # Try logCurveInfo first (WITSML 1.3.1 / 1.4.1)
    for lci in log_el.findall(".//{*}logCurveInfo"):
        mnem_el = lci.find("{*}mnemonic")
        if mnem_el is not None and mnem_el.text:
            curve_names.append(mnem_el.text.strip())

    # Fallback: mnemonicList element
    if not curve_names:
        ml = log_el.find("{*}mnemonicList")
        if ml is not None and ml.text:
            curve_names = [c.strip() for c in ml.text.split(",")]

    if not curve_names:
        return [], []

    mapped = [mapper.map(c) for c in curve_names]

    # Parse data rows ----------------------------------------------------
    records: list[WitsmlRecord] = []
    time_idx: Optional[int] = None
    for i, m in enumerate(mapped):
        if m == "time":
            time_idx = i
            break

    for data_el in log_el.findall(".//{*}data"):
        raw = data_el.text if data_el.text else data_el.get("value", "")
        if not raw:
            continue
        values = [v.strip() for v in raw.split(",")]
        if len(values) != len(mapped):
            continue

        kwargs: dict[str, float | None] = {}
        t: float = 0.0
        for i, (field_name, val_str) in enumerate(zip(mapped, values)):
            if not val_str:
                continue
            try:
                fval = float(val_str)
            except ValueError:
                continue
            if field_name == "time":
                t = fval
            elif field_name and field_name != "__unmapped__":
                kwargs[field_name] = fval

        if time_idx is not None:
            kwargs["time"] = t
        elif records:
            kwargs["time"] = records[-1].time + 1.0
        else:
            kwargs["time"] = 0.0

        records.append(WitsmlRecord(**kwargs))

    return curve_names, records


class WitsmlParser:
    """High-level API: parse a WITSML XML file into WellInfo + records."""

    def __init__(self) -> None:
        self.mapper = ChannelMapper()

    def parse_file(self, path: Path) -> tuple[WellInfo, list[WitsmlRecord]]:
        tree = etree.parse(str(path))  # noqa: S320
        root = tree.getroot()

        # Extract well/log name
        name_el = root.find(".//{*}nameWell") or root.find(".//{*}name")
        well_name = name_el.text.strip() if name_el is not None and name_el.text else path.stem

        # Find first <log> element
        log_el = root.find(".//{*}log")
        if log_el is None:
            return WellInfo(id=path.stem, name=well_name), []

        curve_names, records = _parse_log_data(log_el, {}, self.mapper)

        # Build channel info
        channels: list[ChannelInfo] = []
        for cn in curve_names:
            mapped = self.mapper.map(cn)
            channels.append(
                ChannelInfo(
                    name=cn,
                    unit=self.mapper.get_unit(cn),
                    available=mapped != "__unmapped__",
                    quality=ConfidenceLevel.HIGH if mapped != "__unmapped__" else ConfidenceLevel.LOW,
                )
            )

        well = WellInfo(
            id=path.stem,
            name=well_name,
            channels=channels,
            record_count=len(records),
        )
        return well, records
