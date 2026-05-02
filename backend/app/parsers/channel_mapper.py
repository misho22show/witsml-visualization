"""Map WITSML curve mnemonics to normalized field names."""

from __future__ import annotations

_ALIAS_MAP: dict[str, str] = {
    # Depth
    "DEPTMEAS": "measured_depth",
    "DEPTH": "measured_depth",
    "DMEA": "measured_depth",
    "MD": "measured_depth",
    "DEPT": "measured_depth",
    "BDEP": "block_position",
    "BPOS": "block_position",
    "BLOCK_POS": "block_position",
    # Time
    "TIME": "time",
    "ETIM": "time",
    "DATETIME": "time",
    # Hookload
    "HKLD": "hookload",
    "HOOKLOAD": "hookload",
    "HKL": "hookload",
    "HKLA": "hookload",
    "WOH": "hookload",
    # Torque
    "TQA": "surface_torque",
    "TORQUE": "surface_torque",
    "TOR": "surface_torque",
    "STOR": "surface_torque",
    "SURFACE_TORQUE": "surface_torque",
    # RPM
    "RPM": "rpm",
    "SRPM": "rpm",
    "ROTARY_RPM": "rpm",
    # Flow
    "MFOP": "flow_rate",
    "FLOW": "flow_rate",
    "FLOWIN": "flow_rate",
    "FLWPMPS": "flow_rate",
    "FLOW_RATE": "flow_rate",
    "PUMPS": "flow_rate",
    "TFLO": "flow_rate",
    # Pressure
    "SPPA": "standpipe_pressure",
    "SPP": "standpipe_pressure",
    "STANDPIPE_PRESSURE": "standpipe_pressure",
    "APRS": "annular_pressure",
    "ANNULAR_PRESSURE": "annular_pressure",
    # ECD
    "ECD": "ecd",
    "ECDA": "ecd",
}

_UNIT_MAP: dict[str, str] = {
    "DEPTMEAS": "m",
    "DEPTH": "m",
    "DMEA": "m",
    "MD": "m",
    "DEPT": "m",
    "BDEP": "m",
    "BPOS": "m",
    "TIME": "s",
    "ETIM": "s",
    "HKLD": "klbf",
    "HOOKLOAD": "klbf",
    "HKL": "klbf",
    "HKLA": "klbf",
    "TQA": "kft.lbf",
    "TORQUE": "kft.lbf",
    "TOR": "kft.lbf",
    "RPM": "rpm",
    "SRPM": "rpm",
    "MFOP": "gpm",
    "FLOW": "gpm",
    "FLOWIN": "gpm",
    "SPPA": "psi",
    "SPP": "psi",
    "APRS": "psi",
    "ECD": "ppg",
}


class ChannelMapper:
    """Normalize WITSML curve mnemonics to internal field names."""

    def map(self, mnemonic: str) -> str:
        key = mnemonic.strip().upper()
        return _ALIAS_MAP.get(key, "__unmapped__")

    def get_unit(self, mnemonic: str) -> str:
        key = mnemonic.strip().upper()
        return _UNIT_MAP.get(key, "unitless")
